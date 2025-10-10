<template>
  <q-page class="mis-pacientes-page">
    <div class="page-container">
      <div class="header-section">
        <div class="header-content">
          <div class="header-icon">
            <q-icon name="personal_injury" size="48px" />
          </div>
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

    <q-dialog v-model="mostrarPanelClinico" full-width full-height>
      <q-card class="panel-dialog">
        <q-card-section class="dialog-header">
          <div class="dialog-header-content">
            <h2 class="dialog-title">Panel Clínico del Paciente</h2>
            <q-btn
              flat
              round
              dense
              icon="close"
              color="white"
              @click="cerrarPanelClinico"
              class="close-btn"
            />
          </div>
        </q-card-section>

        <q-card-section class="dialog-body">
          <PanelInternacion
            v-if="internacionSeleccionada"
            :internacion-id="internacionSeleccionada"
            @cerrar="cerrarPanelClinico"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { Notify } from 'quasar'
import { format } from 'date-fns'
import PanelInternacion from 'src/components/PanelInternacion.vue'

const internaciones = ref([])
const isLoading = ref(true)
const mostrarPanelClinico = ref(false)
const internacionSeleccionada = ref(null)

async function fetchMisPacientes() {
  isLoading.value = true
  try {
    const response = await api.get('/mis-pacientes')
    internaciones.value = response.data
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

function abrirPanelClinico(internacionId) {
  internacionSeleccionada.value = internacionId
  mostrarPanelClinico.value = true
}

function cerrarPanelClinico() {
  mostrarPanelClinico.value = false
  internacionSeleccionada.value = null
  // Recargar la lista de pacientes al cerrar el panel
  fetchMisPacientes()
}

onMounted(fetchMisPacientes)
</script>

<style scoped>
.mis-pacientes-page {
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
  min-height: 100vh;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* Header Section */
.header-section {
  margin-bottom: 40px;
  animation: fadeInDown 0.6s ease-out;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 16px rgba(13, 148, 136, 0.3);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 8px 0 0 0;
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

/* Patients Grid */
.patients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

/* Dialog Styles */
.panel-dialog {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dialog-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  padding: 20px 24px;
  flex-shrink: 0;
}

.dialog-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
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

/* Responsive Design */
@media (max-width: 1024px) {
  .patients-grid {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 24px 16px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-icon {
    width: 64px;
    height: 64px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .patients-grid {
    grid-template-columns: 1fr;
  }

  .info-row {
    grid-template-columns: 1fr;
  }

  .status-badge {
    position: static;
    align-self: flex-start;
    margin-top: 12px;
  }

  .card-header {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 16px 12px;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .page-subtitle {
    font-size: 0.875rem;
  }

  .card-header {
    padding: 16px;
  }

  .card-body {
    padding: 16px;
  }

  .patient-name {
    font-size: 1.125rem;
  }

  .view-panel-btn {
    padding: 12px 20px;
    font-size: 0.9375rem;
  }
}
</style>
