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

    <q-dialog v-model="pacienteDialog" persistent @hide="resetForm">
      <q-card class="dialog-card scrollable-dialog">
        <q-form ref="pacienteFormRef" @submit.prevent="savePaciente">
          <q-card-section class="dialog-header">
            <div class="dialog-title">
              {{ pacienteForm.id ? 'Editar Paciente' : 'Registrar Nuevo Paciente' }}
            </div>
          </q-card-section>

          <q-card-section class="dialog-content">
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
                  label="Teléfono/Celular"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  mask="########"
                  :rules="[
                    (v) => !v || /^[67]\d{7}$/.test(v) || 'Teléfono de Bolivia (empieza con 6 o 7)',
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router' // ✅ Importar el router

const $q = useQuasar()
const router = useRouter() // ✅ Instanciar el router

// --- Estado del Componente ---
const pacientes = ref([])
const filter = ref('')
const loadingTable = ref(false)
const pacienteDialog = ref(false)
const isSaving = ref(false)
const pacienteFormRef = ref(null)

// ✅ CORREGIDO: Opciones del formulario movidas a un 'ref' para evitar falsos positivos de ESLint.
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

// --- Lógica de API ---
const fetchPacientes = async () => {
  loadingTable.value = true
  try {
    const response = await api.get('/pacientes') // Asegúrate que la ruta inicie con /api/
    pacientes.value = response.data
  } catch (error) {
    console.error('Error al cargar pacientes:', error)
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los pacientes.' })
  } finally {
    loadingTable.value = false
  }
}

// ✅ AÑADIDO: La función que nos llevará al panel del paciente
const irAPanel = (internacionId) => {
  router.push({
    name: 'PanelInternacion',
    params: { id: internacionId },
  })
}

// --- Lógica de Formularios y Diálogos ---
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
      await api.put(`/pacientes/${payload.id}`, payload)
      $q.notify({ type: 'positive', message: 'Paciente actualizado con éxito.' })
    } else {
      payload.estado = true
      delete payload.id
      await api.post('/pacientes', payload)
      $q.notify({ type: 'positive', message: 'Paciente registrado con éxito.' })
    }
    pacienteDialog.value = false
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
/* Estos estilos son una base sólida que puedes reutilizar */
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

.action-btn-edit {
  color: #14b8a6;
}

/* Estilos para diálogos (modales) */
.dialog-card {
  width: 90vw;
  max-width: 800px; /* Ancho ajustado para más campos */
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
.action-btn-view {
  color: #3b82f6; /* Un color azul para diferenciarlo del de editar */
}
.action-btn-edit {
  color: #14b8a6;
}
</style>
