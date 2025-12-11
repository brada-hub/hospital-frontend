<template>
  <div class="alimentacion-container">
    <!-- HEADER -->
    <div class="header-card">
      <div class="header-content">
        <div class="header-icon">
          <q-icon name="restaurant" size="32px" />
        </div>
        <div class="header-text">
          <h2 class="header-title">Plan de Alimentación</h2>
          <p class="header-subtitle" v-if="alimentacion">
            {{ alimentacion.tipo_dieta?.nombre }}
          </p>
        </div>
      </div>
      <q-btn flat round icon="more_vert" color="white" v-if="alimentacion">
        <q-menu>
          <q-list style="min-width: 150px">
            <q-item clickable v-close-popup @click="cargarDatosAlimentacion">
              <q-item-section avatar><q-icon name="refresh" /></q-item-section>
              <q-item-section>Actualizar</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <!-- LOADING -->
    <div v-if="cargando" class="loading-container">
      <q-spinner-dots color="teal" size="60px" />
      <p class="loading-text">Cargando plan de alimentación...</p>
    </div>

    <!-- SIN DIETA -->
    <div v-else-if="!alimentacion" class="empty-state">
      <q-icon name="no_meals" size="80px" color="grey-5" />
      <h3 class="empty-title">Sin Plan de Alimentación</h3>
      <p class="empty-subtitle">No hay prescripciones de alimentación activas para este paciente</p>
    </div>

    <!-- CONTENIDO PRINCIPAL -->
    <template v-else>
      <!-- INFO DE LA DIETA -->
      <div class="info-cards-row">
        <div class="info-card">
          <div class="info-card-icon bg-teal">
            <q-icon name="local_dining" color="white" size="24px" />
          </div>
          <div class="info-card-content">
            <span class="info-label">Vía de Administración</span>
            <span class="info-value">{{ alimentacion.via_administracion }}</span>
          </div>
        </div>
        <div class="info-card" v-if="alimentacion.restricciones">
          <div class="info-card-icon bg-orange">
            <q-icon name="warning" color="white" size="24px" />
          </div>
          <div class="info-card-content">
            <span class="info-label">Restricciones</span>
            <span class="info-value">{{ alimentacion.restricciones }}</span>
          </div>
        </div>
      </div>

      <!-- SECCIÓN DE REGISTRO -->
      <div class="section-header">
        <q-icon name="add_circle" color="teal" size="28px" />
        <span>Registrar Nuevo Consumo (Hoy)</span>
      </div>

      <!-- GRID DE TIEMPOS DE COMIDA -->
      <div class="tiempos-grid">
        <div v-for="tiempo in alimentacion.tiempos" :key="tiempo.id" class="tiempo-card">
          <!-- CARD HEADER -->
          <div class="tiempo-card-header">
            <div class="tiempo-title-row">
              <q-icon :name="getIconoTiempo(tiempo.tiempo_comida)" size="24px" />
              <span class="tiempo-title">{{ tiempo.tiempo_comida }}</span>
            </div>
            <q-badge
              :color="getBadgeColor(tiempo.tiempo_comida)"
              :label="getHorarioTiempo(tiempo.tiempo_comida)"
              class="tiempo-badge"
            />
          </div>

          <!-- DESCRIPCIÓN -->
          <p class="tiempo-descripcion">
            {{ tiempo.descripcion || 'Sin descripción específica' }}
          </p>

          <!-- SLIDER DE PORCENTAJE -->
          <div class="slider-section">
            <div class="slider-label">
              <span>Porcentaje consumido</span>
              <q-badge
                :color="
                  getPorcentajeColor(inputsNuevos[tiempo.tiempo_comida]?.porcentaje_consumido || 0)
                "
                :label="`${inputsNuevos[tiempo.tiempo_comida]?.porcentaje_consumido || 0}%`"
                class="porcentaje-badge"
              />
            </div>
            <q-slider
              v-model="inputsNuevos[tiempo.tiempo_comida].porcentaje_consumido"
              :min="0"
              :max="100"
              :step="25"
              markers
              marker-labels
              color="teal"
              class="custom-slider"
            />
          </div>

          <!-- OBSERVACIONES -->
          <q-input
            v-model="inputsNuevos[tiempo.tiempo_comida].observaciones"
            label="Observaciones"
            placeholder="Ej: Refiere náuseas, no terminó..."
            outlined
            dense
            autogrow
            class="obs-input"
          >
            <template v-slot:prepend>
              <q-icon name="notes" color="grey-6" />
            </template>
          </q-input>

          <!-- BOTÓN REGISTRAR -->
          <q-btn
            unelevated
            :label="`Registrar`"
            icon="check_circle"
            class="btn-registrar"
            @click="handleGuardarTiempo(tiempo.tiempo_comida)"
            :loading="guardandoTiempo === tiempo.tiempo_comida"
            no-caps
          />

          <!-- HISTORIAL DEL TIEMPO -->
          <div
            class="historial-section"
            v-if="getConsumosPorTiempo(tiempo.tiempo_comida).length > 0"
          >
            <div class="historial-header">
              <q-icon name="history" size="18px" color="grey-7" />
              <span>Registros de hoy</span>
              <q-badge color="grey-6" :label="getConsumosPorTiempo(tiempo.tiempo_comida).length" />
            </div>

            <div class="historial-list">
              <div
                v-for="consumo in getConsumosPorTiempo(tiempo.tiempo_comida)"
                :key="consumo.id"
                class="historial-item"
              >
                <div class="historial-avatar" :class="getAvatarClass(consumo.porcentaje_consumido)">
                  {{ consumo.porcentaje_consumido }}%
                </div>
                <div class="historial-info">
                  <span class="historial-obs" v-if="consumo.observaciones">
                    {{ consumo.observaciones }}
                  </span>
                  <span class="historial-obs text-grey-5" v-else>Sin observaciones</span>
                  <span class="historial-meta">
                    {{ formatearFechaGuardado(consumo.created_at) }}
                    <span v-if="consumo.registrado_por">
                      · {{ consumo.registrado_por.nombre?.split(' ')[0] }}</span
                    >
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- SIN HISTORIAL -->
          <div v-else class="no-historial">
            <q-icon name="schedule" size="20px" color="grey-4" />
            <span>Sin registros hoy</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const props = defineProps({
  internacionId: { type: Number, required: true },
  tratamientoId: { type: Number, default: null },
})

const $q = useQuasar()
const cargando = ref(true)
const alimentacion = ref(null)
const guardandoTiempo = ref(null)
const inputsNuevos = ref({})
const historialConsumos = ref([])
// <CHANGE> Add reference to the actual treatment ID to use for API calls
const tratamientoIdActual = ref(props.tratamientoId)

const getFechaHoy = () => format(new Date(), 'yyyy-MM-dd')

const formatearFechaGuardado = (fecha) => {
  if (!fecha) return ''
  return format(new Date(fecha), 'HH:mm', { locale: es })
}

const getPorcentajeColor = (porcentaje) => {
  if (porcentaje <= 25) return 'negative'
  if (porcentaje <= 50) return 'orange'
  if (porcentaje <= 75) return 'amber'
  return 'positive'
}

const getAvatarClass = (porcentaje) => {
  if (porcentaje <= 25) return 'avatar-red'
  if (porcentaje <= 50) return 'avatar-orange'
  if (porcentaje <= 75) return 'avatar-amber'
  return 'avatar-green'
}

const getIconoTiempo = (tiempo) => {
  const iconos = {
    Desayuno: 'free_breakfast',
    Almuerzo: 'lunch_dining',
    Cena: 'dinner_dining',
    Merienda: 'bakery_dining',
    Colación: 'local_cafe',
  }
  return iconos[tiempo] || 'restaurant'
}

const getBadgeColor = (tiempo) => {
  const colores = {
    Desayuno: 'amber-8',
    Almuerzo: 'orange-8',
    Cena: 'deep-purple-6',
    Merienda: 'pink-5',
    Colación: 'cyan-7',
  }
  return colores[tiempo] || 'teal'
}

const getHorarioTiempo = (tiempo) => {
  const horarios = {
    Desayuno: '07:00 - 09:00',
    Almuerzo: '12:00 - 14:00',
    Cena: '18:00 - 20:00',
    Merienda: '16:00 - 17:00',
    Colación: '10:00 - 11:00',
  }
  return horarios[tiempo] || ''
}

const getConsumosPorTiempo = (tiempoComida) => {
  return historialConsumos.value.filter((c) => c.tiempo_comida === tiempoComida)
}

// <CHANGE> Watch for treatment ID changes and load treatment data if not provided
watch(
  () => props.tratamientoId,
  (newId) => {
    if (newId) {
      tratamientoIdActual.value = newId
      cargarDatosAlimentacion()
    } else {
      // If no treatment ID, try to load treatments for this patient
      cargarTratamientosYAlimentacion()
    }
  },
)

onMounted(() => {
  if (props.tratamientoId) {
    cargarDatosAlimentacion()
  } else {
    cargarTratamientosYAlimentacion()
  }
})

// <CHANGE> New function to load treatments first if not provided
const cargarTratamientosYAlimentacion = async () => {
  cargando.value = true
  console.log('[PanelAlimentacion] No treatment ID provided, loading treatments...')
  try {
    const response = await api.get(`/internaciones/${props.internacionId}`)
    const internacion = response.data
    if (internacion.tratamientos && internacion.tratamientos.length > 0) {
      tratamientoIdActual.value = internacion.tratamientos[0].id
      console.log('[PanelAlimentacion] Treatment loaded:', tratamientoIdActual.value)
      await cargarDatosAlimentacion()
    } else {
      console.warn('[PanelAlimentacion] No treatments found for this patient, but loading food plan anyway')
      // Continue to load food plan even without treatment
      await cargarDatosAlimentacion()
    }
  } catch (error) {
    console.error('[PanelAlimentacion] Error loading treatments:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar los tratamientos del paciente',
    })
    cargando.value = false
  }
}

const cargarDatosAlimentacion = async () => {
  cargando.value = true
  historialConsumos.value = []
  inputsNuevos.value = {}

  console.log('[PanelAlimentacion] Loading food plan...')
  console.log('  internacionId:', props.internacionId)
  console.log('  tratamientoId:', tratamientoIdActual.value)

  try {
    const responseDieta = await api.get(`/alimentaciones/internacion/${props.internacionId}`)
    console.log('  Food plan response:', responseDieta.data)
    const dietaActiva = responseDieta.data.find((a) => a.estado === 0)

    if (!dietaActiva) {
      console.warn('  No active food plan found')
      alimentacion.value = null
      return
    }

    console.log('  Active food plan found:', dietaActiva)
    console.log('  Meal times:', dietaActiva.tiempos)
    alimentacion.value = dietaActiva
    const fechaHoy = getFechaHoy()

    for (const tiempo of dietaActiva.tiempos) {
      inputsNuevos.value[tiempo.tiempo_comida] = {
        porcentaje_consumido: 0,
        observaciones: '',
      }
    }
    console.log('  Inputs initialized:', inputsNuevos.value)

    try {
      const responseConsumos = await api.get(`/consumos/alimentacion/${dietaActiva.id}/${fechaHoy}`)
      historialConsumos.value = responseConsumos.data || []
      console.log('  Consumptions loaded:', historialConsumos.value.length)
    } catch (loadError) {
      console.warn('Could not load previous consumptions:', loadError.message)
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error al cargar el plan de alimentación' })
    console.error('Error loading food plan:', error)
  } finally {
    cargando.value = false
  }
}

const handleGuardarTiempo = async (tiempoComida) => {
  if (!tratamientoIdActual.value) {
    $q.notify({
      type: 'warning',
      message: 'No hay un tratamiento disponible para registrar',
    })
    return
  }

  guardandoTiempo.value = tiempoComida
  const dataTiempo = inputsNuevos.value[tiempoComida]
  if (!dataTiempo) return

  const payload = {
    tratamiento_id: tratamientoIdActual.value,
    alimentacion_id: alimentacion.value.id,
    fecha: getFechaHoy(),
    tiempo_comida: tiempoComida,
    porcentaje_consumido: dataTiempo.porcentaje_consumido,
    observaciones: dataTiempo.observaciones,
  }

  try {
    const response = await api.post('/consumos/registrar-tiempo', payload)
    historialConsumos.value.unshift(response.data)
    inputsNuevos.value[tiempoComida] = { porcentaje_consumido: 0, observaciones: '' }

    $q.notify({
      type: 'positive',
      message: `${tiempoComida} registrado exitosamente`,
      icon: 'check_circle',
    })
  } catch (error) {
    console.error(`Error saving ${tiempoComida}`, error)
    $q.notify({ type: 'negative', message: `Error al guardar ${tiempoComida}` })
  } finally {
    guardandoTiempo.value = null
  }
}
</script>

<style scoped>
.alimentacion-container {
  padding: 24px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
  min-height: 100%;
}

/* HEADER */
.header-card {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  color: white;
}

.header-title {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  margin: 4px 0 0 0;
}

/* LOADING */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.loading-text {
  color: #64748b;
  margin-top: 16px;
}

/* EMPTY STATE */
.empty-state {
  background: white;
  border-radius: 16px;
  padding: 60px 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.empty-title {
  color: #475569;
  font-size: 1.25rem;
  margin: 16px 0 8px;
}

.empty-subtitle {
  color: #94a3b8;
  margin: 0;
}

/* INFO CARDS */
.info-cards-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.info-card-icon {
  border-radius: 10px;
  padding: 10px;
}

.info-card-icon.bg-teal {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
}

.info-card-icon.bg-orange {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.info-label {
  display: block;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.info-value {
  display: block;
  font-size: 1rem;
  color: #1e293b;
  font-weight: 600;
}

/* SECTION HEADER */
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f766e;
  margin-bottom: 20px;
}

/* TIEMPOS GRID */
.tiempos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.tiempo-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.tiempo-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.tiempo-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tiempo-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #0f766e;
}

.tiempo-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
}

.tiempo-badge {
  font-size: 0.7rem;
  padding: 4px 10px;
}

.tiempo-descripcion {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e2e8f0;
}

/* SLIDER */
.slider-section {
  margin-bottom: 16px;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: #475569;
  font-weight: 500;
}

.porcentaje-badge {
  font-weight: 700;
  padding: 4px 10px;
}

.custom-slider {
  padding: 0 8px;
}

/* INPUT */
.obs-input {
  margin-bottom: 16px;
}

/* BOTÓN */
.btn-registrar {
  width: 100%;
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(13, 148, 136, 0.25);
  transition: all 0.3s ease;
}

.btn-registrar:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(13, 148, 136, 0.35);
}

/* HISTORIAL */
.historial-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.historial-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 12px;
}

.historial-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.historial-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 10px;
  transition: background 0.2s;
}

.historial-item:hover {
  background: #f1f5f9;
}

.historial-avatar {
  min-width: 48px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
}

.avatar-red {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}
.avatar-orange {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}
.avatar-amber {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}
.avatar-green {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.historial-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.historial-obs {
  font-size: 0.85rem;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.historial-meta {
  font-size: 0.75rem;
  color: #94a3b8;
}

.no-historial {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 0.85rem;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .alimentacion-container {
    padding: 16px;
  }

  .header-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .tiempos-grid {
    grid-template-columns: 1fr;
  }

  .info-cards-row {
    flex-direction: column;
  }
}
</style>
