<template>
  <div class="pacientes-container">
    <div class="header-section">
      <h2 class="titulo-principal">Gestión de Pacientes</h2>
      <p class="subtitulo">Administra el registro de pacientes del hospital</p>
    </div>

    <div class="table-container-card">
      <div class="table-header-row">
        <q-input
          dense
          debounce="300"
          v-model="filter"
          placeholder="Buscar por nombre, apellidos o CI..."
          outlined
          class="table-search"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-btn
          class="btn-agregar"
          label="Registrar Paciente"
          icon="person_add"
          @click="openAddPacienteDialog"
          no-caps
          rounded
        />
      </div>

      <q-table
        :rows="pacientes"
        :columns="pacienteColumns"
        row-key="id"
        flat
        class="styled-table"
        :loading="loadingTable"
        :filter="filter"
        virtual-scroll
      >
        <template v-slot:body-cell-genero="props">
          <q-td :props="props" class="text-center">
            <q-badge
              :label="props.value ? props.value.charAt(0).toUpperCase() + props.value.slice(1) : ''"
              :color="props.value === 'masculino' ? 'blue-6' : 'pink-6'"
              class="genero-badge"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <div class="action-buttons">
              <q-btn
                v-if="props.row.internacion_activa_id"
                dense
                flat
                round
                icon="visibility"
                class="action-btn action-btn-view"
                @click="irAPanel(props.row.internacion_activa_id)"
              >
                <q-tooltip>Ver Panel de Internación</q-tooltip>
              </q-btn>

              <q-btn
                dense
                flat
                round
                icon="edit"
                class="action-btn action-btn-edit"
                @click="openEditPacienteDialog(props.row)"
              >
                <q-tooltip>Editar Paciente</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- DIÁLOGO DE REGISTRO/EDICIÓN -->
    <q-dialog v-model="pacienteDialog" persistent @hide="resetForm">
      <q-card class="dialog-card scrollable-dialog">
        <q-form ref="pacienteFormRef" @submit.prevent="savePaciente">
          <q-card-section class="dialog-header">
            <div class="dialog-title">
              {{ pacienteForm.id ? 'Editar Paciente' : 'Registrar Nuevo Paciente' }}
            </div>
            <div v-if="pacienteForm.id" class="dialog-subtitle">CI: {{ pacienteForm.ci }}</div>
          </q-card-section>

          <q-card-section class="dialog-content">
            <!-- DATOS DEL PACIENTE -->
            <div class="section-title">
              <q-icon name="person" size="20px" class="q-mr-xs" />
              Datos del Paciente
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="pacienteForm.ci"
                  label="CI *"
                  outlined
                  dense
                  class="input-field"
                  :rules="[
                    (v) => !!v || 'El CI es requerido',
                    (v) =>
                      /^\d{7,10}(-[A-Z])?$/.test(v) || 'CI inválido (7-10 dígitos, ej: 1234567-A)',
                  ]"
                  reactive-rules
                  @update:model-value="validarCI"
                  :error="errorCI !== ''"
                  :error-message="errorCI"
                >
                  <template v-slot:prepend>
                    <q-icon name="fingerprint" color="teal" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="pacienteForm.genero"
                  :options="formOptions.genero"
                  label="Género *"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[(v) => !!v || 'El género es requerido']"
                  emit-value
                  map-options
                >
                  <template v-slot:prepend>
                    <q-icon name="wc" color="teal" />
                  </template>
                </q-select>
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="pacienteForm.nombre"
                  label="Nombre *"
                  outlined
                  dense
                  class="input-field"
                  :rules="[
                    (v) => !!v || 'El nombre es requerido',
                    (v) => /^[\p{L}\s]+$/u.test(v) || 'Solo se permiten letras y espacios',
                  ]"
                  reactive-rules
                  @update:model-value="validarNombre"
                  :error="errorNombre !== ''"
                  :error-message="errorNombre"
                >
                  <template v-slot:prepend>
                    <q-icon name="badge" color="teal" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="pacienteForm.apellidos"
                  label="Apellidos *"
                  outlined
                  dense
                  class="input-field"
                  :rules="[
                    (v) => !!v || 'Los apellidos son requeridos',
                    (v) => /^[\p{L}\s]+$/u.test(v) || 'Solo se permiten letras y espacios',
                  ]"
                  reactive-rules
                  @update:model-value="validarApellidos"
                  :error="errorApellidos !== ''"
                  :error-message="errorApellidos"
                >
                  <template v-slot:prepend>
                    <q-icon name="badge" color="teal" />
                  </template>
                </q-input>
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="pacienteForm.telefono"
                  label="Teléfono/Celular *"
                  outlined
                  dense
                  class="input-field"
                  mask="########"
                  :rules="[
                    (v) => !!v || 'El teléfono es requerido',
                    (v) => /^[67]\d{7}$/.test(v) || 'Teléfono de Bolivia (empieza con 6 o 7)',
                  ]"
                  reactive-rules
                  @update:model-value="validarTelefono"
                  :error="errorTelefono !== ''"
                  :error-message="errorTelefono"
                >
                  <template v-slot:prepend>
                    <q-icon name="phone" color="teal" />
                  </template>
                  <template v-slot:hint> Ej: 67544099 o 72345678 </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="pacienteForm.fecha_nacimiento"
                  label="Fecha de Nacimiento *"
                  type="date"
                  stack-label
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[(v) => !!v || 'La fecha es requerida']"
                >
                  <template v-slot:prepend>
                    <q-icon name="cake" color="teal" />
                  </template>
                </q-input>
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-model="pacienteForm.direccion"
                  label="Dirección *"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  type="textarea"
                  rows="2"
                  :rules="[(v) => !!v || 'La dirección es requerida']"
                >
                  <template v-slot:prepend>
                    <q-icon name="home" color="teal" />
                  </template>
                </q-input>
              </div>
            </div>

            <!-- CONTACTO DE REFERENCIA -->
            <q-separator class="q-my-lg" />
            <div class="section-title">
              <q-icon name="contact_phone" size="20px" class="q-mr-xs" />
              Contacto de Referencia (Opcional)
            </div>

            <div class="info-banner">
              <q-icon name="info" size="20px" />
              <span
                >Se enviarán las credenciales al WhatsApp de referencia (+591 67544099 para
                consultas)</span
              >
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-4">
                <q-input
                  v-model="pacienteForm.nombre_referencia"
                  label="Nombre"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[
                    (v) => !v || /^[\p{L}\s]+$/u.test(v) || 'Solo se permiten letras y espacios',
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="person_outline" color="orange" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model="pacienteForm.apellidos_referencia"
                  label="Apellidos"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[
                    (v) => !v || /^[\p{L}\s]+$/u.test(v) || 'Solo se permiten letras y espacios',
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="person_outline" color="orange" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model="pacienteForm.celular_referencia"
                  label="Celular (WhatsApp)"
                  outlined
                  dense
                  class="input-field"
                  mask="########"
                  :rules="[
                    (v) => !v || /^[67]\d{7}$/.test(v) || 'Celular de Bolivia (empieza con 6 o 7)',
                  ]"
                  reactive-rules
                  @update:model-value="validarCelularReferencia"
                  :error="errorCelularRef !== ''"
                  :error-message="errorCelularRef"
                >
                  <template v-slot:prepend>
                    <q-icon name="phone_iphone" color="orange" />
                  </template>
                  <template v-slot:hint> Ej: 67544099 o 72345678 </template>
                </q-input>
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancelar" v-close-popup class="btn-cancelar" />
            <q-btn
              :loading="isSaving"
              :label="pacienteForm.id ? 'Guardar Cambios' : 'Registrar Paciente'"
              type="submit"
              class="btn-guardar"
              icon-right="save"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- DIÁLOGO DE CREDENCIALES ELIMINADO -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()

const pacientes = ref([])
const filter = ref('')
const loadingTable = ref(false)
const pacienteDialog = ref(false)
const isSaving = ref(false)
const pacienteFormRef = ref(null)





// Estados de validación en tiempo real
const errorCI = ref('')
const errorNombre = ref('')
const errorApellidos = ref('')
const errorTelefono = ref('')
const errorCelularRef = ref('')

// Funciones de validación en tiempo real
const validarCI = (value) => {
  if (!value) {
    errorCI.value = 'El CI es requerido'
  } else if (!/^\d{7,10}(-[A-Z])?$/.test(value)) {
    errorCI.value = 'CI inválido. Formato: 1234567 o 1234567-A'
  } else {
    errorCI.value = ''
  }
}

const validarNombre = (value) => {
  if (!value) {
    errorNombre.value = 'El nombre es requerido'
  } else if (!/^[\p{L}\s]+$/u.test(value)) {
    errorNombre.value = 'Solo se permiten letras y espacios'
  } else if (value.length < 2) {
    errorNombre.value = 'El nombre debe tener al menos 2 caracteres'
  } else {
    errorNombre.value = ''
  }
}

const validarApellidos = (value) => {
  if (!value) {
    errorApellidos.value = 'Los apellidos son requeridos'
  } else if (!/^[\p{L}\s]+$/u.test(value)) {
    errorApellidos.value = 'Solo se permiten letras y espacios'
  } else if (value.length < 2) {
    errorApellidos.value = 'Los apellidos deben tener al menos 2 caracteres'
  } else {
    errorApellidos.value = ''
  }
}

const validarTelefono = (value) => {
  if (!value) {
    errorTelefono.value = 'El teléfono es requerido'
  } else if (value.length < 8) {
    errorTelefono.value = `Faltan ${8 - value.length} dígitos`
  } else if (!/^[67]/.test(value)) {
    errorTelefono.value = 'Debe empezar con 6 o 7'
  } else if (!/^[67]\d{7}$/.test(value)) {
    errorTelefono.value = 'Teléfono inválido'
  } else {
    errorTelefono.value = ''
  }
}

const validarCelularReferencia = (value) => {
  if (!value) {
    errorCelularRef.value = ''
    return
  }

  if (value.length < 8) {
    errorCelularRef.value = `Faltan ${8 - value.length} dígitos`
  } else if (!/^[67]/.test(value)) {
    errorCelularRef.value = 'Debe empezar con 6 o 7'
  } else if (!/^[67]\d{7}$/.test(value)) {
    errorCelularRef.value = 'Celular inválido'
  } else {
    errorCelularRef.value = ''
  }
}

const formOptions = ref({
  genero: [
    { label: 'Masculino', value: 'masculino' },
    { label: 'Femenino', value: 'femenino' },
  ],
})

const initialFormState = {
  id: null,
  ci: '',
  nombre: '',
  apellidos: '',
  genero: null,
  telefono: '',
  fecha_nacimiento: '',
  direccion: '',
  nombre_referencia: '',
  apellidos_referencia: '',
  celular_referencia: '',
  estado: true,
}
const pacienteForm = ref({ ...initialFormState })

const pacienteColumns = [
  { name: 'ci', label: 'CI', field: 'ci', sortable: true, align: 'left' },
  { name: 'nombre', label: 'Nombre', field: 'nombre', sortable: true, align: 'left' },
  { name: 'apellidos', label: 'Apellidos', field: 'apellidos', sortable: true, align: 'left' },
  {
    name: 'genero',
    label: 'Género',
    field: 'genero',
    align: 'center',
    format: (val) => (val ? val.charAt(0).toUpperCase() + val.slice(1) : ''),
  },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'center' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' },
]

const fetchPacientes = async () => {
  loadingTable.value = true
  try {
    const response = await api.get('/pacientes')
    pacientes.value = response.data
  } catch (error) {
    console.error('Error al cargar pacientes:', error)
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los pacientes.' })
  } finally {
    loadingTable.value = false
  }
}

const irAPanel = (internacionId) => {
  router.push({
    name: 'PanelInternacion',
    params: { id: internacionId },
  })
}

const resetForm = () => {
  pacienteForm.value = { ...initialFormState }
  pacienteFormRef.value?.resetValidation()
  // Resetear errores de validación
  errorCI.value = ''
  errorNombre.value = ''
  errorApellidos.value = ''
  errorTelefono.value = ''
  errorCelularRef.value = ''
}

const openAddPacienteDialog = () => {
  resetForm()
  pacienteDialog.value = true
}

const openEditPacienteDialog = (paciente) => {
  resetForm()
  pacienteForm.value = { ...paciente }
  pacienteDialog.value = true
}

const savePaciente = async () => {
  const isValid = await pacienteFormRef.value.validate()
  if (!isValid) return

  isSaving.value = true
  const payload = { ...pacienteForm.value }

  try {
    if (payload.id) {
      // Actualización
      await api.put(`/pacientes/${payload.id}`, payload)
      $q.notify({
        type: 'positive',
        message: 'Paciente actualizado con éxito.',
        icon: 'check_circle',
      })
      pacienteDialog.value = false
    } else {
      // Nuevo paciente
      payload.estado = true
      delete payload.id
      await api.post('/pacientes', payload)

      $q.notify({
        type: 'positive',
        message: 'Paciente registrado con éxito.',
        icon: 'check_circle',
      })

      pacienteDialog.value = false
    }

    await fetchPacientes()
  } catch (error) {
    console.error('Error al guardar paciente:', error)
    const errorMessage = error.response?.data?.message || 'Ocurrió un error al guardar.'
    if (error.response?.data?.errors) {
      const validationErrors = Object.values(error.response.data.errors).flat().join('<br>')
      $q.notify({
        type: 'negative',
        message: 'Error de validación:<br>' + validationErrors,
        html: true,
      })
    } else {
      $q.notify({
        type: 'negative',
        message: errorMessage,
      })
    }
  } finally {
    isSaving.value = false
  }
}



onMounted(fetchPacientes)
</script>

<style scoped>
.pacientes-container {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

.header-section {
  margin-bottom: 32px;
}

.titulo-principal {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.subtitulo {
  font-size: clamp(0.9rem, 1.5vw, 1.1rem);
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

.table-container-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 24px;
  border: 1px solid #e2e8f0;
}

.table-header-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.table-search {
  flex-grow: 1;
  max-width: 450px;
}

.btn-agregar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  font-weight: 700;
  padding: 10px 18px;
  box-shadow: 0 4px 8px rgba(13, 148, 136, 0.3);
  transition: all 0.3s ease;
}

.btn-agregar:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(13, 148, 136, 0.4);
}

.styled-table {
  border-radius: 12px;
}

.styled-table :deep(th) {
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
}

.genero-badge {
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  text-transform: uppercase;
  font-size: 0.7rem;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  transition: all 0.2s ease;
}

.action-btn-view {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.action-btn-edit {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
}

.action-btn:hover {
  transform: scale(1.1);
}

.dialog-card {
  width: 90vw;
  max-width: 900px;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
}

.scrollable-dialog {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.scrollable-dialog .dialog-content {
  flex-grow: 1;
  overflow-y: auto;
}

.dialog-header {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  padding: 24px;
}

.dialog-title {
  font-size: 1.4rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  margin: 0;
}

.dialog-subtitle {
  font-size: 0.95rem;
  opacity: 0.9;
  margin-top: 4px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0d9488;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #ccfbf1;
  display: flex;
  align-items: center;
}

.info-banner {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  color: #92400e;
  font-weight: 500;
  font-size: 0.9rem;
}

.dialog-content {
  padding: 24px;
}

.input-field {
  transition: all 0.3s ease;
}

.input-field.q-field--error :deep(.q-field__control) {
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.input-field :deep(.q-field__messages) {
  font-weight: 500;
  font-size: 0.85rem;
}

.input-field :deep(.q-field__hint) {
  color: #64748b;
  font-size: 0.8rem;
  font-style: italic;
}

.dialog-actions {
  padding: 16px 24px;
  background-color: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.btn-cancelar {
  color: #ef4444;
  font-weight: 600;
}

.btn-guardar {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  font-weight: 700;
  padding: 8px 24px;
  box-shadow: 0 4px 8px rgba(20, 184, 166, 0.3);
}

/* ESTILOS PARA EL DIÁLOGO DE CREDENCIALES */
.credenciales-card {
  width: 600px;
  max-width: 90vw;
  border-radius: 16px;
  border: 2px solid #10b981;
}

.credenciales-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  text-align: center;
  padding: 32px 24px;
}

.credenciales-content {
  padding: 32px 24px;
}

.success-icon-container {
  text-align: center;
  margin-bottom: 24px;
}

.paciente-info {
  background: #f0fdf4;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 1rem;
  font-weight: 500;
  color: #065f46;
}

.credenciales-section {
  margin: 24px 0;
}

.section-subtitle {
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 16px;
  text-align: center;
}

.credenciales-info {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
}

.credencial-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin: 12px 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
}

.credencial-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #475569;
  min-width: 100px;
  font-size: 0.9rem;
}

.credencial-value {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  color: #0d9488;
  font-weight: 700;
  background: #f0fdfa;
  padding: 8px 12px;
  border-radius: 6px;
}

.copy-btn {
  color: #0d9488;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: #ccfbf1;
  transform: scale(1.1);
}

.warning-banner {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  margin-top: 20px;
  color: #92400e;
}

.warning-banner strong {
  font-weight: 700;
}

.whatsapp-section {
  margin-top: 24px;
}

.whatsapp-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 1rem;
  font-weight: 600;
  color: #065f46;
}

.whatsapp-btn {
  width: 100%;
  padding: 12px;
  font-size: 1rem;
  font-weight: 700;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  box-shadow: 0 4px 8px rgba(22, 163, 74, 0.3);
  transition: all 0.3s ease;
}

.whatsapp-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(22, 163, 74, 0.4);
}

.whatsapp-recipient {
  text-align: center;
  margin-top: 12px;
  font-size: 0.9rem;
  color: #64748b;
  font-style: italic;
}

.btn-entendido {
  padding: 12px 48px;
  font-size: 1rem;
  font-weight: 700;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  box-shadow: 0 4px 8px rgba(20, 184, 166, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .pacientes-container {
    padding: 16px;
  }

  .titulo-principal {
    font-size: 1.5rem;
  }

  .table-header-row {
    flex-direction: column;
    align-items: stretch;
  }

  .table-search {
    max-width: 100%;
  }

  .btn-agregar {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }

  .credencial-item {
    flex-wrap: wrap;
  }

  .credencial-label {
    min-width: 100%;
  }
}
</style>
