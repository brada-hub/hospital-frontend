<template>
  <q-page class="estacion-container">
    <!-- Vista de Lista de Pacientes -->
    <div v-if="!mostrarPanel" class="page-container">
      <div class="estacion-header">
        <div class="header-content">

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
                  <span class="info-label">Ingreso</span>
                  <span class="info-value">{{ formatDateTime(internacion.fecha_ingreso) }}</span>
                </div>
              </div>
            </div>

            <div class="info-row q-mt-sm">
              <div class="info-item full-width">
                <q-icon name="medical_services" size="20px" class="info-icon" />
                <div class="info-content">
                  <span class="info-label">Diagnóstico</span>
                  <span class="info-value text-weight-bold">{{
                    internacion.diagnostico || 'Sin diagnóstico registrado'
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Datos Antropométricos -->
            <div v-if="internacion.datos_antropometricos" class="datos-rapidos">
              <div class="dato-quick">
                <q-icon name="height" size="16px" />
                <span>{{ internacion.datos_antropometricos.altura || 'N/A' }}</span>
              </div>
              <div class="dato-quick">
                <q-icon name="monitor_weight" size="16px" />
                <span>{{ internacion.datos_antropometricos.peso || 'N/A' }}</span>
              </div>
              <div class="dato-quick">
                <q-icon name="calculate" size="16px" />
                <span>IMC: {{ internacion.datos_antropometricos.imc || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="view-panel-btn" @click="abrirPanelPaciente(internacion.id)">
              <span>Ver Panel Completo</span>
              <q-icon name="arrow_forward" size="20px" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista del Panel del Paciente -->
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
          <div class="panel-title-section">
            <h2 class="panel-title">
              {{ internacionActual.paciente.nombre }}
              {{ internacionActual.paciente.apellidos }}
            </h2>
            <div class="panel-badges">
              <q-badge color="white" text-color="primary" class="header-badge">
                <q-icon name="badge" size="14px" class="q-mr-xs" />
                CI: {{ internacionActual.paciente.ci }}
              </q-badge>
              <q-badge color="white" text-color="primary" class="header-badge">
                <q-icon name="cake" size="14px" class="q-mr-xs" />
                {{ calcularEdad(internacionActual.paciente.fecha_nacimiento) }} años
              </q-badge>
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="info-card">
            <div class="info-label">Diagnóstico</div>
            <div class="info-value text-ellipsis">{{ internacionActual.diagnostico || 'Sin diagnóstico' }}</div>
          </div>

          <div class="v-divider"></div>

          <div class="antropometria-group">
             <div class="info-metric">
              <div class="metric-label">Peso</div>
              <div class="metric-value">
                {{ internacionActual.datos_antropometricos?.peso || '---' }}
              </div>
            </div>
            <div class="info-metric">
              <div class="metric-label">Altura</div>
              <div class="metric-value">
                {{ internacionActual.datos_antropometricos?.altura || '---' }}
              </div>
            </div>
            <div class="info-metric">
              <div class="metric-label">IMC</div>
              <div class="metric-value">
                <q-badge :color="getImcColor(internacionActual.datos_antropometricos?.imc)">
                  {{ internacionActual.datos_antropometricos?.imc || '---' }}
                </q-badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navegación por Pestañas -->
      <div class="tabs-container">
        <div class="tabs-wrapper">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: tabActiva === tab.id }"
            @click="cambiarTab(tab.id)"
          >
            <q-icon :name="tab.icon" size="24px" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>

      <!-- Contenido de las Pestañas -->
      <div class="tab-content">
        <!-- Pestaña: Signos Vitales -->
        <div v-if="tabActiva === 'signos'" class="content-section">
          <div class="section-header">
            <h3>Signos Vitales</h3>
            <q-btn
              unelevated
              color="teal-6"
              icon="add"
              label="Registrar Signos"
              @click="abrirDialogoRegistrarSignos"
            />
          </div>

          <div v-if="!haySignosVitales" class="empty-content">
            <q-icon name="analytics" size="64px" />
            <p>No hay signos vitales registrados</p>
          </div>
          <SignosVitalesDashboard
            v-else
            :controls="internacionActual.controles"
            :internacion="internacionActual"
          />
        </div>

        <!-- Pestaña: Tratamientos -->
        <div v-if="tabActiva === 'tratamientos'" class="content-section">
          <div class="section-header">
            <h3>Tratamientos</h3>
          </div>
          <ListaTratamientos
            :internacion="internacionActual"
            @recargar-pacientes="fetchPacientes"
          />
        </div>

        <!-- Pestaña: Alimentación -->
        <div v-if="tabActiva === 'alimentacion'" class="content-section">
          <div class="section-header">
            <h3>Registro de Alimentación</h3>
          </div>
          <PanelAlimentacion
            :internacion-id="internacionActual.id"
            :tratamiento-id="tratamientoPrincipalId"
          />
        </div>

        <!-- Pestaña: Plan de Cuidados -->
        <div v-if="tabActiva === 'cuidados'" class="content-section">
          <div class="section-header">
            <h3>Plan de Cuidados y Evolución</h3>
            <q-btn
              unelevated
              color="teal-6"
              icon="add"
              label="Registrar Novedad"
              @click="abrirDialogoCrearCuidadoRapido"
            />
          </div>
          <PlanCuidados
            :plan="internacionActual.plan_de_cuidados"
            @recargar-pacientes="fetchPacientes"
          />
          <q-separator class="my-4" />
          <EvolucionEnfermeria :evoluciones="internacionActual.evolucion_enfermeria" />
        </div>
      </div>
    </div>

    <!-- Diálogo de Signos Vitales -->
    <q-dialog v-model="dialogoSignosVisible">
      <q-card class="signos-dialog">
        <q-card-section class="dialog-header">
          <div class="dialog-title">
            <q-icon name="monitor_heart" size="28px" />
            <span>Registrar Signos Vitales</span>
          </div>
          <div v-if="internacionActual" class="dialog-subtitle">
            Paciente: {{ internacionActual.paciente.nombre }}
            {{ internacionActual.paciente.apellidos }}
          </div>
        </q-card-section>
        <q-card-section class="dialog-body">
          <FormularioSignosVitales ref="formSignosRef" tipo="rutinario" />
          <q-input
            v-model="observacionesSignos"
            type="textarea"
            label="Observaciones generales (opcional)"
            outlined
            class="q-mt-md"
            autogrow
          />
        </q-card-section>
        <q-card-actions class="dialog-actions">
          <q-btn flat label="Cancelar" class="cancel-btn" v-close-popup />
          <q-btn
            unelevated
            label="Guardar Registro"
            class="save-btn"
            @click="handleGuardarSignosVitales"
            :loading="isSavingSignos"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from 'boot/axios'
import { Notify, Dialog } from 'quasar'
import FormularioSignosVitales from 'src/components/FormularioSignosVitales.vue'
import SignosVitalesDashboard from 'src/components/SignosVitalesDashboard.vue'
import ListaTratamientos from 'src/components/ListaTratamientos.vue'
import PanelAlimentacion from 'src/components/PanelAlimentacion.vue'
import PlanCuidados from 'src/components/PlanCuidados.vue'
import EvolucionEnfermeria from 'src/components/EvolucionEnfermeria.vue'
import { useUserStore } from 'stores/user'

const internaciones = ref([])
const isLoading = ref(true)
const mostrarPanel = ref(false)
const internacionSeleccionadaId = ref(null)
const tabActiva = ref('signos')
const dialogoSignosVisible = ref(false)
const formSignosRef = ref(null)
const observacionesSignos = ref('')
const isSavingSignos = ref(false)
const userStore = useUserStore()

const tabs = [
  { id: 'signos', label: 'Signos Vitales', icon: 'monitor_heart' },
  { id: 'tratamientos', label: 'Tratamientos', icon: 'medication' },
  { id: 'alimentacion', label: 'Alimentación', icon: 'restaurant_menu' },
  { id: 'cuidados', label: 'Plan de Cuidados', icon: 'assignment' },
]

const internacionActual = computed(() => {
  if (!internacionSeleccionadaId.value) return null
  return internaciones.value.find((i) => i.id === internacionSeleccionadaId.value)
})

const haySignosVitales = computed(() => {
  if (!internacionActual.value?.controles) return false
  return internacionActual.value.controles.some(
    (c) => c && Array.isArray(c.valores) && c.valores.length > 0,
  )
})

const tratamientoPrincipalId = computed(() => {
  if (!internacionActual.value?.tratamientos?.length) return null
  return internacionActual.value.tratamientos[0].id
})

async function fetchPacientes() {
  isLoading.value = true
  try {
    const response = await api.get('/estacion-enfermeria/pacientes')
    internaciones.value = response.data
  } catch (error) {
    console.error('Error al cargar pacientes:', error)
    Notify.create({ color: 'negative', message: 'No se pudo cargar la lista de pacientes.' })
  } finally {
    isLoading.value = false
  }
}

function abrirPanelPaciente(id) {
  internacionSeleccionadaId.value = id
  mostrarPanel.value = true
  tabActiva.value = 'signos'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cerrarPanel() {
  mostrarPanel.value = false
  internacionSeleccionadaId.value = null
  fetchPacientes()
}

function cambiarTab(tabId) {
  tabActiva.value = tabId
}

function abrirDialogoRegistrarSignos() {
  observacionesSignos.value = ''
  dialogoSignosVisible.value = true
}

async function handleGuardarSignosVitales() {
  if (!formSignosRef.value || !internacionActual.value) return

  const { datos, esValido } = await formSignosRef.value.validarYObtenerDatos()

  if (!esValido) {
    Notify.create({ color: 'warning', message: 'Debe registrar al menos un signo vital.' })
    return
  }

  isSavingSignos.value = true
  try {
    await api.post('/controls', {
      internacion_id: internacionActual.value.id,
      observaciones: observacionesSignos.value,
      valores: datos,
    })
    Notify.create({ color: 'positive', message: 'Signos vitales registrados correctamente.' })
    dialogoSignosVisible.value = false
    await fetchPacientes()
  } catch (error) {
    console.error('Error al guardar signos vitales:', error)
    Notify.create({ color: 'negative', message: 'Hubo un error al guardar el registro.' })
  } finally {
    isSavingSignos.value = false
  }
}

function abrirDialogoCrearCuidadoRapido() {
  const idUsuario = userStore.user?.id
  if (!idUsuario) {
    Notify.create({ color: 'negative', message: 'Error de sesión. Usuario no identificado.' })
    return
  }

  Dialog.create({
    title: `Registrar Novedad / Cuidado a Demanda`,
    message: 'Describe el evento o cuidado que acabas de realizar.',
    prompt: {
      model: '',
      type: 'textarea',
      label: 'Descripción completa',
      isValid: (val) => val.length > 0 && val.length <= 255,
    },
    cancel: true,
    persistent: true,
  }).onOk(async (descripcionCompleta) => {
    try {
      await api.post('/cuidados-directo', {
        internacion_id: internacionActual.value.id,
        descripcion_completa: descripcionCompleta,
      })
      Notify.create({
        color: 'info',
        message: 'Novedad registrada exitosamente.',
      })
      await fetchPacientes()
    } catch (error) {
      console.error('Error al registrar cuidado:', error)
      Notify.create({
        color: 'negative',
        message: error.response?.data?.message || 'Error al crear el registro.',
      })
    }
  })
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A'
  try {
    const date = new Date(dateTimeString)
    if (isNaN(date)) return 'N/A'

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return 'N/A'
  }
}

onMounted(fetchPacientes)
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

</script>

<style scoped>
.estacion-container {
  min-height: 100vh;
  background: #f8fafc;
}

.page-container {
  /* Removed max-width */
  margin: 0 auto;
  padding: clamp(16px, 2vw, 32px);
}

/* Header */
.estacion-header {
  background: transparent;
  padding: 0;
  margin-bottom: clamp(24px, 3vw, 32px);
  box-shadow: none;
  border-radius: 0;
  animation: slideDown 0.5s ease-out;
}

.header-content {
  display: flex;
  align-items: center;
  gap: clamp(16px, 2vw, 20px);
  flex-wrap: wrap;
}



.header-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.header-subtitle {
  font-size: clamp(0.9rem, 1.5vw, 1.1rem);
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

/* Loading y Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 20px;
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
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

/* Grid de Pacientes - FLUID */
.pacientes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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
}

.patient-info {
  flex: 1;
}

.patient-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0 0 4px 0;
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
}

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

.info-icon {
  color: #0d9488;
  flex-shrink: 0;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.info-value {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1e293b;
}

.datos-rapidos {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: #f0fdfa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.dato-quick {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #0d9488;
  font-size: 0.875rem;
  font-weight: 500;
}

.card-footer {
  padding: 16px 24px;
  background: #f8fafc;
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

/* Panel del Paciente */
.panel-container {
  min-height: 100vh;
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


/* Pestañas */
.tabs-container {
  background: white;
  border-bottom: 2px solid #e2e8f0;
  position: sticky;
  top: 80px;
  z-index: 99;
}

.tabs-wrapper {
  /* Removed max-width */
  margin: 0 auto;
  display: flex;
  gap: 8px;
  padding: 0 24px;
  overflow-x: auto;
}

.tab-btn {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #0d9488;
  background: #f0fdfa;
}

.tab-btn.active {
  color: #0d9488;
  border-bottom-color: #0d9488;
}

/* Contenido */
.tab-content {
  /* Removed max-width */
  margin: 0 auto;
  padding: clamp(16px, 2vw, 32px);
}

.content-section {
  animation: fadeIn 0.4s ease-out;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
  color: #9ca3af;
}

.empty-content p {
  margin-top: 16px;
  font-size: 1rem;
}

.my-4 {
  margin: 24px 0;
}

/* Diálogo */
.signos-dialog {
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
}

.dialog-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  padding: 24px;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}

.dialog-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin-left: 40px;
}

.dialog-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-actions {
  background: #f9fafb;
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  color: #6b7280;
  font-weight: 600;
}

.save-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-weight: 600;
}

/* Animaciones */
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

/* Responsive */
@media (max-width: 1024px) {
  .pacientes-grid {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 24px 16px;
  }

  .pacientes-grid {
    grid-template-columns: 1fr;
  }

  .tabs-wrapper {
    padding: 0 16px;
  }

  .tab-btn {
    padding: 12px 16px;
    font-size: 0.875rem;
  }

  .tab-content {
    padding: 24px 16px;
  }

  .signos-dialog {
    min-width: 90vw;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
