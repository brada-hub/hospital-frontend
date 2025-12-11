<template>
  <q-page class="nutricion-page">
    <div class="page-container">
      <div class="header-section">
        <div class="header-content">
          <div>
            <h1 class="page-title">Panel de Nutrición</h1>
            <p class="page-subtitle">Gestiona los planes nutricionales de los pacientes internados</p>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">
        <q-spinner-dots color="teal" size="60px" />
        <p class="loading-text">Cargando pacientes...</p>
      </div>

      <div v-else-if="!internaciones.length" class="empty-state">
        <div class="empty-icon">
          <q-icon name="restaurant" size="120px" />
        </div>
        <h3 class="empty-title">No hay pacientes internados</h3>
        <p class="empty-subtitle">Actualmente no hay pacientes activos en el sistema</p>
      </div>

      <div v-else>
        <!-- Sección: Pendientes de Asignar Dieta -->
        <template v-if="pacientesSinDieta.length > 0">
          <div class="section-header q-mb-md">
            <q-icon name="priority_high" color="orange" size="24px" />
            <span class="section-title-text">Pendientes de Asignar Dieta</span>
            <q-badge color="orange" :label="pacientesSinDieta.length" />
          </div>
          <div class="patients-grid q-mb-xl">
            <div v-for="(internacion, index) in pacientesSinDieta" :key="internacion.id" class="patient-card sin-dieta" :style="{ animationDelay: `${index * 0.1}s` }">
              <div class="card-header">
                <div class="patient-icon"><q-icon name="person" size="32px" /></div>
                <div class="patient-info">
                  <h3 class="patient-name">{{ internacion.paciente.nombre }} {{ internacion.paciente.apellidos }}</h3>
                  <p class="patient-ci">CI: {{ internacion.paciente.ci }}</p>
                </div>
                <q-badge color="warning" label="Sin Dieta" class="status-badge" />
              </div>
              <div class="card-body">
                <div class="info-row">
                  <div class="info-item">
                    <q-icon name="hotel" size="20px" class="info-icon" />
                    <div class="info-content">
                      <span class="info-label">Cama</span>
                      <span class="info-value" v-if="internacion.ocupacion_activa">{{ internacion.ocupacion_activa.cama.sala.nombre }} - {{ internacion.ocupacion_activa.cama.nombre }}</span>
                      <span class="info-value" v-else>No asignada</span>
                    </div>
                  </div>
                </div>
                <div class="clinical-summary">
                  <q-chip v-if="internacion.paciente.edad" dense color="blue-grey-2" text-color="dark" size="sm"><q-icon name="cake" size="14px" class="q-mr-xs" />{{ internacion.paciente.edad }} años</q-chip>
                  <q-chip v-if="internacion.datos_antropometricos?.imc" dense color="amber-2" text-color="dark" size="sm"><q-icon name="monitor_weight" size="14px" class="q-mr-xs" />IMC: {{ internacion.datos_antropometricos.imc }}</q-chip>
                </div>
              </div>
              <div class="card-footer">
                <button class="view-panel-btn" @click="abrirPanelNutricion(internacion)"><span>Asignar Dieta</span><q-icon name="arrow_forward" size="20px" /></button>
              </div>
            </div>
          </div>
        </template>

        <!-- Sección: Con Plan Nutricional Activo -->
        <template v-if="pacientesConDieta.length > 0">
          <div class="section-header q-mb-md">
            <q-icon name="check_circle" color="positive" size="24px" />
            <span class="section-title-text">Con Plan Nutricional Activo</span>
            <q-badge color="positive" :label="pacientesConDieta.length" />
          </div>
          <div class="patients-grid">
            <div v-for="(internacion, index) in pacientesConDieta" :key="internacion.id" class="patient-card" :style="{ animationDelay: `${index * 0.1}s` }">
              <div class="card-header">
                <div class="patient-icon"><q-icon name="person" size="32px" /></div>
                <div class="patient-info">
                  <h3 class="patient-name">{{ internacion.paciente.nombre }} {{ internacion.paciente.apellidos }}</h3>
                  <p class="patient-ci">CI: {{ internacion.paciente.ci }}</p>
                </div>
                <q-badge color="positive" label="Dieta Activa" class="status-badge" />
              </div>
              <div class="card-body">
                <div class="info-row">
                  <div class="info-item">
                    <q-icon name="hotel" size="20px" class="info-icon" />
                    <div class="info-content">
                      <span class="info-label">Cama</span>
                      <span class="info-value" v-if="internacion.ocupacion_activa">{{ internacion.ocupacion_activa.cama.sala.nombre }} - {{ internacion.ocupacion_activa.cama.nombre }}</span>
                      <span class="info-value" v-else>No asignada</span>
                    </div>
                  </div>
                  <div class="info-item">
                    <q-icon name="restaurant_menu" size="20px" class="info-icon" />
                    <div class="info-content">
                      <span class="info-label">Dieta</span>
                      <span class="info-value">{{ internacion.alimentacion_activa?.tipo_dieta?.nombre }}</span>
                    </div>
                  </div>
                </div>
                <div class="clinical-summary">
                  <q-chip v-if="internacion.paciente.edad" dense color="blue-grey-2" text-color="dark" size="sm"><q-icon name="cake" size="14px" class="q-mr-xs" />{{ internacion.paciente.edad }} años</q-chip>
                  <q-chip v-if="internacion.datos_antropometricos?.imc" dense color="amber-2" text-color="dark" size="sm"><q-icon name="monitor_weight" size="14px" class="q-mr-xs" />IMC: {{ internacion.datos_antropometricos.imc }}</q-chip>
                </div>
              </div>
              <div class="card-footer">
                <button class="view-panel-btn" @click="abrirPanelNutricion(internacion)"><span>Gestionar Dieta</span><q-icon name="arrow_forward" size="20px" /></button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Panel Full-Screen del Paciente (Similar a Enfermería) -->
    <div v-if="mostrarDialog" class="panel-container">
      <div class="panel-header">
        <div class="header-left">
          <q-btn
            flat
            round
            dense
            icon="arrow_back"
            color="white"
            size="lg"
            @click="cerrarDialog"
            class="back-btn"
          >
            <q-tooltip>Volver a la lista</q-tooltip>
          </q-btn>
          <div class="panel-title-section" v-if="pacienteSeleccionado">
            <h2 class="panel-title">
              {{ pacienteSeleccionado.paciente.nombre }}
              {{ pacienteSeleccionado.paciente.apellidos }}
            </h2>
            <div class="panel-badges">
              <q-badge color="white" text-color="primary" class="header-badge">
                <q-icon name="badge" size="14px" class="q-mr-xs" />
                CI: {{ pacienteSeleccionado.paciente.ci }}
              </q-badge>
              <q-badge color="white" text-color="primary" class="header-badge">
                <q-icon name="cake" size="14px" class="q-mr-xs" />
                {{ calcularEdad(pacienteSeleccionado.paciente.fecha_nacimiento) }} años
              </q-badge>
            </div>
          </div>
        </div>

        <div class="header-right" v-if="pacienteSeleccionado">
          <div class="info-card">
            <div class="info-label">Diagnóstico</div>
            <div class="info-value text-ellipsis">{{ pacienteSeleccionado.diagnostico }}</div>
          </div>

          <div class="v-divider"></div>

          <div class="antropometria-group">
             <div class="info-metric">
              <div class="metric-label">Peso</div>
              <div class="metric-value">
                {{ pacienteSeleccionado.datos_antropometricos?.peso || '---' }}
              </div>
            </div>
            <div class="info-metric">
              <div class="metric-label">Altura</div>
              <div class="metric-value">
                {{ pacienteSeleccionado.datos_antropometricos?.altura || '---' }}
              </div>
            </div>
            <div class="info-metric">
              <div class="metric-label">IMC</div>
              <div class="metric-value">
                <q-badge :color="getImcColor(pacienteSeleccionado.datos_antropometricos?.imc)">
                  {{ pacienteSeleccionado.datos_antropometricos?.imc || '---' }}
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
      <div class="tab-content" v-if="pacienteSeleccionado">
        <!-- Pestaña: Alimentación (Principal) -->
        <div v-if="tabActiva === 'alimentacion'" class="content-section">

          <!-- MODO EDICIÓN O NUEVA DIETA (Común para roles que pueden editar) -->
          <template v-if="modoEdicion || modoNuevaDieta">
             <AlimentacionForm
              :internacion-id="pacienteSeleccionado.id"
              :alimentacion="modoEdicion ? pacienteSeleccionado.alimentacion_activa : null"
              @saved="onDietaGuardada"
              @cancel="cancelarFormulario"
            />
          </template>

          <!-- VISTA DE LECTURA / GESTIÓN (Dependiendo del Rol) -->
          <template v-else>

            <!-- CASO 1: MÉDICO O NUTRICIONISTA (Vista 'limpia' sin registro de consumos) -->
            <template v-if="isMedico || isNutricionista">
              <div class="role-view-container">
                <!-- Barra de Acciones para Nutricionista -->
                <div v-if="isNutricionista && pacienteSeleccionado.alimentacion_activa" class="actions-bar q-mb-md">
                   <div class="text-subtitle2 text-grey-7">Acciones de Nutrición</div>
                   <div class="row q-gutter-sm">
                      <q-btn
                        color="amber-9"
                        icon="edit"
                        label="Modificar Plan"
                        unelevated
                        class="action-btn"
                        @click="activarModoEdicion"
                      />
                      <q-btn
                        color="negative"
                        icon="block"
                        label="Suspender Dieta"
                        outline
                        class="action-btn"
                        @click="condirmarSuspensionDieta"
                      />
                   </div>
                </div>

                <!-- Botón para asignar dieta si no tiene (Solo Nutricionista) -->
                <div v-if="isNutricionista && !pacienteSeleccionado.alimentacion_activa" class="q-mb-md">
                   <q-btn
                      color="teal"
                      icon="add_circle"
                      label="Asignar Nuevo Plan"
                      unelevated
                      class="q-px-lg"
                      size="md"
                      @click="activarModoNuevaDieta"
                    />
                </div>

                <AlimentacionPanelReadOnly
                  :internacion-id="pacienteSeleccionado.id"
                />

                <ListaHistorialDietas
                  :internacion-id="pacienteSeleccionado.id"
                />
              </div>
            </template>

            <!-- CASO 2: ENFERMERÍA / OTROS (Vista operativa con registro de consumo) -->
            <template v-else>
               <!-- Si no tiene dieta activa -->
               <div v-if="!pacienteSeleccionado.alimentacion_activa" class="empty-diet-state">
                  <q-icon name="no_meals" size="60px" color="grey-4" />
                  <p>El paciente no tiene dieta asignada.</p>
               </div>

               <!-- Si tiene dieta activa -->
               <template v-else>
                 <AlimentacionPanel
                    :internacion-id="pacienteSeleccionado.id"
                    :read-only="false"
                    :fecha-internacion="pacienteSeleccionado.fecha_ingreso?.split(' ')[0]"
                  />
               </template>
            </template>

          </template>
        </div>

        <!-- Pestaña: Signos Vitales (Solo Lectura) -->
        <div v-if="tabActiva === 'signos'" class="content-section">
          <!-- ... (resto igual) -->
          <div v-if="!haySignosVitales" class="empty-content">
            <q-icon name="monitor_heart" size="64px" />
            <p>No hay signos vitales registrados</p>
          </div>
          <SignosVitalesDashboardReadOnly
            v-else
            :controls="pacienteSeleccionado.controles"
            :internacion="pacienteSeleccionado"
          />
        </div>

        <!-- Pestaña: Tratamientos (Solo Lectura) -->
        <div v-if="tabActiva === 'tratamientos'" class="content-section">
          <ListaTratamientosReadOnly
            :internacion="pacienteSeleccionado"
            @recargar="fetchPacientes"
          />
        </div>

          <!-- Pestaña: Plan de Cuidados (Solo Lectura) -->
        <div v-if="tabActiva === 'cuidados'" class="content-section">
          <CuidadosReadOnly
            :internacion="internacionParaCuidados"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'boot/axios'
import { useQuasar, Notify } from 'quasar' // Keep Notify here if used directly or via $q
import { useUserStore } from 'src/stores/user' // Importar Store
import AlimentacionPanel from 'src/components/AlimentacionPanel.vue'
import AlimentacionPanelReadOnly from 'src/components/AlimentacionPanelReadOnly.vue' // Importar ReadOnly
import ListaHistorialDietas from 'src/components/ListaHistorialDietas.vue' // Importar Historial
import AlimentacionForm from 'src/components/AlimentacionForm.vue'
import SignosVitalesDashboardReadOnly from 'src/components/SignosVitalesDashboardReadOnly.vue'
import ListaTratamientosReadOnly from 'src/components/ListaTratamientosReadOnly.vue'
import CuidadosReadOnly from 'src/components/CuidadosReadOnly.vue'

const route = useRoute()
const $q = useQuasar() // Use Quasar composable
const userStore = useUserStore() // Usar Store

const internaciones = ref([])
const isLoading = ref(true)
const mostrarDialog = ref(false)
const pacienteSeleccionado = ref(null)
const modoEdicion = ref(false)
const modoNuevaDieta = ref(false)
const tabActiva = ref('alimentacion')

// ROL COMPUTED PROPERTIES
// Ajustar los nombres de roles según la BD ('Medico', 'Nutricionista', etc.)
const isMedico = computed(() => userStore.user?.rol?.nombre?.toLowerCase().includes('medico') || userStore.user?.rol?.nombre?.toLowerCase().includes('médico'))
const isNutricionista = computed(() => userStore.user?.rol?.nombre?.toLowerCase().includes('nutricio'))

// Tabs configuration
const tabs = [
  { id: 'alimentacion', label: 'Alimentación', icon: 'restaurant_menu' },
  { id: 'signos', label: 'Signos Vitales', icon: 'monitor_heart' },
  { id: 'tratamientos', label: 'Tratamientos', icon: 'medication' },
  { id: 'cuidados', label: 'Plan de Cuidados', icon: 'assignment' },
]

// ... (Resto de computed properties igual) ...
// Computed: Pacientes sin dieta (prioritarios)
const pacientesSinDieta = computed(() =>
  internaciones.value.filter(i => !i.alimentacion_activa)
)

// Computed: Pacientes con dieta activa
const pacientesConDieta = computed(() =>
  internaciones.value.filter(i => i.alimentacion_activa)
)

// Watch for query param changes
watch(() => route.query.internacion, (newInternacionId) => {
  if (newInternacionId && internaciones.value.length > 0) {
    abrirPacienteDesdeNotificacion(newInternacionId)
  }
})

function abrirPacienteDesdeNotificacion(internacionId) {
  const internacion = internaciones.value.find(i => i.id == internacionId)
  if (internacion) {
    abrirPanelNutricion(internacion)
  }
}

onMounted(async () => {
  await fetchPacientes()
  if (route.query.internacion) {
    abrirPacienteDesdeNotificacion(route.query.internacion)
  }
})

// ... (fetchPacientes y abrirPanelNutricion igual) ...
async function fetchPacientes() {
  isLoading.value = true
  try {
    const response = await api.get('/internaciones/activas')
    internaciones.value = response.data
  } catch (error) {
    console.error('Error al cargar pacientes:', error)
    Notify.create({
      color: 'negative',
      message: 'No se pudo cargar la lista de pacientes.',
      icon: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

async function abrirPanelNutricion(internacion) {
  pacienteSeleccionado.value = internacion
  modoEdicion.value = false
  modoNuevaDieta.value = false
  tabActiva.value = 'alimentacion'
  mostrarDialog.value = true

  try {
    const response = await api.get(`/internaciones/${internacion.id}/vista-completa`)
    pacienteSeleccionado.value = {
      ...response.data,
      controles: response.data.controles || [],
      tratamientos: response.data.tratamientos || [],
      plan_de_cuidados: response.data.plan_de_cuidados || [],
      evolucion_enfermeria: response.data.evolucion_enfermeria || [],
      alimentacion_activa: response.data.alimentaciones?.find(a => a.estado === 0) || null
    }
  } catch (error) {
    console.error('Error al cargar datos completos:', error)
    Notify.create({
      color: 'warning',
      message: 'No se pudieron cargar algunos detalles del historial.',
      icon: 'warning'
    })
  }
}

function cambiarTab(tabId) {
  tabActiva.value = tabId
}

const haySignosVitales = computed(() => {
  if (!pacienteSeleccionado.value?.controles) return false
  return pacienteSeleccionado.value.controles.some(
    (c) => c && Array.isArray(c.valores) && c.valores.length > 0,
  )
})

const internacionParaCuidados = computed(() => {
  if (!pacienteSeleccionado.value) return { cuidados: [] }
  const plan = pacienteSeleccionado.value.plan_de_cuidados || []
  const evoluciones = pacienteSeleccionado.value.evolucion_enfermeria || []
  return {
    ...pacienteSeleccionado.value,
    cuidados: [...plan, ...evoluciones]
  }
})

function cerrarDialog() {
  mostrarDialog.value = false
  pacienteSeleccionado.value = null
  modoEdicion.value = false
  modoNuevaDieta.value = false
}

function activarModoEdicion() {
  modoEdicion.value = true
}

function activarModoNuevaDieta() {
  modoNuevaDieta.value = true
}

function cancelarFormulario() {
  // Si estaba editando y cancela, volver a ver el panel (read only para nutricionista)
  modoEdicion.value = false
  modoNuevaDieta.value = false
}

// LOGICA DE SUSPENSIÓN (NUEVO)
// LOGICA DE SUSPENSIÓN (NUEVO)
function condirmarSuspensionDieta() {
  $q.dialog({
    title: 'Confirmar Suspensión',
    message: 'Por favor, indique el motivo de la suspensión de la dieta:',
    prompt: {
      model: '',
      type: 'text',
      isValid: val => val.length > 5, // Validar que tenga algo de texto
    },
    ok: {
      label: 'Suspender',
      color: 'negative',
      flat: true
    },
    cancel: {
      label: 'Cancelar',
      color: 'primary',
      flat: true
    },
    persistent: true
  }).onOk((motivo) => {
    suspenderDieta(motivo)
  })
}

async function suspenderDieta(motivo) {
  if (!pacienteSeleccionado.value?.alimentacion_activa?.id) return

  try {
    // Usamos el endpoint específico para suspender
    await api.post(`/alimentaciones/${pacienteSeleccionado.value.alimentacion_activa.id}/suspender`, {
      motivo_suspension: motivo
    })

    Notify.create({
      color: 'positive',
      message: 'Dieta suspendida correctamente',
      icon: 'check_circle'
    })

    // Recargar datos
    await onDietaActualizada()

  } catch (error) {
    console.error('Error al suspender dieta:', error)
    const errorMsg = error.response?.data?.message || 'Error al suspender la dieta'
    Notify.create({
      color: 'negative',
      message: errorMsg,
      icon: 'error'
    })
  }
}



// ... (onDietaGuardada, onDietaActualizada etc) ...
async function onDietaGuardada() {
  const currentId = pacienteSeleccionado.value?.id
  await fetchPacientes()
  modoEdicion.value = false
  modoNuevaDieta.value = false

  if (currentId) {
    // Recargar el paciente seleccionado completamente para actualizar la vista
    const internacion = internaciones.value.find(i => i.id === currentId)
    if(internacion) {
        // Truco para refrescar
        await abrirPanelNutricion(internacion)
    }
  }

  Notify.create({
    color: 'positive',
    message: 'Dieta guardada correctamente',
    icon: 'check_circle',
  })
}

async function onDietaActualizada() {
   // Reutilizamos lógica de recarga
   const currentId = pacienteSeleccionado.value?.id
   await fetchPacientes() // Actualiza lista principal

   if (currentId) {
      const internacion = internaciones.value.find(i => i.id === currentId)
      if(internacion) {
        await abrirPanelNutricion(internacion)
      }
   }
}

// ... (Helpers) ...

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
.nutricion-page {
  background: #f8fafc;
  min-height: 100vh;
}

.page-container {
  margin: 0 auto;
  padding: clamp(16px, 2vw, 32px);
}

/* Section Headers */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-title-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
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
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
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
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d97706;
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

.patient-card.sin-dieta {
  border-left: 4px solid #0d9488;
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

.text-warning {
  color: #94a3b8;
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

/* Dialog Styles */
.dialog-card {
  display: flex;
  flex-direction: column;
}

.dialog-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
}

.dialog-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f8fafc;
}

/* Clinical Summary in Cards */
.clinical-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

/* Dialog Content Grid */
.dialog-content-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
  min-height: calc(100vh - 150px);
}

@media (max-width: 1024px) {
  .dialog-content-grid {
    grid-template-columns: 1fr;
  }
}

/* NEW STYLES FOR ROLE VIEW */
.role-view-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fadeIn 0.4s ease-out;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
}

.action-btn {
  font-weight: 600;
  letter-spacing: 0.3px;
}

.empty-diet-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  color: #94a3b8;
  gap: 16px;
  background: white;
}


.clinical-panel {
  position: sticky;
  top: 0;
  align-self: start;
}

.diet-panel {
  min-width: 0;
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

/* Panel Full-Screen Styles (Embed mode) */
.panel-container {
  min-height: 100%;
  width: 100%;
  background: #f8fafc;
  /* Changed from fixed to absolute to stay within the layout */
  position: absolute;
  top: 0;
  left: 0;
  z-index: 50; /* Lower z-index to stay under navbar/drawer if needed, but above page content */
  display: flex;
  flex-direction: column;
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


/* Tabs Styles */
.tabs-container {
  background: white;
  border-bottom: 2px solid #e2e8f0;
  position: sticky;
  top: 80px;
  z-index: 99;
}

.tabs-wrapper {
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

/* Tab Content */
.tab-content {
  width: 100%;
  padding: clamp(16px, 2vw, 32px);
  /* Removed margin: 0 auto to allow full width expansion if container permits */
  flex: 1;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
