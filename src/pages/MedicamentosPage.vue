<template>
  <div class="page-container">
    <div class="page-header">
      <h4 class="page-title">Gestión de Farmacia</h4>
      <p class="page-subtitle">Administra los medicamentos y sus categorías</p>
    </div>

    <q-card class="elegant-card" flat bordered>
      <q-tabs
        v-model="tab"
        dense
        class="elegant-tabs"
        active-color="teal-6"
        indicator-color="teal-6"
        align="justify"
      >
        <q-tab name="medicamentos" icon="medication" label="Medicamentos" class="elegant-tab" />
        <q-tab name="categorias" icon="category" label="Categorías" class="elegant-tab" />
      </q-tabs>

      <q-separator class="elegant-separator" />

      <q-tab-panels v-model="tab" animated class="elegant-panels">
        <q-tab-panel name="medicamentos" class="q-pa-none elegant-tab-panel">
          <div class="panel-content">
            <div class="panel-header">
              <h2 class="panel-title">Gestión de Medicamentos</h2>
            </div>

            <div class="table-container-card">
              <div class="table-header-row">
                <q-input
                  dense
                  debounce="300"
                  v-model="filtroMedicamentos"
                  placeholder="Buscar medicamento..."
                  outlined
                  class="table-search"
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
                <q-btn
                  class="btn-agregar"
                  label="Añadir Medicamento"
                  icon="add"
                  @click="abrirDialogoCrear"
                  no-caps
                  rounded
                />
              </div>

              <q-table
                :rows="medicamentos"
                :columns="columnasMedicamentos"
                row-key="id"
                :filter="filtroMedicamentos"
                :loading="isLoading"
                flat
                class="styled-table"
              >
                <template v-slot:body-cell-categoria="props">
                  <q-td :props="props">
                    <q-badge
                      :label="props.row.categoria?.nombre || 'Sin categoría'"
                      class="rol-badge"
                    />
                  </q-td>
                </template>
                <template v-slot:body-cell-acciones="props">
                  <q-td :props="props" class="actions-cell">
                    <q-btn
                      flat
                      round
                      icon="edit"
                      class="action-btn-edit"
                      @click="abrirDialogoEditar(props.row)"
                    />
                    <q-btn
                      flat
                      round
                      icon="delete"
                      class="action-btn-delete"
                      @click="eliminarRegistro(props.row)"
                    />
                  </q-td>
                </template>
              </q-table>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="categorias" class="q-pa-none elegant-tab-panel">
          <div class="panel-content">
            <div class="panel-header">
              <h2 class="panel-title">Gestión de Categorías</h2>
            </div>

            <div class="table-container-card">
              <div class="table-header-row">
                <q-input
                  dense
                  debounce="300"
                  v-model="filtroCategorias"
                  placeholder="Buscar categoría..."
                  outlined
                  class="table-search"
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
                <q-btn
                  class="btn-agregar"
                  label="Añadir Categoría"
                  icon="add"
                  @click="abrirDialogoCrear"
                  no-caps
                  rounded
                />
              </div>

              <q-table
                :rows="categorias"
                :columns="columnasCategorias"
                row-key="id"
                :filter="filtroCategorias"
                :loading="isLoading"
                flat
                class="styled-table"
              >
                <template v-slot:body-cell-acciones="props">
                  <q-td :props="props" class="actions-cell">
                    <q-btn
                      flat
                      round
                      icon="edit"
                      class="action-btn-edit"
                      @click="abrirDialogoEditar(props.row)"
                    />
                    <q-btn
                      flat
                      round
                      icon="delete"
                      class="action-btn-delete"
                      @click="eliminarRegistro(props.row)"
                    />
                  </q-td>
                </template>
              </q-table>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <q-dialog v-model="dialogMedicamento" persistent>
      <q-card class="dialog-card scrollable-dialog">
        <q-form @submit="guardarMedicamento">
          <q-card-section class="dialog-header">
            <div class="dialog-title">
              {{ formMedicamento.id ? 'Editar Medicamento' : 'Añadir Medicamento' }}
            </div>
          </q-card-section>
          <q-card-section class="dialog-content">
            <q-input
              v-model="formMedicamento.nombre"
              label="Nombre *"
              outlined
              dense
              class="input-field"
              lazy-rules
              :rules="[
                (val) => !!val || 'El nombre es obligatorio',
                (val) => /^[a-zA-Z\s]+$/.test(val) || 'Solo se permiten letras y espacios',
              ]"
            />
            <q-input
              v-model="formMedicamento.descripcion"
              label="Descripción *"
              type="textarea"
              outlined
              dense
              class="input-field"
              lazy-rules
              :rules="[(val) => !!val || 'La descripción es obligatoria']"
            />
            <q-select
              v-model="formMedicamento.categoria_id"
              :options="categorias"
              option-value="id"
              option-label="nombre"
              emit-value
              map-options
              label="Categoría *"
              outlined
              dense
              class="input-field"
              lazy-rules
              :rules="[(val) => !!val || 'Debe seleccionar una categoría']"
            />
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancelar" v-close-popup class="btn-cancelar" />
            <q-btn label="Guardar" type="submit" class="btn-guardar" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogCategoria" persistent>
      <q-card class="dialog-card scrollable-dialog" style="max-width: 500px">
        <q-form @submit="guardarCategoria">
          <q-card-section class="dialog-header">
            <div class="dialog-title">
              {{ formCategoria.id ? 'Editar Categoría' : 'Añadir Categoría' }}
            </div>
          </q-card-section>
          <q-card-section class="dialog-content">
            <q-input
              v-model="formCategoria.nombre"
              label="Nombre de la Categoría *"
              outlined
              dense
              class="input-field"
              lazy-rules
              :rules="[
                (val) => !!val || 'El nombre es obligatorio',
                (val) => /^[a-zA-Z\s]+$/.test(val) || 'Solo se permiten letras y espacios',
              ]"
            />
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancelar" v-close-popup class="btn-cancelar" />
            <q-btn label="Guardar" type="submit" class="btn-guardar" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
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
  categoria_id: null,
})
const columnasMedicamentos = [
  { name: 'nombre', label: 'Nombre', align: 'left', field: 'nombre', sortable: true },
  {
    name: 'descripcion',
    label: 'Descripción',
    align: 'left',
    field: 'descripcion',
    style: 'white-space: pre-wrap; max-width: 300px;',
  },
  { name: 'categoria', label: 'Categoría', align: 'left', field: 'categoria', sortable: true },
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
    const payload = {
      id: formMedicamento.id,
      nombre: formMedicamento.nombre,
      descripcion: formMedicamento.descripcion,
      categoria_id: formMedicamento.categoria_id,
    }
    if (formMedicamento.id) {
      await api.put(`/medicamentos/${formMedicamento.id}`, payload)
      $q.notify({ type: 'positive', message: 'Medicamento actualizado.' })
    } else {
      await api.post('/medicamentos', payload)
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
/* === LAYOUT PRINCIPAL === */
.page-container {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 2.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}

.page-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 1.125rem;
}

/* === TARJETA PRINCIPAL === */
.elegant-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background: white;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  position: relative;
}

.elegant-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  z-index: 2;
}

/* === TABS === */
.elegant-tabs {
  background: #f8fafc;
  padding: 8px;
}

.elegant-tab {
  font-weight: 600;
  transition: all 0.2s ease;
}

.elegant-tab:hover {
  background-color: rgba(20, 184, 166, 0.1);
  border-radius: 8px;
}

.elegant-separator {
  background: linear-gradient(90deg, transparent 0%, #14b8a6 50%, transparent 100%);
  height: 1px;
  opacity: 0.5;
}

.elegant-panels {
  background: white;
}

.elegant-tab-panel {
  padding: 0 !important;
}

/* === CONTENIDO DEL PANEL === */
.panel-content {
  padding: 24px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
}

.panel-header {
  margin-bottom: 32px;
}

.panel-title {
  background: linear-gradient(135deg, #0f3027 0%, #082f49 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 900;
  font-size: 1.75rem;
  margin: 0;
}

/* === CONTENEDOR DE TABLA === */
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
  flex-wrap: wrap;
}

.table-search {
  flex-grow: 1;
  min-width: 250px;
  max-width: 450px;
}

.table-search :deep(.q-field__control) {
  border-radius: 99px;
}

.btn-agregar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 12px;
}

/* === TABLA === */
.styled-table {
  border-radius: 12px;
  border: none;
}

.styled-table :deep(thead tr) {
  background-color: #f8fafc;
}

.styled-table :deep(th) {
  font-weight: 600;
  color: #475569;
}

.styled-table :deep(tbody td) {
  padding: 16px;
  font-size: 0.9rem;
}

.rol-badge {
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  background-color: #ccfbf1;
  color: #0f766e;
  text-transform: uppercase;
  font-size: 0.7rem;
}

.actions-cell {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn-edit {
  color: white;
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
}

.action-btn-delete {
  color: white;
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
}

/* === MODALES === */
.dialog-card {
  width: 90vw;
  max-width: 700px;
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
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
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

.input-field {
  margin-bottom: 16px;
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
  border-radius: 12px;
  padding: 8px 24px;
  font-weight: 600;
}
</style>
