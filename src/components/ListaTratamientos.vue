<template>
  <div class="q-mt-lg">
    <div class="text-h6 text-weight-medium">Tratamiento Activo</div>

    <div v-if="!tratamientosConSeguimiento.length" class="text-grey-7 q-pa-md">
      <q-icon name="healing" size="sm" class="q-mr-sm" />
      <span>Sin tratamiento activo prescrito.</span>
    </div>

    <div
      v-else
      v-for="tratamiento in tratamientosConSeguimiento"
      :key="tratamiento.id"
      class="q-mt-sm"
    >
      <q-list bordered class="rounded-borders">
        <q-item-label header class="text-subtitle1">
          {{ tratamiento.tipo }}: Medicamentos
        </q-item-label>

        <q-item
          v-for="receta in tratamiento.recetas"
          :key="receta.id"
          style="align-items: flex-start"
        >
          <q-item-section>
            <!-- Loading spinner -->
            <q-inner-loading :showing="isLoading[tratamiento.id]">
              <q-spinner-dots size="30px" color="primary" />
            </q-inner-loading>

            <div v-if="!isLoading[tratamiento.id]">
              <!-- Header de la receta -->
              <div class="row items-center justify-between">
                <div>
                  <q-item-label class="text-body1 text-weight-bold">
                    {{ receta.medicamento.nombre }}
                  </q-item-label>
                  <q-item-label caption>
                    Dosis: {{ receta.dosis }} - c/{{ receta.frecuencia_horas }}h
                  </q-item-label>
                </div>

                <!-- RF-07: Temporizador visual para próxima dosis -->
                <div
                  class="text-caption text-negative text-weight-bold q-px-sm bg-red-1 rounded-borders q-pa-xs"
                >
                  Próxima dosis en: {{ recetaTimers[receta.id] || 'Calculando...' }}
                </div>
              </div>

              <!-- RF-06: Cronograma visual del día -->
              <div class="q-mt-md">
                <div class="text-subtitle2 q-mb-sm">Cronograma de Hoy:</div>

                <q-timeline color="primary" layout="dense">
                  <!-- Sin tomas programadas -->
                  <q-timeline-entry
                    v-if="!receta.tomas_hoy || !receta.tomas_hoy.length"
                    title="Sin tomas programadas para hoy"
                    icon="event_busy"
                    color="grey"
                  />

                  <!-- Tomas del día -->
                  <q-timeline-entry
                    v-else
                    v-for="toma in receta.tomas_hoy"
                    :key="toma.id || toma.horaReal"
                    :title="toma.status"
                    :subtitle="formatHora(toma.horaReal)"
                    :color="getColorForStatus(toma.status)"
                    :icon="getIconForStatus(toma.status)"
                  >
                    <!-- RF-03: Información de administración -->
                    <div v-if="toma.datosAdministracion">
                      <div class="text-caption row items-center no-wrap">
                        <q-icon name="person" size="xs" class="q-mr-xs" />
                        <span>
                          Por: {{ toma.datosAdministracion.user.nombre }}
                          {{ toma.datosAdministracion.user.apellidos }}
                        </span>
                      </div>
                      <div
                        v-if="toma.datosAdministracion.observaciones"
                        class="text-caption text-grey-7 q-mt-xs"
                      >
                        Obs: {{ toma.datosAdministracion.observaciones }}
                      </div>
                    </div>

                    <!-- RF-02: Botón de administración (solo visible según RF-07) -->
                    <q-btn
                      v-if="esBotonVisible(toma)"
                      unelevated
                      size="sm"
                      :color="toma.status === '¡ATRASADA!' ? 'deep-orange' : 'positive'"
                      :label="
                        toma.status === '¡ATRASADA!' ? 'Administrar (Atrasada)' : 'Administrar'
                      "
                      @click="abrirDialogoAdministrar(receta, toma)"
                      class="q-mt-sm"
                    />
                  </q-timeline-entry>
                </q-timeline>
              </div>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import {
  format,
  addHours,
  subMinutes,
  isPast,
  differenceInMilliseconds,
  isWithinInterval,
  addDays,
} from 'date-fns'

const props = defineProps({
  internacion: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['recargar-pacientes'])

const $q = useQuasar()
const tratamientosConSeguimiento = ref([])
const recetaTimers = ref({})
const intervalRefs = ref({})
const isLoading = ref({})

/**
 * Convierte string de Laravel a objeto Date
 */
function parseLaravelDate(dateTimeString) {
  if (!dateTimeString) return null
  const date = new Date(dateTimeString.toString().replace(' ', 'T'))
  return isNaN(date) ? null : date
}

/**
 * Formatea hora para mostrar (HH:mm)
 */
function formatHora(dateTimeString) {
  const fecha = parseLaravelDate(dateTimeString)
  return fecha ? format(fecha, 'HH:mm') : '--:--'
}

/**
 * RF-07: Verifica si una dosis es administrable (ventana de tiempo)
 * Ventana: 30 minutos antes hasta 2 horas después
 */
const esAdministrable = (hora) => {
  if (!hora) return false
  const ahora = new Date()
  const ventana = {
    start: subMinutes(hora, 30),
    end: addHours(hora, 2),
  }
  return isWithinInterval(ahora, ventana)
}

/**
 * RF-06, RF-07: Determina si el botón "Administrar" debe mostrarse
 */
const esBotonVisible = (toma) => {
  if (!toma) return false
  const hora = parseLaravelDate(toma.horaReal)
  if (!hora) return false

  // 🔥 SI NO TIENE ID → Es la PRIMERA DOSIS, SIEMPRE mostrar botón
  if (!toma.id) return true

  // Si está pendiente y dentro de la ventana (30m antes / 2h después)
  if (toma.status === 'Pendiente' && esAdministrable(hora)) return true

  // RF-06: Si está atrasada, mostrar botón para permitir registro tardío
  if (toma.status === '¡ATRASADA!') return true

  // No mostrar botón para dosis ya cumplidas
  return false
}

/**
 * RF-06: Iconos según estado
 */
const getIconForStatus = (status) => {
  const icons = {
    Cumplida: 'check_circle',
    'Cumplida (Retrasada)': 'check_circle',
    Omitida: 'cancel',
    Pendiente: 'schedule',
    '¡ATRASADA!': 'warning',
  }
  return icons[status] || 'schedule'
}

/**
 * RF-06: Colores según estado
 */
const getColorForStatus = (status) => {
  const colors = {
    Cumplida: 'positive',
    'Cumplida (Retrasada)': 'deep-orange',
    Omitida: 'negative',
    Pendiente: 'grey-8',
    '¡ATRASADA!': 'deep-orange',
  }
  return colors[status] || 'grey-8'
}

/**
 * RF-06, RF-07: Cargar seguimiento de tratamientos activos
 */
const fetchSeguimiento = async () => {
  // Limpiar intervalos previos
  Object.values(intervalRefs.value).forEach(clearInterval)
  intervalRefs.value = {}

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

        // RF-07: Iniciar temporizador para cada receta
        response.data.recetas.forEach((receta) => {
          iniciarTemporizadorReceta(receta, tratamiento)
        })

        return response.data
      } catch (error) {
        console.error(`Error al cargar seguimiento para tratamiento ${tratamiento.id}:`, error)
        $q.notify({
          color: 'negative',
          message: `Error al cargar tratamiento ${tratamiento.tipo}`,
          icon: 'error',
        })
        return tratamiento
      } finally {
        isLoading.value[tratamiento.id] = false
      }
    }),
  )

  tratamientosConSeguimiento.value = tratamientosProcesados
}

/**
 * RF-07: Iniciar temporizador de cuenta regresiva para próxima dosis
 */
const iniciarTemporizadorReceta = (receta, tratamiento) => {
  // Limpiar intervalo previo si existe
  if (intervalRefs.value[receta.id]) {
    clearInterval(intervalRefs.value[receta.id])
  }

  const inicioTratamiento = parseLaravelDate(tratamiento.fecha_inicio)
  const finTratamiento = addDays(inicioTratamiento, receta.duracion_dias)

  // Verificar si el tratamiento ya finalizó
  if (isPast(finTratamiento)) {
    recetaTimers.value[receta.id] = 'Finalizado'
    return
  }

  const tomasHoy = receta.tomas_hoy || []
  const proximaTomaPendiente = tomasHoy.find(
    (t) => t.status === 'Pendiente' || t.status === '¡ATRASADA!',
  )

  if (!proximaTomaPendiente) {
    recetaTimers.value[receta.id] = 'Completo por hoy'
    return
  }

  const proximaAdmin = parseLaravelDate(proximaTomaPendiente.horaReal)

  const updateTimer = () => {
    const remainingMs = differenceInMilliseconds(proximaAdmin, new Date())

    // RF-06: Si pasaron 30 minutos desde la hora programada
    if (remainingMs <= -1800000) {
      clearInterval(intervalRefs.value[receta.id])
      recetaTimers.value[receta.id] = 'Atrasada'
      return
    }

    if (remainingMs <= 0) {
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

/**
 * RF-02, RF-03, RF-04: Abrir diálogo para administrar medicamento
 */
function abrirDialogoAdministrar(receta, toma) {
  $q.dialog({
    title: `Administrar: ${receta.medicamento.nombre}`,
    message: `Confirmar administración para la toma de las ${formatHora(toma.horaReal)}.`,
    prompt: {
      model: '',
      type: 'textarea',
      label: 'Observaciones (opcional)',
      outlined: true,
    },
    cancel: {
      label: 'Cancelar',
      color: 'grey-7',
      flat: true,
    },
    ok: {
      label: 'Confirmar',
      color: 'positive',
    },
    persistent: true,
  }).onOk(async (observaciones) => {
    $q.loading.show({ message: 'Registrando administración...' })

    try {
      // RF-02, RF-03: Enviar datos al backend
      const payload = toma.id
        ? {
            // Actualizar dosis existente en BD
            administracion_id: toma.id,
            observaciones: observaciones || undefined,
          }
        : {
            // Primera administración (raro, pero posible si no hay cronograma)
            receta_id: receta.id,
            hora_programada: toma.horaReal,
            observaciones: observaciones || undefined,
          }

      await api.post('/administraciones', payload)

      $q.notify({
        color: 'positive',
        message: '✅ Medicamento administrado correctamente',
        icon: 'check_circle',
        position: 'top',
      })

      // RF-07: Recargar datos
      emit('recargar-pacientes')
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar administración'

      $q.notify({
        color: 'negative',
        message: `❌ ${message}`,
        icon: 'error',
        position: 'top',
      })

      console.error('Error al administrar:', error)
    } finally {
      $q.loading.hide()
    }
  })
}

// Watcher para recargar seguimiento cuando cambie la internación
watch(
  () => props.internacion,
  () => {
    fetchSeguimiento()
  },
  { deep: true, immediate: true },
)

// Limpiar intervalos al desmontar componente
onBeforeUnmount(() => {
  Object.values(intervalRefs.value).forEach(clearInterval)
})
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}

.bg-red-1 {
  background-color: #ffebee;
}
</style>
