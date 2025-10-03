<template>
  <div class="text-subtitle1 text-weight-medium q-mt-lg">Tratamiento Activo</div>
  <div
    v-if="!internacion.tratamientos || !internacion.tratamientos.length"
    class="text-grey q-pa-sm"
  >
    Sin tratamiento activo prescrito.
  </div>
  <div v-else v-for="tratamiento in internacion.tratamientos" :key="tratamiento.id" class="q-mt-sm">
    <q-list bordered separator dense class="rounded-borders">
      <q-item-label header>
        {{ tratamiento.tipo }}: Medicamentos
        <span v-if="tratamiento.medico" class="text-caption text-blue-8 q-ml-md">
          (Ordenado por: {{ tratamiento.medico.nombre }} {{ tratamiento.medico.apellidos }})
        </span>
      </q-item-label>

      <q-item v-for="receta in tratamiento.recetas" :key="receta.id">
        <q-item-section>
          <q-item-label>
            {{ receta.medicamento.nombre }} ({{ receta.medicamento.presentacion }})
          </q-item-label>
          <q-item-label caption>
            Dosis: {{ receta.dosis }} - cada {{ receta.frecuencia_horas }} horas.
          </q-item-label>

          <q-list dense class="q-ml-sm q-mt-xs q-mb-sm">
            <q-item-label header class="text-caption text-weight-bold q-px-none">
              TOMAS HOY:
            </q-item-label>
            <q-item
              v-for="(toma, index) in calcularTomasDelDia(receta)"
              :key="index"
              :class="
                toma.status === 'Omitida'
                  ? 'bg-red-1'
                  : toma.status === 'Cumplida'
                    ? 'bg-green-1'
                    : ''
              "
              class="q-py-none"
            >
              <q-item-section side>
                <q-icon
                  :name="
                    toma.status === 'Cumplida'
                      ? 'check_circle'
                      : toma.status === 'Omitida'
                        ? 'cancel'
                        : 'schedule'
                  "
                  :color="
                    toma.status === 'Cumplida'
                      ? 'positive'
                      : toma.status === 'Omitida'
                        ? 'negative'
                        : 'grey'
                  "
                />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-caption">
                  {{ format(toma.horaEsperada, 'HH:mm') }} -
                  <span
                    :class="
                      toma.status === 'Omitida' ? 'text-negative text-weight-bold' : 'text-grey-7'
                    "
                  >
                    {{ toma.status }}
                  </span>
                </q-item-label>
                <q-item-label caption v-if="toma.administrador">
                  Por: {{ toma.administrador.nombre }} {{ toma.administrador.apellidos }}
                </q-item-label>
              </q-item-section>

              <q-item-section
                side
                v-if="toma.status !== 'Cumplida' && !isBefore(toma.horaEsperada, new Date())"
              >
                <q-btn
                  unelevated
                  size="xs"
                  color="positive"
                  label="Administrar"
                  @click="abrirDialogoAdministrar(receta, internacion.id)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-item-section>

        <q-item-section side>
          <div class="text-caption text-negative text-weight-bold q-px-sm">
            Sig. Admin. en: {{ recetaTimers[receta.id] || 'N/A' }}
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </div>

  <div class="text-subtitle1 text-weight-medium q-mt-lg">Plan de Cuidados</div>
  <q-list v-if="!internacion.cuidados || !internacion.cuidados.length" class="text-grey q-pa-sm">
    Sin plan de cuidados definido.
  </q-list>
  <q-list v-else bordered separator dense class="q-mt-sm rounded-borders">
    <q-item v-for="cuidado in internacion.cuidados" :key="cuidado.id">
      <q-item-section>
        <q-item-label class="text-weight-bold text-blue-grey-8">{{ cuidado.tipo }}</q-item-label>
        <q-item-label caption>{{ cuidado.descripcion }}</q-item-label>

        <q-item-label
          v-if="cuidado.cuidados_aplicados && cuidado.cuidados_aplicados.length"
          caption
          class="q-pt-xs text-grey-8"
        >
          <q-icon name="check_circle" color="positive" size="16px" class="q-mr-xs" />
          Último registro:
          {{ formatDateTime(cuidado.cuidados_aplicados[0].fecha_aplicacion) }} por
          {{ cuidado.cuidados_aplicados[0].user.nombre }}
        </q-item-label>
        <q-item-label v-else caption class="text-negative q-pt-xs">
          <q-icon name="warning" color="negative" size="16px" class="q-mr-xs" />
          ¡PENDIENTE! No se ha registrado cumplimiento.
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-btn
          unelevated
          size="sm"
          color="secondary"
          icon="done"
          label="Registrar Cuidado"
          @click="abrirDialogoRegistrarCuidado(cuidado, internacion.id)"
        />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { defineProps, defineEmits, ref, onBeforeUnmount } from 'vue'
import { api } from 'boot/axios'
import { Notify, Dialog } from 'quasar'
import {
  format,
  addHours,
  isPast,
  differenceInMilliseconds,
  startOfDay,
  endOfDay,
  isSameDay,
  isBefore,
} from 'date-fns'
import { useUserStore } from 'stores/user'

const { internacion } = defineProps({
  internacion: Object,
})

const emit = defineEmits(['recargar-pacientes'])

const userStore = useUserStore()
const recetaTimers = ref({})
const intervalRefs = ref({})

// ----------------------------------------------------
// FUNCIÓN CLAVE: CÁLCULO DE TOMAS PENDIENTES DEL DÍA
// ----------------------------------------------------
const calcularTomasDelDia = (receta) => {
  const frecuenciaHoras = receta.frecuencia_horas
  if (!frecuenciaHoras || frecuenciaHoras <= 0) return []

  const tomasRequeridas = []
  const ahora = new Date()
  const hoyInicio = startOfDay(ahora)
  const hoyFin = endOfDay(ahora)

  const fechaBaseString =
    receta.administras.length > 0
      ? receta.administras[receta.administras.length - 1].fecha
      : receta.created_at

  let horaBase = new Date(fechaBaseString.replace(' ', 'T') + '.000Z')

  if (isSameDay(new Date(receta.created_at), ahora)) {
    horaBase = new Date(receta.created_at.replace(' ', 'T') + '.000Z')
  } else {
    while (isBefore(horaBase, hoyInicio)) {
      horaBase = addHours(horaBase, frecuenciaHoras)
    }
  }

  const tomasRealizadas = receta.administras || []

  for (let i = 0; i < 24 / frecuenciaHoras + 1; i++) {
    let horaEsperada = addHours(horaBase, i * frecuenciaHoras)

    if (isBefore(hoyFin, horaEsperada)) break

    const fueAdministrada = tomasRealizadas.find((admin) => {
      const horaAdmin = new Date(admin.fecha.replace(' ', 'T') + '.000Z')
      const diferenciaAceptable = (frecuenciaHoras * 3600000) / 2
      return Math.abs(differenceInMilliseconds(horaAdmin, horaEsperada)) < diferenciaAceptable
    })

    let status
    if (fueAdministrada) {
      status = 'Cumplida'
    } else if (isPast(horaEsperada) && isBefore(horaEsperada, ahora)) {
      status = 'Omitida'
    } else {
      status = 'Pendiente'
    }

    tomasRequeridas.push({
      horaEsperada: horaEsperada,
      status: status,
      administrador: fueAdministrada ? fueAdministrada.user : null,
    })
  }

  return tomasRequeridas.filter((toma) => isSameDay(toma.horaEsperada, ahora))
}

// --- Lógica del Temporizador ---
const iniciarTemporizadorReceta = (receta) => {
  if (intervalRefs.value[receta.id]) {
    clearInterval(intervalRefs.value[receta.id])
  }
  const ultimaAdminString =
    receta.administras && receta.administras.length > 0 ? receta.administras[0].fecha : null
  if (!ultimaAdminString) {
    recetaTimers.value[receta.id] = 'N/A'
    return
  }
  const ultimaAdmin = new Date(ultimaAdminString.replace(' ', 'T') + '.000Z')
  if (isNaN(ultimaAdmin.getTime())) {
    recetaTimers.value[receta.id] = 'N/A'
    return
  }
  const frecuencia = receta.frecuencia_horas
  let proximaAdmin = addHours(ultimaAdmin, frecuencia)
  while (isPast(proximaAdmin)) {
    proximaAdmin = addHours(proximaAdmin, frecuencia)
  }
  const updateTimer = () => {
    const remainingMs = differenceInMilliseconds(proximaAdmin, new Date())
    if (remainingMs <= 0) {
      clearInterval(intervalRefs.value[receta.id])
      recetaTimers.value[receta.id] = '¡Ahora!'
      return
    }
    const totalSeconds = Math.floor(remainingMs / 1000)
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const seconds = String(totalSeconds % 60).padStart(2, '0')
    recetaTimers.value[receta.id] = `${hours}:${minutes}:${seconds}`
  }
  updateTimer()
  intervalRefs.value[receta.id] = setInterval(updateTimer, 1000)
}

const limpiarTodosLosTemporizadores = () => {
  Object.keys(intervalRefs.value).forEach((key) => {
    clearInterval(intervalRefs.value[key])
  })
  intervalRefs.value = {}
}

onBeforeUnmount(limpiarTodosLosTemporizadores)

function initializeTimers() {
  limpiarTodosLosTemporizadores()
  if (internacion && internacion.tratamientos) {
    internacion.tratamientos.forEach((tratamiento) => {
      tratamiento.recetas.forEach((receta) => {
        iniciarTemporizadorReceta(receta)
      })
    })
  }
}

initializeTimers()

// --- Lógica de Administración y Cuidados ---

// ✅ CORRECCIÓN ESLint: Solo mantenemos los parámetros necesarios para la lógica interna.
function abrirDialogoAdministrar(receta) {
  const idUsuario = userStore.user?.id
  if (!idUsuario) {
    Notify.create({ color: 'negative', message: 'Error de sesión. Usuario no identificado.' })
    return
  }

  Dialog.create({
    /* ... */
  }).onOk(async (observaciones) => {
    try {
      await api.post('/administraciones', {
        receta_id: receta.id,
        user_id: idUsuario,
        fecha: new Date()
          .toISOString()
          .replace(/\.\d{3}Z$/, '')
          .replace('T', ' '),
        estado: 1,
        observaciones: observaciones,
      })
      Notify.create({ color: 'positive', message: 'Medicamento administrado correctamente.' })
      emit('recargar-pacientes')
    } catch (_error) {
      Notify.create({
        color: 'negative',
        message: _error.response?.data?.message || 'Error al registrar la administración.',
      })
    }
  })
}

// ✅ CORRECCIÓN ESLint: Solo mantenemos los parámetros necesarios para la lógica interna.
function abrirDialogoRegistrarCuidado(cuidado) {
  const idUsuario = userStore.user?.id
  if (!idUsuario) {
    Notify.create({ color: 'negative', message: 'Error de sesión. Usuario no identificado.' })
    return
  }

  Dialog.create({
    /* ... */
  }).onOk(async (observaciones) => {
    try {
      await api.post('/cuidados-aplicados', {
        cuidado_id: cuidado.id,
        observaciones: observaciones,
      })
      Notify.create({
        color: 'positive',
        message: `Cuidado "${cuidado.tipo}" registrado correctamente.`,
      })
      emit('recargar-pacientes')
    } catch {
      // ✅ Silenciamos el catch
      Notify.create({ color: 'negative', message: 'Hubo un error al registrar el cuidado.' })
    }
  })
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A'
  try {
    const date = new Date(dateTimeString.replace(' ', 'T') + '.000Z')
    if (isNaN(date)) return 'N/A'
    return format(date, 'dd/MM/yyyy HH:mm')
  } catch {
    return 'N/A'
  }
}
</script>
