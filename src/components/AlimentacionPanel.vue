<template>
  <q-card flat bordered class="alimentacion-panel-card">
    <q-card-section class="panel-header">
      <div class="header-content">
        <div class="header-left">
          <q-icon name="restaurant" size="28px" color="white" />
          <div class="header-text">
            <div class="header-title">Plan de Alimentación</div>
            <div class="header-subtitle" v-if="alimentacion">
              {{ alimentacion.tipo_dieta?.nombre }}
            </div>
          </div>
        </div>

        <q-btn v-if="alimentacion" icon="more_vert" flat round dense color="white">
          <q-menu auto-close>
            <q-list class="menu-list">
              <q-item clickable @click="onEditClick">
                <q-item-section avatar>
                  <q-icon name="edit" color="teal" />
                </q-item-section>
                <q-item-section>Modificar Plan</q-item-section>
              </q-item>

              <q-item clickable @click="onSuspendClick">
                <q-item-section avatar>
                  <q-icon name="cancel" color="orange" />
                </q-item-section>
                <q-item-section>Suspender Plan</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </q-card-section>

    <q-card-section v-if="cargando" class="loading-section">
      <q-inner-loading showing color="teal" />
      <div class="loading-text">Cargando plan y registros...</div>
    </q-card-section>

    <q-card-section v-else-if="!alimentacion" class="empty-section">
      <q-icon name="restaurant_off" size="80px" color="grey-5" />
      <div class="empty-text">No hay prescripciones de alimentación activas</div>
    </q-card-section>

    <template v-else>
      <q-card-section class="plan-details">
        <div class="detail-row">
          <div class="detail-label">
            <q-icon name="local_dining" size="20px" />
            Vía de Administración
          </div>
          <div class="detail-value">{{ alimentacion.via_administracion }}</div>
        </div>
        <div class="detail-row" v-if="alimentacion.restricciones">
          <div class="detail-label">
            <q-icon name="warning" size="20px" />
            Restricciones
          </div>
          <div class="detail-value">{{ alimentacion.restricciones }}</div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="registro-section">
        <div class="section-title">
          <q-icon name="add_circle" size="24px" />
          Registrar Nuevo Consumo (Hoy)
        </div>

        <div class="tiempos-grid">
          <div v-for="tiempo in alimentacion.tiempos" :key="tiempo.id" class="tiempo-card">
            <div class="tiempo-header">
              <div class="tiempo-name">{{ tiempo.tiempo_comida }}</div>
              <q-icon name="schedule" size="18px" color="teal" />
            </div>

            <div class="tiempo-description">
              {{ tiempo.descripcion || 'Sin descripción específica' }}
            </div>

            <div class="slider-container" v-if="inputsNuevos[tiempo.tiempo_comida]">
              <div class="slider-label">Porcentaje consumido</div>
              <q-slider
                v-model="inputsNuevos[tiempo.tiempo_comida].porcentaje_consumido"
                :min="0"
                :max="100"
                :step="25"
                label-always
                markers
                color="teal"
                class="custom-slider"
              />
            </div>

            <q-input
              v-if="inputsNuevos[tiempo.tiempo_comida]"
              v-model="inputsNuevos[tiempo.tiempo_comida].observaciones"
              label="Observaciones"
              placeholder="Ej: Refiere náuseas, buen apetito..."
              outlined
              dense
              autogrow
              class="observaciones-input"
            >
              <template v-slot:prepend>
                <q-icon name="notes" />
              </template>
            </q-input>

            <q-btn
              unelevated
              rounded
              label="Registrar"
              color="primary"
              icon="check_circle"
              @click="handleGuardarTiempo(tiempo.tiempo_comida)"
              :loading="guardandoTiempo === tiempo.tiempo_comida"
              class="register-btn"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="historial-section">
        <div class="section-title">
          <q-icon name="history" size="24px" />
          Historial de Registros (Hoy)
        </div>

        <div v-if="historialConsumos.length === 0" class="historial-empty">
          <q-icon name="event_available" size="48px" color="grey-4" />
          <div class="historial-empty-text">Aún no hay registros de consumo para hoy.</div>
        </div>

        <div v-else class="historial-grid">
          <div v-for="consumo in historialConsumos" :key="consumo.id" class="historial-card">
            <div class="historial-header">
              <q-avatar
                :color="getPorcentajeColor(consumo.porcentaje_consumido)"
                text-color="white"
                size="48px"
                class="porcentaje-avatar"
              >
                {{ consumo.porcentaje_consumido }}%
              </q-avatar>

              <div class="historial-info">
                <div class="historial-tiempo">{{ consumo.tiempo_comida }}</div>
                <div class="historial-fecha">
                  {{ formatearFechaGuardado(consumo.created_at) }}
                </div>
                <div class="historial-autor" v-if="consumo.registrado_por">
                  Por: {{ consumo.registrado_por.nombre }}
                </div>
              </div>
            </div>

            <div class="historial-obs" v-if="consumo.observaciones">
              <q-icon name="note" size="16px" />
              {{ consumo.observaciones }}
            </div>
          </div>
        </div>
      </q-card-section>
    </template>
  </q-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const props = defineProps({
  internacionId: {
    type: Number,
    required: true,
  },
  tratamientoId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['editRequest'])
const $q = useQuasar()

const cargando = ref(true)
const alimentacion = ref(null)
const guardandoTiempo = ref(null)
const inputsNuevos = ref({})
const historialConsumos = ref([])

const getFechaHoy = () => {
  return format(new Date(), 'yyyy-MM-dd')
}

const formatearFechaGuardado = (fecha) => {
  if (!fecha) return ''
  return format(new Date(fecha), 'dd MMM, hh:mm a', { locale: es })
}

const getPorcentajeColor = (porcentaje) => {
  if (porcentaje <= 30) return 'negative'
  if (porcentaje <= 70) return 'warning'
  return 'positive'
}

onMounted(() => {
  cargarDatosAlimentacion()
})

const cargarDatosAlimentacion = async () => {
  cargando.value = true
  historialConsumos.value = []
  inputsNuevos.value = {}

  try {
    const responseDieta = await api.get(`/alimentaciones/internacion/${props.internacionId}`)
    const dietaActiva = responseDieta.data.find((a) => a.estado === 0)

    if (!dietaActiva) {
      alimentacion.value = null
      cargando.value = false
      return
    }

    alimentacion.value = dietaActiva
    const fechaHoy = getFechaHoy()

    for (const tiempo of dietaActiva.tiempos) {
      inputsNuevos.value[tiempo.tiempo_comida] = {
        porcentaje_consumido: 0,
        observaciones: '',
      }
    }

    try {
      const responseConsumos = await api.get(`/consumos/alimentacion/${dietaActiva.id}/${fechaHoy}`)
      historialConsumos.value = responseConsumos.data || []
    } catch (loadError) {
      console.warn('No se pudieron cargar consumos previos:', loadError.message)
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al cargar el plan de alimentación',
    })
    console.error('Error cargando la dieta:', error)
  } finally {
    cargando.value = false
  }
}

const handleGuardarTiempo = async (tiempoComida) => {
  guardandoTiempo.value = tiempoComida

  const dataTiempo = inputsNuevos.value[tiempoComida]
  if (!dataTiempo) {
    guardandoTiempo.value = null
    return
  }

  if (dataTiempo.porcentaje_consumido === 0 && !dataTiempo.observaciones) {
    $q.notify({
      type: 'warning',
      message: 'Mueva el slider o añada una observación para registrar.',
    })
    guardandoTiempo.value = null
    return
  }

  const payload = {
    tratamiento_id: props.tratamientoId,
    alimentacion_id: alimentacion.value.id,
    fecha: getFechaHoy(),
    tiempo_comida: tiempoComida,
    porcentaje_consumido: dataTiempo.porcentaje_consumido,
    observaciones: dataTiempo.observaciones,
  }

  try {
    const response = await api.post('/consumos/registrar-tiempo', payload)
    historialConsumos.value.unshift(response.data)

    inputsNuevos.value[tiempoComida] = {
      porcentaje_consumido: 0,
      observaciones: '',
    }

    $q.notify({
      type: 'positive',
      message: `${tiempoComida} registrado exitosamente.`,
      icon: 'check_circle',
    })
  } catch (error) {
    console.error(`Error al guardar ${tiempoComida}`, error)
    $q.notify({
      type: 'negative',
      message: `Error al guardar ${tiempoComida}.`,
    })
  } finally {
    guardandoTiempo.value = null
  }
}

const onEditClick = () => {
  if (alimentacion.value) {
    emit('editRequest', alimentacion.value)
  }
}

const onSuspendClick = () => {
  $q.dialog({
    title: 'Suspender Plan de Alimentación',
    message: 'Ingrese el motivo de la suspensión:',
    prompt: {
      model: '',
      type: 'text',
      isValid: (val) => val.length >= 5 || 'El motivo debe tener al menos 5 caracteres.',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (motivo) => {
    await handleSuspender(motivo)
  })
}

const handleSuspender = async (motivo) => {
  if (!alimentacion.value) return

  $q.loading.show({ message: 'Suspendiendo plan...' })
  try {
    // FIX: Cambiado de PATCH a POST para coincidir con el backend
    await api.post(`/alimentaciones/${alimentacion.value.id}/suspender`, {
      motivo_suspension: motivo,
    })

    $q.notify({
      type: 'positive',
      message: 'Plan de alimentación suspendido correctamente.',
    })

    cargarDatosAlimentacion()
  } catch (error) {
    console.error('Error al suspender la alimentación:', error)
    $q.notify({
      type: 'negative',
      message: 'No se pudo suspender el plan. Intente nuevamente.',
    })
  } finally {
    $q.loading.hide()
  }
}

defineExpose({
  cargarDatosAlimentacion,
})
</script>

<style scoped>
.alimentacion-panel-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.panel-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  padding: 20px 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-text {
  color: white;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.header-subtitle {
  font-size: 0.875rem;
  opacity: 0.95;
}

.menu-list {
  min-width: 200px;
}

.loading-section,
.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
}

.loading-text,
.empty-text {
  color: #64748b;
  font-size: 1rem;
  text-align: center;
}

.plan-details {
  padding: 20px 24px;
  background: #f8fafc;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #475569;
  font-size: 0.9375rem;
}

.detail-value {
  color: #1e293b;
  font-weight: 500;
}

.registro-section,
.historial-section {
  padding: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f766e;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #ccfbf1;
}

.tiempos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.tiempo-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.tiempo-card:hover {
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.1);
}

.tiempo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tiempo-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f766e;
}

.tiempo-description {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 20px;
  line-height: 1.5;
}

.slider-container {
  margin-bottom: 16px;
}

.slider-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 12px;
}

.custom-slider {
  padding: 16px 4px;
}

.observaciones-input {
  margin-bottom: 16px;
}

.register-btn {
  width: 100%;
  font-weight: 600;
}

.historial-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.historial-empty-text {
  color: #94a3b8;
  font-size: 0.9375rem;
  margin-top: 12px;
}

.historial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.historial-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.historial-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.historial-header {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.porcentaje-avatar {
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.historial-info {
  flex: 1;
  min-width: 0;
}

.historial-tiempo {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.historial-fecha {
  font-size: 0.8125rem;
  color: #64748b;
  margin-bottom: 2px;
}

.historial-autor {
  font-size: 0.75rem;
  color: #94a3b8;
}

.historial-obs {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #475569;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .tiempos-grid,
  .historial-grid {
    grid-template-columns: 1fr;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
