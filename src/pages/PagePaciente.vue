<template>
  <div class="pacientes-container">
    <div class="header-section">
      <h2 class="titulo-principal">Gestión de Pacientes</h2>
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
      >
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <q-btn
              v-if="props.row.internacion_activa_id"
              dense
              flat
              round
              icon="visibility"
              class="action-btn-view"
              @click="irAPanel(props.row.internacion_activa_id)"
              title="Ver Panel de Internación"
            />

            <q-btn
              dense
              flat
              round
              icon="edit"
              class="action-btn-edit"
              @click="openEditPacienteDialog(props.row)"
              title="Editar Paciente"
            />
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- ✅ DIÁLOGO CON CAMPOS DE REFERENCIA -->
    <q-dialog v-model="pacienteDialog" persistent @hide="resetForm">
      <q-card class="dialog-card scrollable-dialog">
        <q-form ref="pacienteFormRef" @submit.prevent="savePaciente">
          <q-card-section class="dialog-header">
            <div class="dialog-title">
              {{ pacienteForm.id ? 'Editar Paciente' : 'Registrar Nuevo Paciente' }}
            </div>
          </q-card-section>

          <q-card-section class="dialog-content">
            <!-- DATOS DEL PACIENTE -->
            <div class="section-title">Datos del Paciente</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="pacienteForm.ci"
                  label="CI *"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[
                    (v) => !!v || 'El CI es requerido',
                    (v) =>
                      /^\d{7,10}(-\p{Lu})?$/.test(v) || 'CI inválido (7-10 dígitos, ej: 1234567-A)',
                  ]"
                />
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
                />
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
                  lazy-rules
                  :rules="[
                    (v) => !!v || 'El nombre es requerido',
                    (v) => /^[\p{L}\s]+$/u.test(v) || 'Solo se permiten letras y espacios',
                  ]"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="pacienteForm.apellidos"
                  label="Apellidos *"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[
                    (v) => !!v || 'Los apellidos son requeridos',
                    (v) => /^[\p{L}\s]+$/u.test(v) || 'Solo se permiten letras y espacios',
                  ]"
                />
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
                  lazy-rules
                  mask="########"
                  :rules="[
                    (v) => !!v || 'El teléfono es requerido',
                    (v) => /^[67]\d{7}$/.test(v) || 'Teléfono de Bolivia (empieza con 6 o 7)',
                  ]"
                />
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
                />
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
                  :rules="[(v) => !!v || 'La dirección es requerida']"
                />
              </div>
            </div>

            <!-- ✅ NUEVA SECCIÓN: CONTACTO DE REFERENCIA -->
            <q-separator class="q-my-md" />
            <div class="section-title">Contacto de Referencia (Opcional)</div>

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
                />
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
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model="pacienteForm.celular_referencia"
                  label="Celular"
                  outlined
                  dense
                  class="input-field"
                  mask="########"
                  lazy-rules
                  :rules="[
                    (v) => !v || /^[67]\d{7}$/.test(v) || 'Celular de Bolivia (empieza con 6 o 7)',
                  ]"
                />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancelar" v-close-popup class="btn-cancelar" />
            <q-btn
              :loading="isSaving"
              :label="pacienteForm.id ? 'Guardar Cambios' : 'Registrar'"
              type="submit"
              class="btn-guardar"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- ✅ DIÁLOGO DE CREDENCIALES (muestra usuario/contraseña generados) -->
    <q-dialog v-model="credencialesDialog" persistent>
      <q-card class="credenciales-card">
        <q-card-section class="dialog-header">
          <div class="dialog-title">✅ Paciente Registrado</div>
        </q-card-section>

        <q-card-section class="text-center q-pa-lg">
          <q-icon name="check_circle" size="64px" color="positive" class="q-mb-md" />
          <div class="text-h6 q-mb-md">Usuario creado exitosamente</div>
          <div class="credenciales-info">
            <div class="credencial-item">
              <strong>Usuario:</strong> {{ credencialesGeneradas.email }}
            </div>
            <div class="credencial-item">
              <strong>Contraseña:</strong> {{ credencialesGeneradas.password }}
            </div>
          </div>
          <q-banner class="bg-warning text-white q-mt-md" rounded>
            <template v-slot:avatar>
              <q-icon name="info" />
            </template>
            Guarda estas credenciales. Se recomienda que el paciente cambie su contraseña.
          </q-banner>
        </q-card-section>

        <q-card-actions align="center">
          <q-btn label="Entendido" color="primary" @click="cerrarCredenciales" class="q-px-xl" />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
const credencialesDialog = ref(false)
const isSaving = ref(false)
const pacienteFormRef = ref(null)

const credencialesGeneradas = ref({
  email: '',
  password: '',
})

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
      $q.notify({ type: 'positive', message: 'Paciente actualizado con éxito.' })
      pacienteDialog.value = false
    } else {
      // ✅ Nuevo paciente: recibir credenciales
      payload.estado = true
      delete payload.id
      const response = await api.post('/pacientes', payload)

      // Mostrar credenciales generadas
      credencialesGeneradas.value = response.data.credenciales
      pacienteDialog.value = false
      credencialesDialog.value = true
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

const cerrarCredenciales = () => {
  credencialesDialog.value = false
  credencialesGeneradas.value = { email: '', password: '' }
}

onMounted(fetchPacientes)
</script>

<style scoped>
.pacientes-container {
  padding: 24px;
  background: #f8fafc;
}

.header-section {
  margin-bottom: 32px;
}

.titulo-principal {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.table-container-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 24px;
}

.table-header-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.table-search {
  flex-grow: 1;
  max-width: 450px;
}

.btn-agregar {
  background: #14b8a6;
  color: white;
  font-weight: 600;
}

.styled-table :deep(th) {
  font-weight: 600;
  color: #475569;
}

.action-btn-view {
  color: #3b82f6;
}

.action-btn-edit {
  color: #14b8a6;
}

.dialog-card {
  width: 90vw;
  max-width: 900px;
  border-radius: 16px;
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
  background: #14b8a6;
  color: white;
  padding: 20px 24px;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 700;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.dialog-content {
  padding: 24px;
}

.dialog-actions {
  padding: 16px 24px;
  background-color: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.btn-cancelar {
  color: #64748b;
  font-weight: 600;
}

.btn-guardar {
  background: #14b8a6;
  color: white;
  font-weight: 600;
  padding: 8px 24px;
}

/* Estilos para el diálogo de credenciales */
.credenciales-card {
  width: 500px;
  max-width: 90vw;
  border-radius: 16px;
}

.credenciales-info {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
}

.credencial-item {
  padding: 12px;
  margin: 8px 0;
  background: white;
  border-radius: 6px;
  font-size: 1rem;
}

.credencial-item strong {
  color: #475569;
  margin-right: 8px;
}
</style>
