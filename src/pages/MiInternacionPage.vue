<template>
  <div class="mi-internacion-page">
    <!-- Header -->
    <div class="page-header">
      <q-icon name="healing" size="56px" color="white" />
      <div class="header-text">
        <h1 class="titulo-principal">Mi Internación</h1>
        <p class="subtitulo">Información completa sobre tu estado de salud y cuidados</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <q-spinner-dots color="white" size="80px" />
      <p class="text-h6 q-mt-md text-white">Cargando información...</p>
    </div>

    <!-- Debug Info (temporal) -->
    <div v-else-if="hasInternacion === false" class="debug-container">
      <q-card class="debug-card">
        <q-card-section>
          <h4>🔍 Debug Info:</h4>
          <pre>{{ JSON.stringify({ hasInternacion, internacion }, null, 2) }}</pre>
        </q-card-section>
      </q-card>
    </div>

    <!-- No hay internación -->
    <div v-else-if="!hasInternacion" class="no-internacion-container">
      <q-card class="no-internacion-card">
        <q-card-section class="text-center q-pa-xl">
          <q-icon name="info" size="120px" color="grey-5" />
          <h3 class="text-h5 q-mt-lg q-mb-md">No tienes una internación activa</h3>
          <p class="text-body1 text-grey-7">
            Cuando seas admitido al hospital, toda tu información médica aparecerá aquí.
          </p>
        </q-card-section>
      </q-card>
    </div>

    <!-- Contenido Principal -->
    <div v-else class="contenido-principal">
      <!-- Tabs de Navegación -->
      <q-tabs
        v-model="tabActual"
        dense
        class="tabs-navegacion"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="general" icon="person" label="General" />
        <q-tab name="tratamientos" icon="medication" label="Tratamientos" />
        <q-tab name="alimentacion" icon="restaurant" label="Alimentación" />
        <q-tab name="vitales" icon="monitor_heart" label="Signos Vitales" />
        <q-tab name="cuidados" icon="health_and_safety" label="Cuidados" />
      </q-tabs>

      <q-separator />

      <!-- Panel de Contenido -->
      <q-tab-panels v-model="tabActual" animated class="tab-panels">
        <!-- Tab: General -->
        <q-tab-panel name="general" class="q-pa-md">
          <div class="info-grid">
            <!-- Información Personal -->
            <q-card class="info-card elevation-3">
              <q-card-section class="card-header bg-gradient-primary">
                <div class="flex items-center">
                  <q-icon name="person" size="32px" class="q-mr-sm" />
                  <span class="text-h6">Información Personal</span>
                </div>
              </q-card-section>
              <q-card-section class="q-pa-lg">
                <div class="info-row">
                  <q-icon name="badge" color="primary" size="20px" />
                  <strong>Nombre Completo:</strong>
                  <span
                    >{{ internacion.paciente.nombre }} {{ internacion.paciente.apellidos }}</span
                  >
                </div>
                <div class="info-row">
                  <q-icon name="fingerprint" color="primary" size="20px" />
                  <strong>CI:</strong>
                  <span>{{ internacion.paciente.ci }}</span>
                </div>
                <div class="info-row">
                  <q-icon name="cake" color="primary" size="20px" />
                  <strong>Edad:</strong>
                  <span>{{ calcularEdad(internacion.paciente.fecha_nacimiento) }} años</span>
                </div>
                <div class="info-row">
                  <q-icon name="wc" color="primary" size="20px" />
                  <strong>Género:</strong>
                  <span>{{
                    internacion.paciente.genero.charAt(0).toUpperCase() +
                    internacion.paciente.genero.slice(1)
                  }}</span>
                </div>
              </q-card-section>
            </q-card>

            <!-- Detalles de Internación -->
            <q-card class="info-card elevation-3">
              <q-card-section class="card-header bg-gradient-teal">
                <div class="flex items-center">
                  <q-icon name="local_hospital" size="32px" class="q-mr-sm" />
                  <span class="text-h6">Detalles de Internación</span>
                </div>
              </q-card-section>
              <q-card-section class="q-pa-lg">
                <div class="info-row">
                  <q-icon name="event" color="teal" size="20px" />
                  <strong>Fecha de Ingreso:</strong>
                  <span>{{ formatearFecha(internacion.fecha_ingreso) }}</span>
                </div>
                <div class="info-row">
                  <q-icon name="meeting_room" color="teal" size="20px" />
                  <strong>Sala:</strong>
                  <span>{{
                    internacion.ocupacion_activa?.cama?.sala?.nombre || 'No asignada'
                  }}</span>
                </div>
                <div class="info-row">
                  <q-icon name="bed" color="teal" size="20px" />
                  <strong>Cama:</strong>
                  <span>{{ internacion.ocupacion_activa?.cama?.nombre || 'No asignada' }}</span>
                </div>
                <div class="info-row">
                  <q-icon name="medical_services" color="teal" size="20px" />
                  <strong>Médico Tratante:</strong>
                  <span
                    >Dr(a). {{ internacion.medico?.nombre }}
                    {{ internacion.medico?.apellidos }}</span
                  >
                </div>
              </q-card-section>
            </q-card>

            <!-- Diagnóstico -->
            <q-card class="info-card full-width elevation-3">
              <q-card-section class="card-header bg-gradient-orange">
                <div class="flex items-center">
                  <q-icon name="medical_information" size="32px" class="q-mr-sm" />
                  <span class="text-h6">Diagnóstico</span>
                </div>
              </q-card-section>
              <q-card-section class="q-pa-lg">
                <p class="diagnostico-texto">
                  {{ internacion.diagnostico || 'Sin diagnóstico registrado' }}
                </p>
              </q-card-section>
            </q-card>
          </div>
        </q-tab-panel>

        <!-- Tab: Tratamientos -->
        <q-tab-panel name="tratamientos" class="q-pa-md">
          <div v-if="!internacion" class="text-center q-pa-xl">
            <q-spinner color="primary" size="50px" />
            <p class="q-mt-md">Cargando tratamientos...</p>
          </div>
          <ListaTratamientosReadOnly
            v-else
            :internacion="internacion"
            @recargar="fetchInternacionActiva"
          />
        </q-tab-panel>

        <!-- Tab: Alimentación -->
        <q-tab-panel name="alimentacion" class="q-pa-md">
          <div v-if="!internacion" class="text-center q-pa-xl">
            <q-spinner color="primary" size="50px" />
            <p class="q-mt-md">Cargando plan de alimentación...</p>
          </div>
          <AlimentacionPanelReadOnly
            v-else
            :internacion-id="internacion.id"
            :tratamiento-id="internacion.id"
          />
        </q-tab-panel>

        <!-- Tab: Signos Vitales -->
        <q-tab-panel name="vitales" class="q-pa-none">
          <div v-if="!internacion || !internacion.controles" class="text-center q-pa-xl">
            <q-spinner color="primary" size="50px" />
            <p class="q-mt-md">Cargando signos vitales...</p>
          </div>
          <SignosVitalesDashboardReadOnly
            v-else
            :controls="internacion.controles"
            :internacion="internacion"
          />
        </q-tab-panel>

        <!-- Tab: Cuidados -->
        <q-tab-panel name="cuidados" class="q-pa-md">
          <div v-if="!internacion" class="text-center q-pa-xl">
            <q-spinner color="primary" size="50px" />
            <p class="q-mt-md">Cargando cuidados...</p>
          </div>
          <CuidadosReadOnly v-else :internacion="internacion" />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { differenceInYears, format } from 'date-fns'
import { es } from 'date-fns/locale'

// Importar componentes read-only
import ListaTratamientosReadOnly from 'src/components/ListaTratamientosReadOnly.vue'
import AlimentacionPanelReadOnly from 'src/components/AlimentacionPanelReadOnly.vue'
import SignosVitalesDashboardReadOnly from 'src/components/SignosVitalesDashboardReadOnly.vue'
import CuidadosReadOnly from 'src/components/CuidadosReadOnly.vue'

const $q = useQuasar()

const loading = ref(true)
const hasInternacion = ref(false)
const internacion = ref(null)
const tabActual = ref('general')

const fetchInternacionActiva = async () => {
  loading.value = true
  try {
    console.log('🔄 Iniciando petición a /mi-internacion...')
    const response = await api.get('/mi-internacion')
    console.log('📡 Respuesta completa:', response.data)

    hasInternacion.value = response.data.has_internacion
    console.log('✅ Has internación:', hasInternacion.value)

    if (hasInternacion.value) {
      internacion.value = response.data.internacion
      console.log('📋 Datos de internación:', internacion.value)
      console.log('👤 Paciente:', internacion.value?.paciente)
      console.log('💊 Tratamientos:', internacion.value?.tratamientos)
      console.log('🍽️ Alimentaciones:', internacion.value?.alimentaciones)
      console.log('❤️ Controles:', internacion.value?.controles)
      console.log('🏥 Cuidados:', internacion.value?.cuidados)
    } else {
      console.log('⚠️ No hay internación activa')
    }
  } catch (error) {
    console.error('❌ Error al cargar internación:', error)
    console.error('❌ Detalles del error:', error.response?.data)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al cargar la información de internación',
      position: 'top',
    })
  } finally {
    loading.value = false
    console.log('✅ Loading finalizado. hasInternacion:', hasInternacion.value)
  }
}

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return 'N/A'
  return differenceInYears(new Date(), new Date(fechaNacimiento))
}

const formatearFecha = (fecha) => {
  if (!fecha) return 'N/A'
  return format(new Date(fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })
}

onMounted(() => {
  fetchInternacionActiva()
})
</script>

<style scoped>
.mi-internacion-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 40px;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 48px 24px;
  text-align: center;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.header-text {
  margin-top: 16px;
}

.titulo-principal {
  font-size: 3rem;
  font-weight: 800;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: -0.5px;
}

.subtitulo {
  font-size: 1.25rem;
  margin: 8px 0 0 0;
  opacity: 0.95;
  font-weight: 400;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: white;
}

.debug-container {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 24px;
}

.debug-card {
  background: #1e293b;
  color: #10b981;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.debug-card pre {
  overflow-x: auto;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #34d399;
}

.no-internacion-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 0 24px;
}

.no-internacion-card {
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.contenido-principal {
  max-width: 1400px;
  margin: -32px auto 0;
  background: white;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.tabs-navegacion {
  background: white;
  padding: 8px 0;
  border-bottom: 2px solid #f0f0f0;
}

.tab-panels {
  background: #f8fafc;
  min-height: 500px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.info-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
}

.info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15) !important;
}

.info-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  padding: 20px 24px;
  color: white;
  font-weight: 600;
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bg-gradient-teal {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
}

.bg-gradient-orange {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 1rem;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row strong {
  color: #475569;
  min-width: 140px;
  font-weight: 600;
}

.info-row span {
  color: #1e293b;
  flex: 1;
  font-weight: 500;
}

.diagnostico-texto {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #334155;
  margin: 0;
  font-weight: 500;
  text-align: justify;
}

/* Responsive */
@media (max-width: 768px) {
  .titulo-principal {
    font-size: 2rem;
  }

  .subtitulo {
    font-size: 1rem;
  }

  .page-header {
    padding: 32px 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .contenido-principal {
    margin: -16px 8px 0;
    border-radius: 16px 16px 0 0;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .info-row strong {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .titulo-principal {
    font-size: 1.5rem;
  }

  .tabs-navegacion :deep(.q-tab__label) {
    display: none;
  }
}
</style>
