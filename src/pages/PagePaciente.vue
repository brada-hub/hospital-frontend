<template>
  <q-page padding>
    <div class="header-section">
      <h4 class="text-h4 text-weight-bold q-my-none">Gestión de Pacientes</h4>
      <q-btn
        color="primary"
        icon="person_add"
        label="Añadir Paciente"
        @click="abrirDialogoCrear"
        no-caps
      />
    </div>

    <q-card flat bordered class="q-mt-md">
      <q-card-section>
        <q-table
          :rows="pacientes"
          :columns="columnas"
          row-key="id"
          :filter="filtro"
          :loading="isLoading"
          flat
          binary-state-sort
        >
          <template v-slot:top-right>
            <q-input
              borderless
              dense
              debounce="300"
              v-model="filtro"
              placeholder="Buscar paciente..."
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>

          <template v-slot:body-cell-nombre_completo="props">
            <q-td :props="props">
              <div class="text-weight-bold">{{ props.row.nombre }} {{ props.row.apellidos }}</div>
              <div class="text-grey-8">CI: {{ props.row.ci }}</div>
            </q-td>
          </template>

          <template v-slot:body-cell-estado="props">
            <q-td :props="props">
              <q-chip
                :color="props.row.estado ? 'green' : 'red'"
                text-color="white"
                dense
                class="text-weight-bold"
                :label="props.row.estado ? 'Activo' : 'Inactivo'"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-acciones="props">
            <q-td :props="props" class="q-gutter-sm">
              <q-btn dense color="secondary" icon="edit" @click="abrirDialogoEditar(props.row)" />
              <q-btn
                dense
                :color="props.row.estado ? 'negative' : 'positive'"
                :icon="props.row.estado ? 'toggle_off' : 'toggle_on'"
                @click="cambiarEstado(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="mostrarDialog" persistent>
      <q-card style="width: 700px; max-width: 80vw">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">
            {{ formulario.id ? 'Editar Paciente' : 'Añadir Nuevo Paciente' }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="guardarPaciente" class="q-gutter-md">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-4">
                <q-input
                  v-model="formulario.ci"
                  label="CI *"
                  outlined
                  dense
                  :rules="[(val) => !!val || 'Campo requerido']"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model="formulario.nombre"
                  label="Nombre *"
                  outlined
                  dense
                  :rules="[(val) => !!val || 'Campo requerido']"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model="formulario.apellidos"
                  label="Apellidos *"
                  outlined
                  dense
                  :rules="[(val) => !!val || 'Campo requerido']"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model="formulario.fecha_nacimiento"
                  type="date"
                  stack-label
                  label="Fecha de Nacimiento *"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-select
                  v-model="formulario.genero"
                  :options="['masculino', 'femenino', 'otro']"
                  label="Género *"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model="formulario.telefono"
                  label="Teléfono *"
                  type="number"
                  outlined
                  dense
                />
              </div>
              <div class="col-12">
                <q-input v-model="formulario.direccion" label="Dirección *" outlined dense />
              </div>
              <div class="col-12">
                <q-toggle
                  v-model="formulario.estado"
                  label="Estado del paciente (Activo/Inactivo)"
                />
              </div>
            </div>

            <q-card-actions align="right">
              <q-btn flat label="Cancelar" color="negative" v-close-popup />
              <q-btn label="Guardar" type="submit" color="primary" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const $q = useQuasar()

// --- Estado de la Tabla ---
const pacientes = ref([])
const isLoading = ref(false)
const filtro = ref('')
const columnas = [
  {
    name: 'nombre_completo',
    label: 'Nombre Completo',
    align: 'left',
    field: (row) => `${row.nombre} ${row.apellidos}`,
    sortable: true,
  },
  {
    name: 'fecha_nacimiento',
    label: 'Fecha de Nacimiento',
    align: 'center',
    field: 'fecha_nacimiento',
    sortable: true,
  },
  { name: 'genero', label: 'Género', align: 'left', field: 'genero', sortable: true },
  { name: 'telefono', label: 'Teléfono', align: 'left', field: 'telefono' },
  { name: 'estado', label: 'Estado', align: 'center', field: 'estado', sortable: true },
  { name: 'acciones', label: 'Acciones', align: 'right' },
]

// --- Estado del Formulario y Diálogo ---
const mostrarDialog = ref(false)
const formulario = reactive({
  id: null,
  ci: '',
  nombre: '',
  apellidos: '',
  fecha_nacimiento: '',
  genero: 'masculino',
  telefono: '',
  direccion: '',
  estado: true,
})

// --- Funciones API ---

const cargarPacientes = async () => {
  isLoading.value = true
  try {
    const { data } = await api.get('/pacientes')
    pacientes.value = data
  } catch (error) {
    console.error('Error al cargar pacientes:', error)
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los pacientes.' })
  } finally {
    isLoading.value = false
  }
}

const guardarPaciente = async () => {
  try {
    let payload = { ...formulario }
    if (formulario.id) {
      // Editar
      await api.put(`/pacientes/${formulario.id}`, payload)
      $q.notify({ type: 'positive', message: 'Paciente actualizado con éxito.' })
    } else {
      // Crear
      await api.post('/pacientes', payload)
      $q.notify({ type: 'positive', message: 'Paciente creado con éxito.' })
    }
    mostrarDialog.value = false
    await cargarPacientes()
  } catch (error) {
    console.error('Error al guardar paciente:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al guardar el paciente.',
    })
  }
}

const cambiarEstado = async (paciente) => {
  $q.dialog({
    title: 'Confirmar',
    message: `¿Estás seguro de que quieres ${paciente.estado ? 'desactivar' : 'activar'} a este paciente?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/pacientes/${paciente.id}`)
      $q.notify({ type: 'info', message: 'Estado del paciente actualizado.' })
      await cargarPacientes()
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      $q.notify({ type: 'negative', message: 'Error al cambiar el estado.' })
    }
  })
}

// --- Funciones del Diálogo ---

const resetFormulario = () => {
  Object.assign(formulario, {
    id: null,
    ci: '',
    nombre: '',
    apellidos: '',
    fecha_nacimiento: '',
    genero: 'masculino',
    telefono: '',
    direccion: '',
    estado: true,
  })
}

const abrirDialogoCrear = () => {
  resetFormulario()
  mostrarDialog.value = true
}

const abrirDialogoEditar = (paciente) => {
  resetFormulario()
  Object.assign(formulario, paciente)
  mostrarDialog.value = true
}

// --- Hook de Ciclo de Vida ---
onMounted(() => {
  cargarPacientes()
})
</script>

<style scoped>
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>
