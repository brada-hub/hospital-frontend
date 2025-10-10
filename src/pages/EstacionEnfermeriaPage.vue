<template>
  <q-page class="estacion-container">
    <div class="estacion-header">
      <div class="header-content">
        <div class="header-icon">
          <q-icon name="local_hospital" size="48px" />
        </div>
        <div class="header-text">
          <h1 class="header-title">Estación de Enfermería</h1>
          <p class="header-subtitle">Pacientes internados actualmente</p>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <q-spinner-dots color="teal-6" size="60px" />
      <p class="loading-text">Cargando pacientes...</p>
    </div>

    <div v-else-if="!internaciones.length" class="empty-state">
      <div class="empty-icon">
        <q-icon name="personal_injury" size="120px" />
      </div>
      <h3 class="empty-title">No hay pacientes internados</h3>
      <p class="empty-description">
        Actualmente no hay pacientes registrados en la estación de enfermería
      </p>
    </div>

    <div v-else class="pacientes-grid">
      <div
        v-for="(internacion, index) in internaciones"
        :key="internacion.id"
        class="paciente-card"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <div class="card-header">
          <div class="patient-info">
            <q-icon name="person" size="24px" class="patient-icon" />
            <div class="patient-name">
              <h3>{{ internacion.paciente.nombre }} {{ internacion.paciente.apellidos }}</h3>
            </div>
          </div>
          <q-btn
            flat
            dense
            round
            :icon="internacionAbiertaId === internacion.id ? 'expand_less' : 'expand_more'"
            class="expand-btn"
            @click="toggleExpansion(internacion.id)"
          />
        </div>

        <div class="card-body">
          <div v-if="internacion.ocupacionActiva" class="patient-details">
            <div class="detail-item">
              <q-icon name="bed" size="20px" class="detail-icon" />
              <span class="detail-label">Cama:</span>
              <span class="detail-value">
                {{ internacion.ocupacionActiva.cama.sala.nombre }} -
                {{ internacion.ocupacionActiva.cama.nombre }}
              </span>
            </div>
            <div class="detail-item">
              <q-icon name="event" size="20px" class="detail-icon" />
              <span class="detail-label">Ingreso:</span>
              <span class="detail-value">{{ formatDateTime(internacion.fecha_ingreso) }}</span>
            </div>
          </div>

          <div v-if="internacionAbiertaId === internacion.id" class="dashboard-container">
            <PacienteDashboard
              :internacion="internacion"
              @reabrir-paciente="(id) => (internacionAbiertaId = id)"
              @recargar-pacientes="fetchPacientes"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { Notify } from 'quasar'
import { format } from 'date-fns'
import PacienteDashboard from 'src/components/PacienteDashboard.vue'

const internaciones = ref([])
const isLoading = ref(true)
const internacionAbiertaId = ref(null)

function toggleExpansion(id) {
  internacionAbiertaId.value = internacionAbiertaId.value === id ? null : id
}

async function fetchPacientes() {
  isLoading.value = true
  const idParaReabrir = internacionAbiertaId.value

  try {
    const response = await api.get('/estacion-enfermeria/pacientes')
    console.log('[v0 DEBUG BACKEND] Respuesta completa:', response.data)
    console.log('[v0 DEBUG BACKEND] Primera internacion:', response.data[0])
    console.log('[v0 DEBUG BACKEND] Controles de primera internacion:', response.data[0]?.controles)

    internaciones.value = response.data
    internacionAbiertaId.value = idParaReabrir
  } catch (error) {
    console.error('Error al cargar pacientes:', error)
    Notify.create({ color: 'negative', message: 'No se pudo cargar la lista de pacientes.' })
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchPacientes)

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A'
  try {
    // Ajuste para compatibilidad con diferentes formatos de fecha/hora
    const date = new Date(dateTimeString)
    if (isNaN(date)) return 'N/A'
    return format(date, 'dd/MM/yyyy HH:mm')
  } catch {
    return 'N/A'
  }
}
</script>

<style scoped>
/* Estilos del componente padre (EstacionEnfermeria) */
.estacion-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
  padding: 24px;
}

.estacion-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 20px rgba(13, 148, 136, 0.2);
  animation: slideDown 0.5s ease-out;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.header-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.header-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 20px;
}

.loading-text {
  font-size: 1.1rem;
  color: #0d9488;
  font-weight: 500;
}

.empty-state {
  background: white;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.5s ease-out;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 12px 0;
}

.pacientes-grid {
  display: grid;
  gap: 24px;
}

.paciente-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out backwards;
}

.paciente-card:hover {
  box-shadow: 0 8px 24px rgba(13, 148, 136, 0.15);
  transform: translateY(-4px);
}

.card-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.patient-name h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.expand-btn {
  color: white;
}

.card-body {
  padding: 24px;
}

.patient-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f0fdfa;
  border-radius: 8px;
  border-left: 3px solid #0d9488;
}

.detail-icon {
  color: #0d9488;
}

.detail-label {
  font-weight: 600;
  color: #334155;
}

.dashboard-container {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #e2e8f0;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
