<template>
  <q-page class="hospital-page">
    <div class="hospital-container">
      <!-- Header con título -->
      <div class="page-header">
        <div class="row items-center justify-between">
          <div class="col-auto">
            <h4 class="page-title">Información del Hospital</h4>
            <p class="page-subtitle">Gestiona los datos de tu hospital</p>
          </div>
          <div class="col-auto">
            <q-btn
              :label="editMode ? 'Cancelar' : 'Editar'"
              :color="editMode ? 'negative' : 'primary'"
              :icon="editMode ? 'close' : 'edit'"
              @click="toggleEditMode"
              class="q-mr-sm"
            />
            <q-btn
              v-if="editMode"
              label="Guardar"
              color="positive"
              icon="save"
              @click="saveHospital"
            />
          </div>
        </div>
      </div>

      <!-- Card principal -->
      <q-card class="hospital-card" flat bordered>
        <q-card-section class="q-pa-lg">
          <!-- Grid responsive de inputs -->
          <div class="row q-col-gutter-md">
            <!-- Nombre del Hospital -->
            <div class="col-12 col-md-6 col-lg-4">
              <q-input
                v-model="hospital.nombre"
                label="Nombre del Hospital"
                :readonly="!editMode"
                filled
                :bg-color="editMode ? 'white' : 'grey-2'"
                class="hospital-input"
              >
                <template v-slot:prepend>
                  <q-icon name="local_hospital" color="primary" />
                </template>
              </q-input>
            </div>
            <!-- Departamento -->
            <div class="col-12 col-md-6 col-lg-4">
              <q-input
                v-model="hospital.departamento"
                label="Departamento"
                :readonly="!editMode"
                filled
                :bg-color="editMode ? 'white' : 'grey-2'"
                class="hospital-input"
              >
                <template v-slot:prepend>
                  <q-icon name="business" color="primary" />
                </template>
              </q-input>
            </div>
            <!-- Dirección -->
            <div class="col-12 col-md-6 col-lg-4">
              <q-input
                v-model="hospital.direccion"
                label="Dirección"
                :readonly="!editMode"
                filled
                :bg-color="editMode ? 'white' : 'grey-2'"
                class="hospital-input"
              >
                <template v-slot:prepend>
                  <q-icon name="location_on" color="primary" />
                </template>
              </q-input>
            </div>
            <!-- Nivel -->
            <div class="col-12 col-md-6 col-lg-4">
              <q-input
                v-model="hospital.nivel"
                label="Nivel"
                :readonly="!editMode"
                filled
                :bg-color="editMode ? 'white' : 'grey-2'"
                class="hospital-input"
              >
                <template v-slot:prepend>
                  <q-icon name="star" color="primary" />
                </template>
              </q-input>
            </div>

            <!-- Correo -->
            <div class="col-12 col-md-6 col-lg-4">
              <q-input
                v-model="hospital.tipo"
                label="Tipo (Privado/Público)"
                type="email"
                :readonly="!editMode"
                filled
                :bg-color="editMode ? 'white' : 'grey-2'"
                class="hospital-input"
              >
                <template v-slot:prepend>
                  <q-icon name="business" color="primary" />
                </template>
              </q-input>
            </div>
            <!-- Teléfono -->
            <div class="col-12 col-md-6 col-lg-4">
              <q-input
                v-model="hospital.telefono"
                label="Teléfono"
                type="tel"
                :readonly="!editMode"
                filled
                :bg-color="editMode ? 'white' : 'grey-2'"
                class="hospital-input"
              >
                <template v-slot:prepend>
                  <q-icon name="phone" color="primary" />
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Sistema de Pestañas -->
      <q-card class="hospital-tabs-card" flat bordered>
        <q-tabs
          v-model="activeTab"
          dense
          class="text-grey-6"
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
        >
          <q-tab name="especialidades" icon="medical_services" label="Especialidades" />
          <q-tab name="salas" icon="bed" label="Salas y Camas" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <q-tab-panel name="especialidades" class="q-pa-none">
            <EspecialidadesComponent />
          </q-tab-panel>

          <q-tab-panel name="salas" class="q-pa-none">
            <SalasComponent />
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import EspecialidadesComponent from '../components/EspecialidadesComponent.vue'
import SalasComponent from '../components/SalasComponent.vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const $q = useQuasar()

// Inicializa las variables de estado
const originalHospitalData = ref({
  nombre: '',
  direccion: '',
  telefono: '',
  correo: '',
  acreditacion: '',
  horario: '',
})

const hospital = ref({ ...originalHospitalData.value })

const editMode = ref(false)
const activeTab = ref('especialidades')

// Función para obtener los detalles del hospital desde la API
const fetchHospitalDetails = async () => {
  try {
    const response = await api.get('/hospital-details/1') // Usa el 'api' en lugar de '$api'
    hospital.value = response.data
    originalHospitalData.value = { ...response.data } // Guardamos los datos originales
  } catch (error) {
    console.error('Error al obtener los detalles del hospital', error)
    $q.notify({
      type: 'negative',
      message: 'Error al obtener los detalles del hospital',
      position: 'top-right',
      icon: 'error',
    })
  }
}

// Llamada para obtener los datos cuando el componente se monta
onMounted(fetchHospitalDetails)

// Función para activar/desactivar el modo de edición
const toggleEditMode = () => {
  if (editMode.value) {
    // Si está cancelando, restaurar datos originales
    hospital.value = { ...originalHospitalData.value } // Esto restaura los datos originales del hospital
  }
  editMode.value = !editMode.value
}

// Función para guardar los cambios del hospital
const saveHospital = async () => {
  try {
    const response = await api.put(`/hospitals/1`, hospital.value) // Usa 'api' en lugar de 'axios'
    console.log('Hospital actualizado:', response.data)
    // Actualizamos los datos originales después de guardar
    originalHospitalData.value = { ...hospital.value }
    $q.notify({
      type: 'positive',
      message: 'Hospital actualizado correctamente',
      position: 'top-right',
      icon: 'check_circle',
    })
    editMode.value = false
  } catch (error) {
    console.error('Error al guardar los detalles del hospital', error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar los datos',
      position: 'top-right',
      icon: 'error',
    })
  }
}
</script>

<style scoped>
.hospital-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.hospital-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  padding: 20px 0;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 2rem;
  font-weight: 600;
  color: #1976d2;
}

.page-subtitle {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

.hospital-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: white;
}

.hospital-tabs-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: white;
  margin-top: 30px;
}

.hospital-input {
  transition: all 0.3s ease;
}

.hospital-input:hover {
  transform: translateY(-2px);
}

/* Responsive breakpoints específicos */
@media (max-width: 599px) {
  /* Móvil: 1 columna */
  .hospital-container {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-header .row {
    flex-direction: column;
    gap: 16px;
  }

  .hospital-card {
    border-radius: 12px;
  }
}

@media (min-width: 600px) and (max-width: 1023px) {
  /* Tablet: 2 columnas */
  .hospital-container {
    padding: 20px;
  }
}

@media (min-width: 1024px) {
  /* Desktop: 3 columnas */
  .hospital-container {
    padding: 24px;
  }

  .page-title {
    font-size: 2.2rem;
  }
}

/* Animaciones suaves */
.hospital-input .q-field__control {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.hospital-input:focus-within .q-field__control {
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.2);
}

/* Mejorar espaciado en diferentes tamaños */
@media (max-width: 599px) {
  .q-card-section {
    padding: 20px !important;
  }
}

@media (min-width: 1024px) {
  .q-card-section {
    padding: 40px !important;
  }
}
</style>
