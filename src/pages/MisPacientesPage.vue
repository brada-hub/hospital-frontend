<template>
  <q-page class="mis-pacientes-page">
    <!-- Vista de lista de pacientes -->
    <div v-if="!mostrarPanel" class="page-container">
      <div class="header-section">
        <div class="header-content">

          <div>
            <h1 class="page-title">Mis Pacientes Internados</h1>
            <p class="page-subtitle">Lista de pacientes actualmente bajo tu responsabilidad</p>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">
        <q-spinner-dots color="teal" size="60px" />
        <p class="loading-text">Cargando pacientes...</p>
      </div>

      <div v-else-if="!internaciones.length" class="empty-state">
        <div class="empty-icon">
          <q-icon name="personal_injury" size="120px" />
        </div>
        <h3 class="empty-title">No tienes pacientes asignados</h3>
        <p class="empty-subtitle">Actualmente no hay pacientes bajo tu responsabilidad</p>
      </div>

      <div v-else class="patients-grid">
        <div
          v-for="(internacion, index) in internaciones"
          :key="internacion.id"
          class="patient-card"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="card-header">
            <div class="patient-icon">
              <q-icon name="person" size="32px" />
            </div>
            <div class="patient-info">
              <h3 class="patient-name">
                {{ internacion.paciente.nombre }} {{ internacion.paciente.apellidos }}
              </h3>
              <p class="patient-ci">CI: {{ internacion.paciente.ci }}</p>
            </div>
            <q-badge color="positive" label="Internado" class="status-badge" />
          </div>

          <div class="card-body">
            <div class="info-row">
              <div class="info-item">
                <q-icon name="hotel" size="20px" class="info-icon" />
                <div class="info-content">
                  <span class="info-label">Cama</span>
                  <span class="info-value" v-if="internacion.ocupacion_activa">
                    {{ internacion.ocupacion_activa.cama.sala.nombre }} -
                    {{ internacion.ocupacion_activa.cama.nombre }}
                  </span>
                  <span class="info-value" v-else>No asignada</span>
                </div>
              </div>

              <div class="info-item">
                <q-icon name="event" size="20px" class="info-icon" />
                <div class="info-content">
                  <span class="info-label">Fecha Ingreso</span>
                  <span class="info-value">{{ formatDateTime(internacion.fecha_ingreso) }}</span>
                </div>
              </div>
            </div>

            <div class="info-row">
              <div class="info-item full-width">
                <q-icon name="medical_services" size="20px" class="info-icon" />
                <div class="info-content">
                  <span class="info-label">Diagnóstico</span>
                  <span class="info-value">{{ internacion.diagnostico }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="view-panel-btn" @click="abrirPanelClinico(internacion.id)">
              <span>Ver Panel Clínico</span>
              <q-icon name="arrow_forward" size="20px" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista del Panel Clínico -->
    <div v-else class="panel-container">
      <div class="panel-header">
        <div class="header-left">
          <q-btn
            flat
            round
            dense
            icon="arrow_back"
            color="white"
            size="lg"
            @click="cerrarPanel"
            class="back-btn"
          >
            <q-tooltip>Volver a la lista</q-tooltip>
          </q-btn>
          <div class="panel-title-section" v-if="internacionActiva">
            <h2 class="panel-title">
              {{ internacionActiva.paciente.nombre }}
              {{ internacionActiva.paciente.apellidos }}
            </h2>
             <div class="panel-badges">
              <q-badge color="white" text-color="primary" class="header-badge">
                <q-icon name="badge" size="14px" class="q-mr-xs" />
                CI: {{ internacionActiva.paciente.ci }}
              </q-badge>
              <q-badge color="white" text-color="primary" class="header-badge">
                <q-icon name="cake" size="14px" class="q-mr-xs" />
                {{ calcularEdad(internacionActiva.paciente.fecha_nacimiento) }} años
              </q-badge>
            </div>
          </div>
        </div>

        <div class="header-right" v-if="internacionActiva">
          <div class="info-card">
            <div class="info-label">Diagnóstico</div>
            <div class="info-value text-ellipsis">{{ internacionActiva.diagnostico || 'Sin diagnóstico' }}</div>
          </div>

          <div class="v-divider"></div>

          <div class="antropometria-group">
            <div class="info-metric">
              <div class="metric-label">Peso</div>
              <div class="metric-value">
                {{ internacionActiva.datos_antropometricos?.peso || '---' }}
              </div>
            </div>
            <div class="info-metric">
              <div class="metric-label">Altura</div>
              <div class="metric-value">
                {{ internacionActiva.datos_antropometricos?.altura || '---' }}
              </div>
            </div>
            <div class="info-metric">
              <div class="metric-label">IMC</div>
              <div class="metric-value">
                <q-badge :color="getImcColor(internacionActiva.datos_antropometricos?.imc)">
                  {{ internacionActiva.datos_antropometricos?.imc || '---' }}
                </q-badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-content">
        <PanelInternacion
          v-if="internacionSeleccionada"
          :internacion-id="internacionSeleccionada"
          :initial-data="internacionActiva"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'boot/axios'
import { Notify } from 'quasar'
import { format } from 'date-fns'
import PanelInternacion from 'src/components/PanelInternacion.vue'

const route = useRoute()
const internaciones = ref([])
const isLoading = ref(true)
const mostrarPanel = ref(false)
const internacionSeleccionada = ref(null)

const internacionActiva = ref(null)

onMounted(() => {
  fetchMisPacientes()
})

// Helper Methods
function getImcColor(imc) {
  if (!imc) return 'grey'
  if (imc < 18.5) return 'blue'
  if (imc < 25) return 'positive'
  if (imc < 30) return 'warning'
  return 'negative'
}

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return '?'
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const m = hoy.getMonth() - nacimiento.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  return edad
}

// ✅ WATCHER: Detectar cambios en la URL (para clicks en notificaciones estando ya aquí)

watch(
  () => route.query.internacion,
  (newId) => {
    if (newId) {
      if (!internaciones.value.length) return // Si aún no cargan, lo manejará el fetch

      const internacionExists = internaciones.value.some((i) => i.id === parseInt(newId))
      if (internacionExists) {
        abrirPanelClinico(parseInt(newId))
      } else {
        Notify.create({
          color: 'warning',
          message: 'El paciente de la notificación no está en tu lista actual.',
          icon: 'warning',
        })
      }
    }
  },
)

async function fetchMisPacientes() {
  isLoading.value = true
  try {
    const response = await api.get('/mis-pacientes')
    internaciones.value = response.data

    // Si hay un parámetro de internación en la URL, abrir automáticamente el panel
    const internacionIdFromQuery = route.query.internacion
    if (internacionIdFromQuery) {
      const internacionExists = internaciones.value.some(
        (i) => i.id === parseInt(internacionIdFromQuery),
      )

      if (internacionExists) {
        abrirPanelClinico(parseInt(internacionIdFromQuery))
      } else {
        Notify.create({
          color: 'warning',
          message: 'El paciente de la notificación no está en tu lista actual.',
          icon: 'warning',
        })
      }
    }
  } catch (error) {
    console.error('Error al cargar mis pacientes:', error)
    Notify.create({
      color: 'negative',
      message: 'No se pudo cargar la lista de pacientes.',
      icon: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A'
  return format(new Date(dateTimeString), 'dd/MM/yyyy HH:mm')
}

async function abrirPanelClinico(internacionId) {
  internacionSeleccionada.value = internacionId

  // Cargar datos completos para la cabecera
  try {
    const response = await api.get(`/internaciones/${internacionId}/vista-completa`)
    internacionActiva.value = response.data
    // Asegurar estructura
     if (!internacionActiva.value.datos_antropometricos) {
         internacionActiva.value.datos_antropometricos = {}
     }
  } catch (e) {
    console.error("Error cargando detalles para cabecera", e)
    // Fallback básico si falla carga completa
    const basic = internaciones.value.find(i => i.id === internacionId)
    if (basic) internacionActiva.value = basic
  }

  mostrarPanel.value = true
  // Scroll al inicio de la página
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cerrarPanel() {
  mostrarPanel.value = false
  internacionSeleccionada.value = null
  internacionActiva.value = null
  // Recargar la lista de pacientes
  // Recargar la lista de pacientes
  fetchMisPacientes()
}
</script>

<style scoped>
.mis-pacientes-page {
  background: #f8fafc;
  min-height: 100vh;
}

.page-container {
  /* Removed max-width for full width goodness */
  margin: 0 auto;
  padding: clamp(16px, 2vw, 32px);
}

/* Header Section */
.header-section {
  margin-bottom: clamp(24px, 4vw, 40px);
  animation: fadeInDown 0.6s ease-out;
}

.header-content {
  display: flex;
  align-items: center;
  gap: clamp(16px, 2vw, 20px);
}



.page-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: clamp(0.9rem, 1.5vw, 1.1rem);
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 20px;
}

.loading-text {
  font-size: 1.125rem;
  color: #64748b;
  font-weight: 500;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  width: 160px;
  height: 160px;
  background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0891b2;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.empty-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

/* Patients Grid - Fluid! */
.patients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.patient-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out backwards;
}

.patient-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(13, 148, 136, 0.15);
}

/* Card Header */
.card-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.patient-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.patient-info {
  flex: 1;
  min-width: 0;
}

.patient-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.patient-ci {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.status-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 6px 12px;
  font-weight: 600;
}

/* Card Body */
.card-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-icon {
  color: #0d9488;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1e293b;
  word-wrap: break-word;
}

/* Card Footer */
.card-footer {
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.view-panel-btn {
  width: 100%;
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.view-panel-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(13, 148, 136, 0.3);
}

.view-panel-btn:active {
  transform: translateY(0);
}

/* Panel Container - Full Width */
.panel-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
  /* No max-width here either to ensure child PanelInternacion takes full space */
}

.panel-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.panel-title-section {
  display: flex;
  flex-direction: column;
}

.panel-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.panel-badges {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.header-badge {
  font-weight: 600;
  font-size: 0.8rem;
  padding: 4px 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 20px;
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.info-card {
  max-width: 250px;
}

.info-label, .metric-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
  margin-bottom: 2px;
}

.info-value {
  font-weight: 600;
  font-size: 0.95rem;
}

.v-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
}

.antropometria-group {
  display: flex;
  gap: 20px;
}

.info-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.metric-value {
  font-size: 1.1rem;
  font-weight: 700;
}

.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

@media (max-width: 1024px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .info-card {
    flex: 1;
  }
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.panel-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.panel-title {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 700;
  color: white;
  margin: 0;
}

.panel-content {
  padding: 0;
  /* PanelInternacion component should handle its own padding/layout */
}

/* Animations */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design Tweaks */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  /* Grid automatically handles reducing columns, but we can ensure single col on very small screens */
  .patients-grid {
    gap: 16px;
  }

  .status-badge {
    position: static;
    margin-top: 12px;
  }

  .card-header {
    flex-wrap: wrap;
  }
}

</style>
