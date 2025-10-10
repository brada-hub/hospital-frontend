<template>
  <div class="tratamientos-container">
    <div class="header-section">
      <div class="text-h6 text-weight-medium titulo-principal">Tratamiento Activo</div>
      <div class="row items-center q-gutter-sm navegacion-fecha">
        <q-btn
          flat
          dense
          round
          icon="chevron_left"
          @click="cambiarFecha(-1)"
          :disable="!puedoRetroceder"
          class="btn-navegacion"
        />
        <q-btn
          flat
          dense
          :label="formatearFechaNav(fechaSeleccionada)"
          @click="mostrarSelectorFecha"
          class="text-primary btn-fecha"
        />
        <q-btn
          flat
          dense
          round
          icon="chevron_right"
          @click="cambiarFecha(1)"
          :disable="!puedoAvanzar"
          class="btn-navegacion"
        />
        <q-btn
          flat
          dense
          label="Hoy"
          color="primary"
          @click="irAHoy"
          v-if="!esHoy"
          class="btn-hoy"
        />
      </div>
    </div>

    <div v-if="!tratamientosConSeguimiento.length" class="empty-state">
      <q-icon name="healing" size="3rem" class="empty-icon" />
      <span class="empty-text">Sin tratamiento activo prescrito.</span>
    </div>

    <div v-else class="tratamientos-acordeon">
      <div
        v-for="tratamiento in tratamientosConSeguimiento"
        :key="tratamiento.id"
        class="tratamiento-acordeon-item"
      >
        <q-list bordered class="tratamiento-list">
          <div class="tratamiento-header">
            <q-icon name="medication" class="tratamiento-icon" size="2rem" />
            <div class="tratamiento-details">
              <span class="tratamiento-label">TRATAMIENTO:</span>
              <h3 class="tratamiento-nombre">{{ tratamiento.tipo }} - Medicamentos</h3>
            </div>
          </div>

          <q-item v-for="receta in tratamiento.recetas" :key="receta.id" class="receta-item">
            <q-item-section>
              <q-inner-loading :showing="isLoading[tratamiento.id]">
                <q-spinner-dots size="40px" color="primary" />
              </q-inner-loading>

              <div v-if="!isLoading[tratamiento.id]" class="receta-content">
                <div class="receta-info-header">
                  <div class="medicamento-info">
                    <q-item-label class="medicamento-nombre">{{
                      receta.medicamento.nombre
                    }}</q-item-label>
                    <q-item-label caption class="medicamento-dosis"
                      >Dosis: {{ receta.dosis }} - c/{{ receta.frecuencia_horas }}h</q-item-label
                    >
                    <q-item-label caption class="medicamento-prescriptor" v-if="tratamiento.user">
                      <q-icon name="medical_services" size="xs" />
                      Prescrito por: Dr(a). {{ tratamiento.user.nombre }}
                      {{ tratamiento.user.apellidos }}
                    </q-item-label>
                  </div>
                  <div
                    v-if="esHoy"
                    class="timer-badge"
                    :class="getTimerClass(recetaTimers[receta.id])"
                  >
                    <div class="timer-label">Proxima dosis en:</div>
                    <div class="timer-value">{{ recetaTimers[receta.id] || 'Calculando...' }}</div>
                  </div>
                </div>

                <div class="cronograma-section">
                  <div class="cronograma-titulo">
                    <q-icon name="schedule" size="sm" class="q-mr-xs" />
                    {{
                      esHoy
                        ? 'Cronograma de Hoy:'
                        : `Cronograma del ${formatearFechaNav(fechaSeleccionada)}:`
                    }}
                  </div>
                  <div
                    v-if="!receta.tomas_hoy || !receta.tomas_hoy.length"
                    class="empty-cronograma"
                  >
                    <q-icon name="event_busy" size="2rem" class="empty-icon" />
                    <span class="empty-text">Sin tomas programadas para este dia</span>
                  </div>
                  <div v-else class="tomas-grid">
                    <div
                      v-for="toma in receta.tomas_hoy"
                      :key="toma.id || toma.horaReal"
                      class="toma-card"
                    >
                      <div
                        class="card-header"
                        :style="{ background: getHeaderGradient(toma.status) }"
                      >
                        <div class="toma-info">
                          <q-icon
                            :name="getIconForStatus(toma.status)"
                            class="toma-icon"
                            size="2rem"
                          />
                          <div class="toma-details">
                            <span class="toma-label">{{
                              toma.esPrimeraDosis ? 'AHORA' : formatHora(toma.horaReal)
                            }}</span>
                            <h3 class="toma-status">{{ toma.status }}</h3>
                          </div>
                        </div>
                      </div>
                      <div class="card-body">
                        <div v-if="toma.datosAdministracion" class="info-item">
                          <q-icon name="person" class="info-icon" />
                          <span class="info-label">Por:</span>
                          <span class="info-value">{{ toma.datosAdministracion.user.nombre }}</span>
                        </div>
                        <div
                          v-if="toma.datosAdministracion && toma.datosAdministracion.fecha"
                          class="info-item"
                        >
                          <q-icon name="access_time" class="info-icon" />
                          <span class="info-label">Hora real:</span>
                          <span class="info-value">{{
                            formatHoraCompleta(toma.datosAdministracion.fecha)
                          }}</span>
                        </div>
                        <div
                          v-if="toma.datosAdministracion && toma.datosAdministracion.observaciones"
                          class="info-item"
                        >
                          <q-icon name="notes" class="info-icon" />
                          <span class="info-label">Obs:</span>
                          <span class="info-value">{{
                            toma.datosAdministracion.observaciones
                          }}</span>
                        </div>
                        <div
                          v-if="
                            !toma.datosAdministracion &&
                            toma.status === 'Pendiente' &&
                            !toma.esPrimeraDosis
                          "
                          class="info-item info-pendiente"
                        >
                          <q-icon name="schedule" size="sm" />
                          <span class="info-value">Disponible 10 min antes</span>
                        </div>
                      </div>
                      <div class="card-actions" v-if="esBotonVisible(toma)">
                        <q-btn
                          unelevated
                          size="md"
                          :class="toma.status === '¡ATRASADA!' ? 'btn-atrasado' : 'btn-administrar'"
                          :label="toma.esPrimeraDosis ? 'Iniciar Tratamiento' : 'Administrar'"
                          @click="abrirDialogoAdministrar(receta, toma)"
                          class="full-width"
                          no-caps
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { format, subMinutes, isPast, differenceInMilliseconds, addDays } from 'date-fns'

const props = defineProps({ internacion: { type: Object, required: true } })
const emit = defineEmits(['recargar-pacientes'])

const $q = useQuasar()
const tratamientosConSeguimiento = ref([])
const recetaTimers = ref({})
const intervalRefs = ref({})
const isLoading = ref({})
const fechaSeleccionada = ref(new Date())
const fechaMin = ref(null)

function parseLaravelDate(dateTimeString) {
  if (!dateTimeString) return null
  const date = new Date(dateTimeString.toString().replace(' ', 'T'))
  return isNaN(date) ? null : date
}

const esHoy = computed(() => {
  const hoy = new Date()
  return (
    fechaSeleccionada.value.getDate() === hoy.getDate() &&
    fechaSeleccionada.value.getMonth() === hoy.getMonth() &&
    fechaSeleccionada.value.getFullYear() === hoy.getFullYear()
  )
})

const puedoRetroceder = computed(() => {
  if (!fechaMin.value) return true
  return fechaSeleccionada.value > fechaMin.value
})

const puedoAvanzar = computed(() => {
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  return fechaSeleccionada.value < manana
})

function formatearFechaNav(fecha) {
  const opciones = { weekday: 'short', day: 'numeric', month: 'short' }
  return fecha.toLocaleDateString('es-ES', opciones)
}

function cambiarFecha(dias) {
  const nuevaFecha = new Date(fechaSeleccionada.value)
  nuevaFecha.setDate(nuevaFecha.getDate() + dias)
  fechaSeleccionada.value = nuevaFecha
  fetchSeguimiento()
}

function irAHoy() {
  fechaSeleccionada.value = new Date()
  fetchSeguimiento()
}

function mostrarSelectorFecha() {
  $q.dialog({
    title: 'Seleccionar fecha',
    message: 'Elige una fecha para ver el historial',
    prompt: { model: format(fechaSeleccionada.value, 'yyyy-MM-dd'), type: 'date' },
    cancel: true,
  }).onOk((fecha) => {
    fechaSeleccionada.value = new Date(fecha)
    fetchSeguimiento()
  })
}

function formatHora(dateTimeString) {
  const fecha = parseLaravelDate(dateTimeString)
  return fecha ? format(fecha, 'HH:mm') : '--:--'
}

function formatHoraCompleta(dateTimeString) {
  const fecha = parseLaravelDate(dateTimeString)
  return fecha ? format(fecha, 'HH:mm:ss') : '--:--:--'
}

const esAdministrable = (hora) => {
  if (!hora) return false
  const ahora = new Date()
  const ventanaInicio = subMinutes(hora, 10)
  return ahora >= ventanaInicio
}

const esBotonVisible = (toma) => {
  if (!toma) return false
  if (toma.esPrimeraDosis === true && esHoy.value) return true
  const hora = parseLaravelDate(toma.horaReal)
  if (!hora) return false
  if (!esHoy.value) return false
  if (toma.datosAdministracion) return false
  if (toma.status === 'Pendiente' && esAdministrable(hora)) return true
  if (toma.status === '¡ATRASADA!') return true
  return false
}

const getIconForStatus = (status) =>
  ({
    Cumplida: 'check_circle',
    'Cumplida (Retrasada)': 'check_circle',
    'Sin iniciar': 'play_circle',
    Pendiente: 'schedule',
    '¡ATRASADA!': 'warning',
  })[status] || 'schedule'

const getHeaderGradient = (status) => {
  return (
    {
      Cumplida: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
      'Cumplida (Retrasada)': 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
      'Sin iniciar': 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      Pendiente: 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)',
      '¡ATRASADA!': 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
    }[status] || 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)'
  )
}

const getTimerClass = (timer) => {
  if (!timer) return 'timer-normal'
  if (timer === '¡Ahora!' || timer === 'Atrasada') return 'timer-urgente'
  if (timer.startsWith('00:0')) return 'timer-proximo'
  return 'timer-normal'
}

const fetchSeguimiento = async () => {
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
        const fechaParam = format(fechaSeleccionada.value, 'yyyy-MM-dd')
        const response = await api.get(
          `/seguimiento/tratamiento/${tratamiento.id}?fecha=${fechaParam}`,
        )
        if (esHoy.value) {
          response.data.recetas.forEach((receta) => {
            iniciarTemporizadorReceta(receta, tratamiento)
          })
        }
        const inicioTratamiento = parseLaravelDate(tratamiento.fecha_inicio)
        if (!fechaMin.value || inicioTratamiento < fechaMin.value) {
          fechaMin.value = inicioTratamiento
        }
        return response.data
      } catch (error) {
        console.error(`Error: ${error}`)
        $q.notify({ color: 'negative', message: `Error al cargar tratamiento`, icon: 'error' })
        return tratamiento
      } finally {
        isLoading.value[tratamiento.id] = false
      }
    }),
  )

  tratamientosConSeguimiento.value = tratamientosProcesados
}

const iniciarTemporizadorReceta = (receta, tratamiento) => {
  if (intervalRefs.value[receta.id]) {
    clearInterval(intervalRefs.value[receta.id])
  }
  const inicioTratamiento = parseLaravelDate(tratamiento.fecha_inicio)
  const finTratamiento = addDays(inicioTratamiento, receta.duracion_dias)
  if (isPast(finTratamiento)) {
    recetaTimers.value[receta.id] = 'Finalizado'
    return
  }
  const administraciones = receta.administras || []
  const proximaPendiente = administraciones.find((admin) => admin.estado === 0)
  if (!proximaPendiente) {
    if (!administraciones.length) {
      recetaTimers.value[receta.id] = 'Sin iniciar'
      return
    }
    recetaTimers.value[receta.id] = 'Todas administradas'
    return
  }
  const proximaAdmin = parseLaravelDate(proximaPendiente.hora_programada)
  const updateTimer = () => {
    const remainingMs = differenceInMilliseconds(proximaAdmin, new Date())
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

function abrirDialogoAdministrar(receta, toma) {
  const esPrimera = toma.esPrimeraDosis
  $q.dialog({
    title: esPrimera
      ? `Iniciar tratamiento: ${receta.medicamento.nombre}`
      : `Administrar: ${receta.medicamento.nombre}`,
    message: esPrimera
      ? `Se iniciara el tratamiento AHORA`
      : `Confirmar administracion ${formatHora(toma.horaReal)}`,
    prompt: { model: '', type: 'textarea', label: 'Observaciones (opcional)', outlined: true },
    cancel: { label: 'Cancelar', color: 'grey-7', flat: true },
    ok: { label: esPrimera ? 'Iniciar' : 'Confirmar', color: 'positive' },
    persistent: true,
  }).onOk(async (observaciones) => {
    $q.loading.show({ message: 'Registrando...' })
    try {
      const payload = esPrimera
        ? { receta_id: receta.id, observaciones: observaciones || undefined }
        : { administracion_id: toma.id, observaciones: observaciones || undefined }
      await api.post('/administraciones', payload)
      $q.notify({
        color: 'positive',
        message: esPrimera ? 'Tratamiento iniciado' : 'Medicamento administrado',
        icon: 'check_circle',
        position: 'top',
      })
      emit('recargar-pacientes')
    } catch (error) {
      const message = error.response?.data?.message || 'Error'
      $q.notify({ color: 'negative', message: `${message}`, icon: 'error', position: 'top' })
    } finally {
      $q.loading.hide()
    }
  })
}

watch(
  () => props.internacion,
  () => {
    fetchSeguimiento()
  },
  { deep: true, immediate: true },
)
onBeforeUnmount(() => {
  Object.values(intervalRefs.value).forEach(clearInterval)
})
</script>

<style scoped>
.tratamientos-container {
  height: auto;
  width: 100%;
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.titulo-principal {
  background: linear-gradient(135deg, #0f3027 0%, #082f49 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 900;
  font-size: 1.75rem;
  margin: 0;
}

.navegacion-fecha {
  flex-wrap: wrap;
}

.btn-navegacion,
.btn-fecha,
.btn-hoy {
  transition: all 0.2s ease;
}

.btn-navegacion:hover,
.btn-fecha:hover,
.btn-hoy:hover {
  transform: scale(1.05);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.empty-icon {
  color: #9ca3af;
  margin-bottom: 16px;
}

.empty-text {
  color: #6b7280;
  font-size: 1rem;
}

.tratamientos-acordeon {
  display: grid;
  gap: 24px;
}

.tratamiento-acordeon-item {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.tratamiento-acordeon-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.tratamiento-list {
  border: none;
  border-radius: 16px;
}

.tratamiento-header {
  padding: 20px;
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  display: flex;
  align-items: center;
  gap: 16px;
}

.tratamiento-icon {
  color: white;
}

.tratamiento-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tratamiento-label {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tratamiento-nombre {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.receta-item {
  padding: 24px;
  background: #f8fafc;
}

.receta-content {
  width: 100%;
}

.receta-info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.medicamento-info {
  flex: 1;
  min-width: 250px;
}

.medicamento-nombre {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.medicamento-dosis {
  font-size: 0.95rem;
  color: #64748b;
  margin-bottom: 4px;
}

.medicamento-prescriptor {
  font-size: 0.9rem;
  color: #0d9488;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.timer-badge {
  padding: 12px 16px;
  border-radius: 12px;
  text-align: center;
  min-width: 180px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timer-normal {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #374151;
}

.timer-proximo {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  color: #9a3412;
}

.timer-urgente {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  color: #991b1b;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.timer-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.8;
  margin-bottom: 4px;
}

.timer-value {
  font-size: 1.1rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.cronograma-section {
  margin-top: 24px;
}

.cronograma-titulo {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.empty-cronograma {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: white;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
  text-align: center;
}

.tomas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.toma-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.toma-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.card-header {
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toma-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toma-icon {
  color: white;
}

.toma-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toma-label {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toma-status {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.card-body {
  padding: 16px;
  background: #f8fafc;
  flex-grow: 1;
  min-height: 80px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-pendiente {
  justify-content: center;
  color: #64748b;
  font-style: italic;
}

.info-icon {
  font-size: 1.2rem;
  color: #64748b;
  margin-top: 2px;
}

.info-label {
  font-weight: 600;
  color: #475569;
  min-width: 70px;
}

.info-value {
  flex: 1;
  color: #1e293b;
  word-break: break-word;
}

.card-actions {
  padding: 12px;
  display: flex;
  gap: 8px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.btn-administrar {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  font-weight: 600;
  border-radius: 10px;
  padding: 10px 20px;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
  transition: all 0.2s;
}

.btn-administrar:hover {
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
  transform: translateY(-2px);
}

.btn-atrasado {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  color: white;
  font-weight: 600;
  border-radius: 10px;
  padding: 10px 20px;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
  transition: all 0.2s;
}

.btn-atrasado:hover {
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
  transform: translateY(-2px);
}

@media (max-width: 1024px) {
  .tratamientos-container {
    padding: 16px;
  }

  .titulo-principal {
    font-size: 1.5rem;
  }

  .tomas-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .timer-badge {
    min-width: 150px;
  }
}

@media (max-width: 768px) {
  .tratamientos-container {
    padding: 12px;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .titulo-principal {
    font-size: 1.25rem;
  }

  .navegacion-fecha {
    width: 100%;
    justify-content: space-between;
  }

  .receta-info-header {
    flex-direction: column;
  }

  .timer-badge {
    width: 100%;
    min-width: unset;
  }

  .tomas-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .medicamento-nombre {
    font-size: 1.1rem;
  }

  .tratamiento-nombre {
    font-size: 1.1rem;
  }

  .tratamiento-header {
    padding: 16px;
  }

  .receta-item {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .tratamientos-container {
    padding: 8px;
  }

  .titulo-principal {
    font-size: 1.1rem;
  }

  .btn-fecha {
    font-size: 0.85rem;
  }

  .card-header {
    padding: 12px;
  }

  .card-body {
    padding: 12px;
  }

  .card-actions {
    padding: 8px;
  }

  .toma-label {
    font-size: 0.7rem;
  }

  .toma-status {
    font-size: 1rem;
  }

  .info-item {
    font-size: 0.85rem;
  }
}
</style>
