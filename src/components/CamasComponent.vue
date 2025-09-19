<template>
  <div class="salas-container">
    <div class="header-section">
      <h2 class="titulo-principal">Gestión de Camas Médicas</h2>
    </div>

    <div class="acordeon-container">
      <!-- CORREGIDO: Ahora itera sobre las salas activas, sin importar si tienen camas -->
      <div v-for="sala in salasActivas" :key="sala.id" class="sala-acordeon-item">
        <div class="sala-acordeon-header" @click="toggleExpansion(sala.id)">
          <div class="sala-info">
            <q-icon name="meeting_room" class="sala-icon" size="2rem" />
            <div class="sala-details">
              <h3 class="sala-nombre"><strong>SALA:</strong> {{ sala.nombre }}</h3>
            </div>
          </div>
          <q-icon
            name="expand_more"
            size="md"
            class="expand-icon"
            :class="{ 'is-expanded': expandedSalaId === sala.id }"
          />
        </div>

        <q-slide-transition>
          <div v-show="expandedSalaId === sala.id" class="camas-desplegable">
            <div class="camas-grid">
              <div v-for="cama in getCamasActivasPorSala(sala.id)" :key="cama.id" class="sala-card">
                <div
                  class="card-header"
                  :style="{ background: getDisponibilidadInfo(cama.disponibilidad).gradient }"
                >
                  <div class="sala-info">
                    <q-icon name="bed" class="sala-icon" size="2rem" />
                    <div class="sala-details">
                      <span class="sala-label">CAMA:</span>
                      <h3 class="sala-nombre">{{ cama.nombre }}</h3>
                    </div>
                  </div>
                  <q-chip class="estado-activo" label="Activo" dense />
                </div>
                <div class="card-body">
                  <div class="info-item">
                    <q-icon name="category" class="info-icon" />
                    <span class="info-label">Tipo:</span>
                    <span class="info-value">{{ cama.tipo }}</span>
                  </div>
                  <div class="info-item q-mt-sm">
                    <q-icon
                      :name="getDisponibilidadInfo(cama.disponibilidad).icon"
                      class="info-icon"
                      :style="{ color: getDisponibilidadInfo(cama.disponibilidad).color }"
                    />
                    <span class="info-label">Disponibilidad:</span>
                    <span
                      class="info-value"
                      :style="{
                        color: getDisponibilidadInfo(cama.disponibilidad).color,
                        fontWeight: 'bold',
                      }"
                    >
                      {{ getDisponibilidadInfo(cama.disponibilidad).text }}
                    </span>
                  </div>
                </div>
                <div class="card-actions">
                  <q-btn
                    flat
                    dense
                    class="btn-editar"
                    icon="edit"
                    label="Editar"
                    @click="openEditCamaDialog(cama)"
                    no-caps
                  />
                  <q-btn
                    flat
                    dense
                    class="btn-inactivar"
                    icon="delete"
                    label="Eliminar"
                    @click="eliminarCama(cama)"
                    no-caps
                  />
                </div>
              </div>

              <div class="add-card" @click="openAddCamaDialog(sala.id)">
                <div class="add-content">
                  <q-icon name="add_circle" class="add-icon" />
                  <p class="add-text">Añadir Cama</p>
                </div>
              </div>
            </div>
          </div>
        </q-slide-transition>
      </div>
    </div>

    <q-dialog v-model="camaDialog" persistent>
      <q-card class="dialog-card">
        <q-form ref="formRef" @submit.prevent="saveCama">
          <q-card-section class="dialog-header">
            <div class="dialog-title">{{ camaForm.id ? 'Editar Cama' : 'Añadir Nueva Cama' }}</div>
          </q-card-section>
          <q-card-section class="dialog-content">
            <q-input
              v-model="camaForm.nombre"
              label="Nombre o Código de la Cama *"
              outlined
              dense
              class="input-field"
              :rules="[
                (val) => !!val || 'El nombre es requerido',
                (val) => val.length <= 100 || 'Máximo 100 caracteres',
                (val) =>
                  /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]+$/.test(val) || 'Solo letras, números y guiones',
              ]"
              :error="!!backendErrors.nombre"
              :error-message="backendErrors.nombre ? backendErrors.nombre[0] : ''"
              @update:model-value="backendErrors.nombre = null"
            />
            <q-select
              v-model="camaForm.tipo"
              label="Tipo *"
              :options="[
                'ESTÁNDAR',
                'PEDIÁTRICA',
                'CUNA',
                'INCUBADORA',
                'CAMA UCI',
                'CAMA QUIRÚRGICA',
              ]"
              outlined
              dense
              class="input-field"
              :rules="[(val) => !!val || 'El tipo es requerido']"
            />
            <q-select
              v-model="camaForm.disponibilidad"
              :options="opcionesDisponibilidad"
              label="Disponibilidad *"
              emit-value
              map-options
              outlined
              dense
              class="input-field"
            />
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancelar" v-close-popup @click="resetForm" class="btn-cancelar" />
            <q-btn label="Guardar" type="submit" class="btn-guardar" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const $q = useQuasar()
const salas = ref([])
const camas = ref([])
const camaDialog = ref(false)
const expandedSalaId = ref(null)
const formRef = ref(null)
const backendErrors = ref({})

const camaForm = reactive({
  id: null,
  nombre: '',
  tipo: '',
  estado: true,
  disponibilidad: 1,
  sala_id: null,
})

const opcionesDisponibilidad = [
  { label: 'Disponible', value: 1 },
  { label: 'Ocupada', value: 0 },
  { label: 'En Mantenimiento', value: 2 },
]

// FILTROS CON COMPUTED PROPERTIES PARA LA VISTA
const camasActivas = computed(() => camas.value.filter((c) => c.estado))
const salasActivas = computed(() => salas.value.filter((s) => s.estado))
const getCamasActivasPorSala = (salaId) =>
  camasActivas.value.filter((cama) => cama.sala_id === salaId)

// CORREGIDO: Se elimina la computed 'salasConCamasActivas' que causaba el problema

// LÓGICA DE LA INTERFAZ
const getDisponibilidadInfo = (valor) => {
  switch (valor) {
    case 0:
      return {
        text: 'Ocupada',
        color: '#ef4444',
        icon: 'person',
        gradient: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
      }
    case 1:
      return {
        text: 'Disponible',
        color: '#22c55e',
        icon: 'check_circle',
        gradient: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
      }
    case 2:
      return {
        text: 'Mantenimiento',
        color: '#f59e0b',
        icon: 'build',
        gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
      }
    default:
      return {
        text: 'Desconocido',
        color: 'grey',
        icon: 'help',
        gradient: 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)',
      }
  }
}

const toggleExpansion = (salaId) => {
  expandedSalaId.value = expandedSalaId.value === salaId ? null : salaId
}

// PETICIONES A LA API
const fetchSalas = async () => {
  try {
    const { data } = await api.get('/salas')
    salas.value = data
  } catch (error) {
    console.error('Error al cargar salas:', error)
    $q.notify({ type: 'negative', message: 'Error al cargar salas' })
  }
}

const fetchCamas = async () => {
  try {
    const { data } = await api.get('/camas')
    camas.value = data
  } catch (error) {
    console.error('Error al cargar camas:', error)
    $q.notify({ type: 'negative', message: 'Error al cargar camas' })
  }
}

// LÓGICA DEL FORMULARIO
const resetForm = () => {
  Object.assign(camaForm, {
    id: null,
    nombre: '',
    tipo: '',
    estado: true,
    disponibilidad: 1,
    sala_id: null,
  })
  formRef.value?.resetValidation()
  backendErrors.value = {}
}

const openAddCamaDialog = (salaId) => {
  resetForm()
  camaForm.sala_id = salaId
  camaDialog.value = true
}

const openEditCamaDialog = (cama) => {
  resetForm()
  const camaParaFormulario = { ...cama }
  camaParaFormulario.nombre = cama.nombre.toUpperCase()
  camaParaFormulario.tipo = cama.tipo.toUpperCase()
  Object.assign(camaForm, camaParaFormulario)
  camaDialog.value = true
}

const saveCama = async () => {
  backendErrors.value = {}
  const isValid = await formRef.value.validate()
  if (!isValid) return

  try {
    const payload = { ...camaForm }
    if (camaForm.id) {
      await api.put(`/camas/${camaForm.id}`, payload)
      $q.notify({ type: 'positive', message: 'Cama actualizada' })
    } else {
      await api.post('/camas', payload)
      $q.notify({ type: 'positive', message: 'Cama creada' })
    }
    camaDialog.value = false
    await fetchCamas()
  } catch (error) {
    console.error('Error al guardar cama:', error)
    if (error.response && error.response.status === 422) {
      backendErrors.value = error.response.data.errors
    } else {
      $q.notify({ type: 'negative', message: 'Error inesperado al guardar la cama' })
    }
  }
}

const eliminarCama = (cama) => {
  $q.dialog({
    title: 'Confirmar Eliminación',
    message: `¿Estás seguro de que quieres eliminar la cama "${cama.nombre}"?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Eliminar', color: 'red-8' },
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/camas/${cama.id}`)
      camas.value = camas.value.filter((c) => c.id !== cama.id)
      $q.notify({ type: 'info', message: 'La cama ha sido eliminada.' })
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar la cama'
      $q.notify({ type: 'negative', message: errorMessage, icon: 'warning' })
    }
  })
}

onMounted(() => {
  fetchSalas()
  fetchCamas()
})
</script>

<style scoped>
/* Tus estilos (no necesitan cambios) */
.salas-container {
  padding: 24px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}
.titulo-principal {
  background: linear-gradient(135deg, #0f3027 0%, #082f49 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 900;
  font-size: 1.75rem;
  margin: 0;
}
.acordeon-container {
  display: grid;
  gap: 16px;
}
.sala-acordeon-item {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.sala-acordeon-header {
  padding: 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.sala-acordeon-item:has(.camas-desplegable[style*='display: block']) .sala-acordeon-header {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.sala-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.sala-details {
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.sala-nombre {
  font-size: 1.25rem;
  font-weight: 400;
  margin: 0;
}
.sala-nombre strong {
  font-weight: 700;
  opacity: 0.8;
}
.expand-icon {
  transition: transform 0.3s ease-in-out;
}
.expand-icon.is-expanded {
  transform: rotate(180deg);
}
.camas-desplegable {
  padding: 20px;
  background-color: #f8fafc;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}
.camas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}
.sala-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.card-header {
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-body {
  padding: 16px;
  background: #f8fafc;
  flex-grow: 1;
}
.card-actions {
  padding: 8px;
  display: flex;
  gap: 8px;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}
.btn-editar,
.btn-inactivar,
.btn-activar {
  flex: 1;
  font-weight: 600;
  border-radius: 8px;
  color: white;
}
.btn-editar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
}
.btn-inactivar {
  background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
}
.estado-activo {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}
.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.info-label {
  font-weight: 600;
  opacity: 0.8;
}
.info-value {
  flex: 1;
  word-break: break-word;
}
.sala-label {
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.8;
  text-transform: uppercase;
}
.add-card {
  border: 2px dashed #0d9488;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  cursor: pointer;
  background-color: #f0fdfa;
}
.add-content {
  text-align: center;
  color: #0d9488;
}
.add-icon {
  font-size: 2.5rem;
}
.add-text {
  font-weight: 600;
}
.dialog-card {
  width: 90vw;
  max-width: 450px;
  border-radius: 16px;
  overflow: hidden;
}
.dialog-header {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
}
.dialog-title {
  font-size: 1.25rem;
}
.dialog-content {
  padding: 24px;
}
.input-field {
  margin-bottom: 16px;
}
.dialog-actions {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}
.btn-cancelar {
  color: #ef4444;
}
.btn-guardar {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  border-radius: 12px;
  padding: 8px 24px;
}
</style>
