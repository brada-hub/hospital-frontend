<template>
  <q-page class="hospital-page">
    <div class="hospital-container">
      <div class="page-header">
        <div class="row items-center justify-between">
          <div class="col-auto">
            <h4 class="page-title">Información de {{ hospital.nombre || 'Mi Hospital' }}</h4>
            <p class="page-subtitle">Gestiona los datos de tu hospital</p>
          </div>
        </div>
      </div>

      <q-card class="hospital-card elegant-card" flat bordered>
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
                  class="hospital-input elegant-input"
                  :rules="[
                    (val) => !!val || 'El nombre es requerido',
                    (val) => /^[a-zA-Z\s]+$/.test(val) || 'Solo se permiten letras',
                  ]"
                  ><template v-slot:prepend
                    ><q-icon name="local_hospital" class="input-icon" /></template
                ></q-input>
              </div>
              <div class="col-12 col-md-6 col-lg-4">
                <q-select
                  v-model="hospital.departamento"
                  label="Departamento"
                  :readonly="!editMode"
                  filled
                  :bg-color="editMode ? 'white' : 'grey-2'"
                  :options="['La Paz', 'Cochabamba', 'Santa Cruz']"
                  class="hospital-input elegant-input"
                  :rules="[(val) => !!val || 'El departamento es requerido']"
                  ><template v-slot:prepend><q-icon name="business" class="input-icon" /></template
                ></q-select>
              </div>
              <div class="col-12 col-md-6 col-lg-4">
                <q-input
                  v-model="hospital.direccion"
                  label="Dirección"
                  :readonly="!editMode"
                  filled
                  :bg-color="editMode ? 'white' : 'grey-2'"
                  class="hospital-input elegant-input"
                  :rules="[
                    (val) => !!val || 'La dirección es requerida',
                    (val) => /^[a-zA-Z0-9\s#.,-]+$/.test(val) || 'Caracteres no válidos',
                  ]"
                  ><template v-slot:prepend
                    ><q-icon name="location_on" class="input-icon" /></template
                ></q-input>
              </div>
              <div class="col-12 col-md-6 col-lg-4">
                <q-select
                  v-model="hospital.nivel"
                  label="Nivel"
                  :readonly="!editMode"
                  filled
                  :bg-color="editMode ? 'white' : 'grey-2'"
                  :options="['Nivel 1', 'Nivel 2', 'Nivel 3']"
                  class="hospital-input elegant-input"
                  :rules="[(val) => !!val || 'El nivel es requerido']"
                  ><template v-slot:prepend><q-icon name="star" class="input-icon" /></template
                ></q-select>
              </div>
              <div class="col-12 col-md-6 col-lg-4">
                <q-select
                  v-model="hospital.tipo"
                  label="Tipo"
                  :readonly="!editMode"
                  filled
                  :bg-color="editMode ? 'white' : 'grey-2'"
                  :options="['Público', 'Privado']"
                  class="hospital-input elegant-input"
                  :rules="[(val) => !!val || 'El tipo es requerido']"
                  ><template v-slot:prepend
                    ><q-icon name="account_balance" class="input-icon" /></template
                ></q-select>
              </div>
              <div class="col-12 col-md-6 col-lg-4">
                <q-input
                  v-model="hospital.telefono"
                  label="Teléfono"
                  type="tel"
                  :readonly="!editMode"
                  filled
                  :bg-color="editMode ? 'white' : 'grey-2'"
                  class="hospital-input elegant-input"
                  mask="########"
                  :rules="[
                    (val) => {
                      if (!val) return 'El teléfono es requerido'
                      const num = parseInt(String(val).trim())
                      if (isNaN(num)) return 'Debe ser un número válido'
                      if (String(num).length !== 8) return 'Debe tener 8 dígitos'
                      if (num < 60000000 || num > 79999999)
                        return 'Debe estar entre 60000000 y 79999999'
                      return true
                    },
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="phone" class="input-icon" />
                  </template>
                </q-input>
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="center" class="q-pa-lg">
            <q-btn
              v-if="!editMode"
              label="Editar"
              class="full-width-desktop elegant-btn-primary"
              icon="edit"
              @click="toggleEditMode"
              unelevated
            />
            <div v-else class="row q-gutter-md">
              <q-btn
                label="Cancelar"
                class="elegant-btn-secondary"
                icon="close"
                unelevated
                @click="toggleEditMode"
              />
              <q-btn
                label="Guardar"
                class="elegant-btn-primary"
                icon="save"
                unelevated
                type="submit"
                :loading="isSaving"
              />
            </div>
          </q-card-actions>
        </q-form>
      </q-card>

      <q-card class="hospital-tabs-card elegant-card" flat bordered>
        <q-tabs
          v-model="activeTab"
          dense
          active-color="teal-6"
          indicator-color="teal-6"
          align="justify"
          narrow-indicator
          class="elegant-tabs"
        >
          <q-tab
            name="especialidades"
            icon="medical_services"
            label="Especialidades"
            class="elegant-tab"
          />
          <q-tab name="salas" icon="meeting_room" label="Salas" class="elegant-tab" />
          <q-tab name="camas" icon="bed" label="Camas" class="elegant-tab" />
        </q-tabs>
        <q-separator class="elegant-separator" />
        <q-tab-panels v-model="activeTab" animated class="elegant-panels">
          <q-tab-panel name="especialidades" class="q-pa-none">
            <EspecialidadesComponent v-if="hospital.id" :hospital-id="hospital.id" />
          </q-tab-panel>
          <q-tab-panel name="salas" class="q-pa-none">
            <SalasComponent v-if="hospital.id" :hospital-id="hospital.id" />
          </q-tab-panel>
          <q-tab-panel name="camas" class="q-pa-none">
            <CamasComponent v-if="hospital.id" :hospital-id="hospital.id" />
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useUserStore } from 'stores/user'
import { api } from 'boot/axios'

// AÑADIDO: Importamos los componentes para las pestañas
import EspecialidadesComponent from 'src/components/EspecialidadesComponent.vue'
import SalasComponent from 'src/components/SalasComponent.vue'
import CamasComponent from 'src/components/CamasComponent.vue'

const $q = useQuasar()
const userStore = useUserStore()

const hospitalForm = ref(null)
const hospital = ref({})
const originalHospitalData = ref({})
const editMode = ref(false)
const isSaving = ref(false)
const activeTab = ref('especialidades')

const fetchHospitalDetails = () => {
  if (userStore.hospital && userStore.hospital.id) {
    hospital.value = { ...userStore.hospital }
    originalHospitalData.value = { ...userStore.hospital }

    $q.notify({
      type: 'positive',
      message: 'Datos del hospital cargados correctamente',
      position: 'top',
      icon: 'check_circle',
    })
  } else {
    $q.notify({
      type: 'negative',
      message: 'No se pudo cargar la información del hospital.',
      position: 'top',
      icon: 'error',
    })
  }
}

onMounted(() => {
  fetchHospitalDetails()
})

const toggleEditMode = () => {
  if (editMode.value) {
    hospital.value = { ...originalHospitalData.value }
  }
  editMode.value = !editMode.value
}

const saveHospital = async () => {
  const isValid = await hospitalForm.value.validate()
  if (!isValid) return

  isSaving.value = true
  try {
    const hospitalId = hospital.value.id
    if (!hospitalId) throw new Error('ID del hospital no encontrado.')

    const response = await api.put(`/hospitals/${hospitalId}`, hospital.value)

    originalHospitalData.value = { ...response.data }
    userStore.hospital = { ...response.data }
    localStorage.setItem('hospital', JSON.stringify(userStore.hospital))

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
      message: 'Error al guardar los datos. Inténtalo de nuevo.',
      position: 'top',
      icon: 'error',
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
/* Tus excelentes estilos van aquí */
.hospital-page {
  min-height: 100vh;
  background: #f8fafc;
}
.hospital-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}
.page-header {
  margin-bottom: 32px;
  padding: 24px 0;
}
.page-title {
  margin: 0 0 8px 0;
  font-size: 2.25rem;
  font-weight: 600;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}
.page-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 1.125rem;
  font-weight: 400;
}
.elegant-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
.hospital-tabs-card {
  margin-top: 32px;
}
.elegant-input {
  transition: all 0.3s ease;
}
.elegant-input:hover {
  transform: translateY(-1px);
}
.elegant-input :deep(.q-field__control) {
  border-radius: 12px;
  transition: all 0.3s ease;
}
.elegant-input:focus-within :deep(.q-field__control) {
  box-shadow: 0 4px 16px rgba(20, 184, 166, 0.15);
  border-color: #14b8a6;
}
.elegant-input :deep(.q-field__label) {
  color: #64748b;
  font-weight: 500;
}
.elegant-input:focus-within :deep(.q-field__label) {
  color: #14b8a6 !important;
}
.input-icon {
  color: #14b8a6;
  transition: all 0.2s ease;
}
.elegant-input:hover .input-icon {
  transform: scale(1.1);
}
.elegant-btn-primary {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%) !important;
  color: white !important;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}
.elegant-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(20, 184, 166, 0.4);
}
.elegant-btn-secondary {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  color: white !important;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
.elegant-btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}
.elegant-tabs {
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%);
}
.elegant-tab {
  font-weight: 500;
  transition: all 0.2s ease;
}
.elegant-tab:hover {
  background: rgba(20, 184, 166, 0.1);
}
.elegant-separator {
  background: linear-gradient(90deg, transparent 0%, #14b8a6 50%, transparent 100%);
  height: 2px;
}
.elegant-panels {
  background: #ffffff;
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
.elegant-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  z-index: 1;
}
.hospital-input :deep(.q-field__control):hover {
  background: rgba(20, 184, 166, 0.02);
}
.elegant-input :deep(.q-field--error .q-field__control) {
  animation: shake 0.5s ease-in-out;
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}
</style>
