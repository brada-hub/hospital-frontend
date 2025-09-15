<template>
  <q-page class="hospital-page">
    <div class="hospital-container">
      <div class="page-header">
        <div class="row items-center justify-between">
          <div class="col-auto">
            <h4 class="page-title">Información y {{ hospital.nombre || 'Mi Hospital' }}</h4>
            <p class="page-subtitle">Gestiona los datos de tu hospital</p>
          </div>
        </div>
      </div>

      <q-card class="hospital-card" flat bordered>
        <q-form ref="hospitalForm" @submit.prevent="saveHospital">
          <q-card-section class="q-pa-lg">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6 col-lg-4">
                <q-input
                  v-model="hospital.nombre"
                  label="Nombre del Hospital"
                  :readonly="!editMode"
                  filled
                  :bg-color="editMode ? 'white' : 'grey-2'"
                  class="hospital-input"
                  :rules="[
                    (val) => !!val || 'El nombre es requerido',
                    (val) => /^[a-zA-Z\s]+$/.test(val) || 'Solo se permiten letras',
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="local_hospital" color="teal" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-6 col-lg-4">
                <q-select
                  v-model="hospital.departamento"
                  label="Departamento"
                  :readonly="!editMode"
                  filled
                  :bg-color="editMode ? 'white' : 'grey-2'"
                  :options="['La Paz', 'Cochabamba', 'Santa Cruz']"
                  class="hospital-input"
                  :rules="[(val) => !!val || 'El departamento es requerido']"
                >
                  <template v-slot:prepend>
                    <q-icon name="business" color="teal" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-6 col-lg-4">
                <q-input
                  v-model="hospital.direccion"
                  label="Dirección"
                  :readonly="!editMode"
                  filled
                  :bg-color="editMode ? 'white' : 'grey-2'"
                  class="hospital-input"
                  :rules="[
                    (val) => !!val || 'La dirección es requerida',
                    (val) => /^[a-zA-Z0-9\s#.,-]+$/.test(val) || 'Caracteres no válidos',
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="location_on" color="teal" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-6 col-lg-4">
                <q-select
                  v-model="hospital.nivel"
                  label="Nivel"
                  :readonly="!editMode"
                  filled
                  :bg-color="editMode ? 'white' : 'grey-2'"
                  :options="['Nivel 1', 'Nivel 2', 'Nivel 3']"
                  class="hospital-input"
                  :rules="[(val) => !!val || 'El nivel es requerido']"
                >
                  <template v-slot:prepend>
                    <q-icon name="star" color="teal" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-6 col-lg-4">
                <q-select
                  v-model="hospital.tipo"
                  label="Tipo"
                  :readonly="!editMode"
                  filled
                  :bg-color="editMode ? 'white' : 'grey-2'"
                  :options="['Público', 'Privado']"
                  class="hospital-input"
                  :rules="[(val) => !!val || 'El tipo es requerido']"
                >
                  <template v-slot:prepend>
                    <q-icon name="account_balance" color="teal" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-6 col-lg-4">
                <q-input
                  v-model="hospital.telefono"
                  label="Teléfono"
                  type="tel"
                  :readonly="!editMode"
                  filled
                  :bg-color="editMode ? 'white' : 'grey-2'"
                  class="hospital-input"
                  mask="########"
                  hint="Debe tener 8 dígitos"
                  :rules="[
                    (val) => !!val || 'El teléfono es requerido',
                    (val) => val.length === 8 || 'Debe tener 8 dígitos',
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="phone" color="teal" />
                  </template>
                </q-input>
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="center" class="q-pa-lg">
            <q-btn
              v-if="!editMode"
              label="Editar"
              class="full-width-desktop bg-gradient-primary text-white"
              icon="edit"
              @click="toggleEditMode"
            />
            <div v-else class="row justify-center q-gutter-x-md full-width-desktop">
              <q-btn
                label="Cancelar"
                class="text-white"
                color="red"
                icon="close"
                unelevated
                @click="toggleEditMode"
              />
              <q-btn label="Guardar" class="text-white" icon="save" unelevated type="submit" />
            </div>
          </q-card-actions>
        </q-form>
      </q-card>

      <q-card class="hospital-tabs-card" flat bordered>
        <q-tabs
          v-model="activeTab"
          dense
          active-color="teal"
          indicator-color="teal"
          align="justify"
          narrow-indicator
        >
          <q-tab name="especialidades" icon="medical_services" label="Especialidades" />
          <q-tab name="salas" icon="meeting_room" label="Salas" />
          <q-tab name="camas" icon="bed" label="Camas" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <q-tab-panel name="especialidades" class="q-pa-none">
            <EspecialidadesComponent v-if="hospital.id" :hospital-id="hospital.id" />
          </q-tab-panel>

          <q-tab-panel name="salas" class="q-pa-none">
            <SalasComponent />
          </q-tab-panel>

          <q-tab-panel name="camas" class="q-pa-none">
            <CamasComponent />
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
import CamasComponent from '../components/CamasComponent.vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const $q = useQuasar()
const hospitalForm = ref(null)

const originalHospitalData = ref({
  nombre: '',
  departamento: '',
  direccion: '',
  nivel: '',
  tipo: '',
  telefono: '',
})

const hospital = ref({ ...originalHospitalData.value })

const editMode = ref(false)
const activeTab = ref('especialidades')

const fetchHospitalDetails = async () => {
  try {
    const response = await api.get('/hospital-details/1')
    hospital.value = response.data
    originalHospitalData.value = { ...response.data }
  } catch (error) {
    console.error('Error al obtener los detalles del hospital', error)
    $q.notify({
      type: 'negative',
      message: 'Error al obtener los detalles del hospital',
      position: 'top',
      icon: 'error',
    })
  }
}

onMounted(fetchHospitalDetails)

const toggleEditMode = () => {
  if (editMode.value) {
    hospital.value = { ...originalHospitalData.value }
  }
  editMode.value = !editMode.value
}

const saveHospital = async () => {
  const isValid = await hospitalForm.value.validate()
  if (!isValid) {
    $q.notify({
      type: 'negative',
      message: 'Por favor, corrige los errores en el formulario.',
      position: 'top',
      icon: 'warning',
    })
    return
  }

  try {
    const response = await api.put(`/hospitals/1`, hospital.value)
    console.log('Hospital actualizado:', response.data)
    originalHospitalData.value = { ...hospital.value }
    $q.notify({
      type: 'positive',
      message: 'Hospital actualizado correctamente',
      position: 'top',
      icon: 'check_circle',
    })
    editMode.value = false
  } catch (error) {
    console.error('Error al guardar los detalles del hospital', error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar los datos',
      position: 'top',
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
  color: #14b8a6;
}

.page-subtitle {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

.hospital-card,
.hospital-tabs-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: white;
}

.hospital-tabs-card {
  margin-top: 30px;
}

.hospital-input {
  transition: all 0.3s ease;
}
.hospital-input:hover {
  transform: translateY(-2px);
}

/* 📌 Estilos para los campos de entrada */
.hospital-input :deep(.q-field__label) {
  color: #666;
}
.hospital-input:focus-within :deep(.q-field__label) {
  color: #14b8a6 !important;
}
.hospital-input:focus-within :deep(.q-field__control) {
  box-shadow: 0 4px 16px rgba(20, 184, 166, 0.3);
}

/* 📌 Estilo del botón con degradado */
.bg-gradient-primary {
  background: linear-gradient(135deg, #14b8a6, #06b6d4) !important;
}

.full-width-desktop {
  width: 100%;
}
@media (min-width: 600px) {
  .full-width-desktop {
    width: auto;
  }
}
@media (min-width: 1024px) {
  .full-width-desktop {
    width: 300px;
  }
}
</style>
