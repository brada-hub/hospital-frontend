<template>
  <q-page padding>
    <div class="header-section">
      <h4 class="text-h4 text-weight-bold q-my-none">Gestión de Farmacia</h4>
      <q-btn
        color="primary"
        icon="add"
        :label="tab === 'medicamentos' ? 'Añadir Medicamento' : 'Añadir Categoría'"
        @click="abrirDialogoCrear"
        no-caps
      />
    </div>

    <q-card flat bordered class="q-mt-md">
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="medicamentos" icon="medication" label="Medicamentos" />
        <q-tab name="categorias" icon="category" label="Categorías" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <!-- Pestaña de Medicamentos -->
        <q-tab-panel name="medicamentos">
          <q-table
            :rows="medicamentos"
            :columns="columnasMedicamentos"
            row-key="id"
            :filter="filtroMedicamentos"
            :loading="isLoading"
            flat
          >
            <template v-slot:top-right>
              <q-input
                borderless
                dense
                debounce="300"
                v-model="filtroMedicamentos"
                placeholder="Buscar medicamento..."
              >
                <template v-slot:append><q-icon name="search" /></template>
              </q-input>
            </template>
            <template v-slot:body-cell-categoria="props">
              <q-td :props="props">
                <q-chip dense :label="props.row.categoria?.nombre || 'Sin categoría'" />
              </q-td>
            </template>
            <template v-slot:body-cell-acciones="props">
              <q-td :props="props" class="q-gutter-sm">
                <q-btn dense color="secondary" icon="edit" @click="abrirDialogoEditar(props.row)" />
                <q-btn dense color="negative" icon="delete" @click="eliminarRegistro(props.row)" />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Pestaña de Categorías -->
        <q-tab-panel name="categorias">
          <q-table
            :rows="categorias"
            :columns="columnasCategorias"
            row-key="id"
            :filter="filtroCategorias"
            :loading="isLoading"
            flat
          >
            <template v-slot:top-right>
              <q-input
                borderless
                dense
                debounce="300"
                v-model="filtroCategorias"
                placeholder="Buscar categoría..."
              >
                <template v-slot:append><q-icon name="search" /></template>
              </q-input>
            </template>
            <template v-slot:body-cell-acciones="props">
              <q-td :props="props" class="q-gutter-sm">
                <q-btn dense color="secondary" icon="edit" @click="abrirDialogoEditar(props.row)" />
                <q-btn dense color="negative" icon="delete" @click="eliminarRegistro(props.row)" />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- Diálogo para Medicamentos -->
    <q-dialog v-model="dialogMedicamento" persistent>
      <q-card style="width: 700px; max-width: 80vw">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">
            {{ formMedicamento.id ? 'Editar Medicamento' : 'Añadir Medicamento' }}
          </div>
        </q-card-section>
        <q-card-section class="q-pt-md">
          <q-form @submit="guardarMedicamento" class="q-gutter-md">
            <q-input
              v-model="formMedicamento.nombre"
              label="Nombre *"
              outlined
              dense
              :rules="[(val) => !!val || 'Campo requerido']"
            />
            <q-select
              v-model="formMedicamento.categoria_id"
              :options="categorias"
              option-value="id"
              option-label="nombre"
              emit-value
              map-options
              label="Categoría"
              outlined
              dense
            />
            <q-input
              v-model="formMedicamento.descripcion"
              label="Descripción"
              type="textarea"
              outlined
              dense
            />
            <q-input
              v-model="formMedicamento.presentacion"
              label="Presentación (ej. Comprimido 500mg)"
              outlined
              dense
            />
            <q-input
              v-model="formMedicamento.via_administracion"
              label="Vía de Administración (ej. Oral)"
              outlined
              dense
            />
            <q-card-actions align="right">
              <q-btn flat label="Cancelar" color="negative" v-close-popup />
              <q-btn label="Guardar" type="submit" color="primary" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Diálogo para Categorías -->
    <q-dialog v-model="dialogCategoria" persistent>
      <q-card style="width: 500px; max-width: 80vw">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">
            {{ formCategoria.id ? 'Editar Categoría' : 'Añadir Categoría' }}
          </div>
        </q-card-section>
        <q-card-section class="q-pt-md">
          <q-form @submit="guardarCategoria" class="q-gutter-md">
            <q-input
              v-model="formCategoria.nombre"
              label="Nombre de la Categoría *"
              outlined
              dense
              :rules="[(val) => !!val || 'Campo requerido']"
            />
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

// --- Estado General ---
const tab = ref('medicamentos')
const isLoading = ref(false)

// --- Estado de Medicamentos ---
const medicamentos = ref([])
const filtroMedicamentos = ref('')
const dialogMedicamento = ref(false)
const formMedicamento = reactive({
  id: null,
  nombre: '',
  descripcion: '',
  presentacion: '',
  via_administracion: '',
  categoria_id: null,
})
const columnasMedicamentos = [
  { name: 'nombre', label: 'Nombre', align: 'left', field: 'nombre', sortable: true },
  { name: 'categoria', label: 'Categoría', align: 'left', field: 'categoria', sortable: true },
  { name: 'presentacion', label: 'Presentación', align: 'left', field: 'presentacion' },
  { name: 'via_administracion', label: 'Vía', align: 'left', field: 'via_administracion' },
  { name: 'acciones', label: 'Acciones', align: 'right' },
]

// --- Estado de Categorías ---
const categorias = ref([])
const filtroCategorias = ref('')
const dialogCategoria = ref(false)
const formCategoria = reactive({ id: null, nombre: '' })
const columnasCategorias = [
  { name: 'nombre', label: 'Nombre', align: 'left', field: 'nombre', sortable: true },
  { name: 'acciones', label: 'Acciones', align: 'right' },
]

// --- Funciones API ---
const fetchData = async () => {
  isLoading.value = true
  try {
    const [resMedicamentos, resCategorias] = await Promise.all([
      api.get('/medicamentos'),
      api.get('/medicamento-categorias'),
    ])
    medicamentos.value = resMedicamentos.data
    categorias.value = resCategorias.data
  } catch (error) {
    console.error('Error al cargar datos:', error)
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los datos.' })
  } finally {
    isLoading.value = false
  }
}

const guardarMedicamento = async () => {
  try {
    if (formMedicamento.id) {
      await api.put(`/medicamentos/${formMedicamento.id}`, formMedicamento)
      $q.notify({ type: 'positive', message: 'Medicamento actualizado.' })
    } else {
      await api.post('/medicamentos', formMedicamento)
      $q.notify({ type: 'positive', message: 'Medicamento creado.' })
    }
    dialogMedicamento.value = false
    await fetchData()
  } catch (error) {
    console.error('Error al guardar medicamento:', error)
    $q.notify({ type: 'negative', message: error.response?.data?.message || 'Error al guardar.' })
  }
}

const guardarCategoria = async () => {
  try {
    if (formCategoria.id) {
      await api.put(`/medicamento-categorias/${formCategoria.id}`, formCategoria)
      $q.notify({ type: 'positive', message: 'Categoría actualizada.' })
    } else {
      await api.post('/medicamento-categorias', formCategoria)
      $q.notify({ type: 'positive', message: 'Categoría creada.' })
    }
    dialogCategoria.value = false
    await fetchData()
  } catch (error) {
    console.error('Error al guardar categoría:', error)
    $q.notify({ type: 'negative', message: error.response?.data?.message || 'Error al guardar.' })
  }
}

const eliminarRegistro = (item) => {
  const esMedicamento = tab.value === 'medicamentos'
  const endpoint = esMedicamento ? `/medicamentos/${item.id}` : `/medicamento-categorias/${item.id}`
  const tipo = esMedicamento ? 'medicamento' : 'categoría'

  $q.dialog({
    title: 'Confirmar',
    message: `¿Estás seguro de que quieres eliminar ${tipo === 'medicamento' ? 'el' : 'la'} ${tipo} "${item.nombre}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(endpoint)
      $q.notify({
        type: 'info',
        message: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} eliminada.`,
      })
      await fetchData()
    } catch (error) {
      console.error(`Error al eliminar ${tipo}:`, error)
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || `Error al eliminar.`,
      })
    }
  })
}

// --- Funciones de Diálogos ---
const abrirDialogoCrear = () => {
  if (tab.value === 'medicamentos') {
    Object.assign(formMedicamento, {
      id: null,
      nombre: '',
      descripcion: '',
      presentacion: '',
      via_administracion: '',
      categoria_id: null,
    })
    dialogMedicamento.value = true
  } else {
    Object.assign(formCategoria, { id: null, nombre: '' })
    dialogCategoria.value = true
  }
}

const abrirDialogoEditar = (item) => {
  if (tab.value === 'medicamentos') {
    Object.assign(formMedicamento, { ...item })
    dialogMedicamento.value = true
  } else {
    Object.assign(formCategoria, { ...item })
    dialogCategoria.value = true
  }
}

// --- Hook de Ciclo de Vida ---
onMounted(fetchData)
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
