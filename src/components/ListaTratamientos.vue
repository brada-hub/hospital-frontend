<template>
  <div class="text-subtitle1 text-weight-medium q-mt-lg">Tratamiento Activo</div>

  <div v-if="!tratamientosConSeguimiento.length" class="text-grey q-pa-sm">
    Sin tratamiento activo prescrito.
  </div>

  <div
    v-else
    v-for="tratamiento in tratamientosConSeguimiento"
    :key="tratamiento.id"
    class="q-mt-sm"
  >
    <q-list bordered separator dense class="rounded-borders">
      <q-item-label header>{{ tratamiento.tipo }}: Medicamentos</q-item-label>

      <q-item v-for="receta in tratamiento.recetas" :key="receta.id">
        <q-item-section>
          <q-inner-loading :showing="isLoading[tratamiento.id]">
            <q-spinner-dots size="30px" color="primary" />
          </q-inner-loading>

          <div v-if="!isLoading[tratamiento.id]">
            <q-item-label
              >{{ receta.medicamento.nombre }} ({{ receta.medicamento.presentacion }})</q-item-label
            >
            <q-item-label caption
              >Dosis: {{ receta.dosis }} - c/{{ receta.frecuencia_horas }}h por
              {{ receta.duracion_dias }} día(s).</q-item-label
            >

            <q-list dense class="q-ml-sm q-mt-xs q-mb-sm">
              <q-item-label header class="text-caption text-weight-bold q-px-none"
                >TOMAS HOY:</q-item-label
              >

              <q-item v-if="!receta.tomas_hoy || !receta.tomas_hoy.length"
                ><q-item-section
                  ><q-item-label caption>No hay tomas para hoy.</q-item-label></q-item-section
                ></q-item
              >

              <q-item
                v-else
                v-for="toma in receta.tomas_hoy"
                :key="toma.horaEsperada"
                :class="{
                  'bg-red-1': toma.status === 'Omitida',
                  'bg-green-1': toma.status === 'Cumplida',
                }"
                class="q-py-sm"
              >
                <q-item-section avatar
                  ><q-icon
                    :name="getIconForStatus(toma.status)"
                    :color="getColorForStatus(toma.status)"
                    size="sm"
                /></q-item-section>
                <q-item-section>
                  <q-item-label
                    >{{ format(parseLaravelDate(toma.horaEsperada), 'HH:mm') }} -
                    <span class="text-weight-bold">{{ toma.status }}</span></q-item-label
                  >
                  <q-item-label
                    caption
                    v-if="toma.status === 'Cumplida' && toma.datosAdministracion"
                  >
                    <span class="row items-center q-gutter-x-sm text-grey-8">
                      <span
                        ><q-icon name="person" size="xs" />
                        {{ toma.datosAdministracion.user.nombre }}</span
                      >
                      <span
                        ><q-icon name="schedule" size="xs" />
                        {{
                          format(parseLaravelDate(toma.datosAdministracion.fecha), 'HH:mm')
                        }}h</span
                      >
                    </span>
                  </q-item-label>
                </q-item-section>
                <q-item-section
                  side
                  v-if="
                    toma.status === 'Pendiente' &&
                    esAdministrable(parseLaravelDate(toma.horaEsperada))
                  "
                >
                  <q-btn
                    unelevated
                    size="sm"
                    color="positive"
                    label="Administrar"
                    @click="abrirDialogoAdministrar(receta, toma)"
                  />
                </q-item-section>
              </q-item>
            </q-list>

            <q-expansion-item
              v-if="receta.historial_completo && receta.historial_completo.length > 0"
              dense
              icon="history"
              label="Ver Historial Completo"
              header-class="text-primary"
              class="q-mt-sm"
            >
              <q-list dense separator>
                <q-item v-for="hist in receta.historial_completo" :key="hist.horaEsperada">
                  <q-item-section avatar>
                    <q-icon
                      :name="getIconForStatus(hist.status)"
                      :color="getColorForStatus(hist.status)"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>
                      {{ format(parseLaravelDate(hist.horaEsperada), 'dd/MM/yy HH:mm') }} -
                      {{ hist.status }}
                    </q-item-label>
                    <q-item-label
                      caption
                      v-if="hist.status === 'Cumplida' && hist.datosAdministracion"
                    >
                      Por: {{ hist.datosAdministracion.user.nombre }} a las
                      {{ format(parseLaravelDate(hist.datosAdministracion.fecha), 'HH:mm') }}h
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </div>
        </q-item-section>
        <q-item-section side>
          <div class="text-caption text-negative text-weight-bold q-px-sm">
            Sig. Admin. en: {{ recetaTimers[receta.id] || '...' }}
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { api } from 'boot/axios'
import { useQuasar, Notify, Dialog } from 'quasar'
import {
  format,
  addHours,
  addMinutes,
  subMinutes,
  isPast,
  differenceInMilliseconds,
  isWithinInterval,
} from 'date-fns'

const $q = useQuasar()
const props = defineProps({ internacion: Object })
const emit = defineEmits(['recargar-pacientes'])

const tratamientosConSeguimiento = ref([])
const recetaTimers = ref({})
const intervalRefs = ref({})
const isLoading = ref({})
const omissionTimers = ref({}) // ✅ Para los timers de omisión

function parseLaravelDate(dateTimeString) {
  if (!dateTimeString) return null
  const date = new Date(dateTimeString.replace(' ', 'T'))
  return isNaN(date) ? null : date
}

const esAdministrable = (hora) => {
  const ahora = new Date()
  const ventana = { start: subMinutes(hora, 30), end: addHours(hora, 1) }
  return isWithinInterval(ahora, ventana)
}
const getIconForStatus = (status) =>
  ({ Cumplida: 'check_circle', Omitida: 'cancel', Pendiente: 'schedule' })[status] || 'schedule'
const getColorForStatus = (status) =>
  ({ Cumplida: 'positive', Omitida: 'negative', Pendiente: 'grey-8' })[status] || 'grey-8'

const fetchSeguimiento = async () => {
  // Limpia todos los timers antes de empezar para evitar fugas de memoria
  Object.values(intervalRefs.value).forEach(clearInterval)
  Object.values(omissionTimers.value).forEach(clearTimeout)

  const tratamientosActivos = props.internacion.tratamientos?.filter((t) => t.estado === 0) || []
  if (!tratamientosActivos.length) {
    tratamientosConSeguimiento.value = []
    return
  }

  const tratamientosProcesados = await Promise.all(
    tratamientosActivos.map(async (tratamiento) => {
      isLoading.value[tratamiento.id] = true
      try {
        const response = await api.get(`/seguimiento/tratamiento/${tratamiento.id}`)
        response.data.recetas.forEach((receta) => {
          iniciarTemporizadorReceta(receta)
          iniciarOmissionTimer(receta) // ✅ Inicia el timer de omisión para cada receta
        })
        return response.data
      } catch (error) {
        console.error(`Error al cargar seguimiento para tratamiento ${tratamiento.id}:`, error)
        return tratamiento
      } finally {
        isLoading.value[tratamiento.id] = false
      }
    }),
  )

  tratamientosConSeguimiento.value = tratamientosProcesados
}

// ✅ NUEVA FUNCIÓN PARA EL TIMER DE OMISIÓN
const iniciarOmissionTimer = (receta) => {
  if (omissionTimers.value[receta.id]) {
    clearTimeout(omissionTimers.value[receta.id])
  }

  const tomaPendiente = receta.tomas_hoy?.find((t) => t.status === 'Pendiente')

  if (tomaPendiente && isPast(parseLaravelDate(tomaPendiente.horaEsperada))) {
    const horaToma = parseLaravelDate(tomaPendiente.horaEsperada)
    // La tolerancia es de 15 minutos DESPUÉS de la hora programada
    const horaLimite = addMinutes(horaToma, 15)
    const ahora = new Date()

    if (isPast(horaLimite)) return // Si ya pasó el tiempo, no hacemos nada, el backend lo marcará en la próxima carga

    const msHastaLimite = differenceInMilliseconds(horaLimite, ahora)

    omissionTimers.value[receta.id] = setTimeout(() => {
      console.log(
        `Tolerancia para receta ${receta.id} expiró. Recargando para marcar como omitida.`,
      )
      emit('recargar-pacientes') // Forzamos la recarga de datos
    }, msHastaLimite)
  }
}

watch(() => props.internacion, fetchSeguimiento, { deep: true, immediate: true })

const iniciarTemporizadorReceta = (receta) => {
  if (intervalRefs.value[receta.id]) clearInterval(intervalRefs.value[receta.id])
  const tomasRealizadas = receta.administras || []
  if (tomasRealizadas.length === 0) {
    recetaTimers.value[receta.id] = '1ra Dosis Pendiente'
    return
  }
  const frecuenciaHoras = receta.frecuencia_horas
  const ultimaAdminFecha = parseLaravelDate(tomasRealizadas[0].fecha)
  if (!ultimaAdminFecha || !frecuenciaHoras) {
    recetaTimers.value[receta.id] = 'Error Fecha'
    return
  }
  let proximaAdmin = addHours(ultimaAdminFecha, frecuenciaHoras)
  while (isPast(proximaAdmin)) {
    proximaAdmin = addHours(proximaAdmin, frecuenciaHoras)
  }
  const updateTimer = () => {
    const remainingMs = differenceInMilliseconds(proximaAdmin, new Date())
    if (remainingMs <= 0) {
      clearInterval(intervalRefs.value[receta.id])
      recetaTimers.value[receta.id] = '¡Ahora!'
      fetchSeguimiento() // Recarga para mostrar el nuevo estado 'Pendiente'
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

onBeforeUnmount(() => {
  Object.values(intervalRefs.value).forEach(clearInterval)
  Object.values(omissionTimers.value).forEach(clearTimeout) // Limpiar ambos tipos de timers
})

function abrirDialogoAdministrar(receta, toma) {
  Dialog.create({
    title: `Administrar: ${receta.medicamento.nombre}`,
    message: `Confirmar administración para la toma de las ${format(parseLaravelDate(toma.horaEsperada), 'HH:mm')}.`,
    prompt: { model: '', type: 'textarea', label: 'Observaciones (opcional)' },
    cancel: true,
    persistent: true,
  }).onOk(async (observaciones) => {
    $q.loading.show({ message: 'Registrando...' })
    try {
      await api.post('/administraciones', {
        receta_id: receta.id,
        observaciones: observaciones,
      })
      Notify.create({ color: 'positive', message: 'Medicamento administrado.' })
      emit('recargar-pacientes')
    } catch (error) {
      console.error('Error al registrar:', error)
      Notify.create({ color: 'negative', message: 'Error al registrar.' })
    } finally {
      $q.loading.hide()
    }
  })
}
</script>
