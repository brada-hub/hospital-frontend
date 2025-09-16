<template>
  <div class="salas-container">
    <div class="header-section">
      <h2 class="titulo-principal">Gestión de Camas Médicas</h2>
    </div>

    <div class="acordeon-container">
      <div v-for="sala in salas" :key="sala.id" class="sala-acordeon-item">
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
              <div
                v-for="cama in getCamasBySala(sala.id)"
                :key="cama.id"
                class="sala-card"
                :class="{ 'card-inactivo': !cama.estado }"
              >
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
                  <q-chip
                    :class="cama.estado ? 'estado-activo' : 'estado-inactivo'"
                    :label="cama.estado ? 'Activo' : 'Inactivo'"
                    dense
                  />
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
                    :class="cama.estado ? 'btn-inactivar' : 'btn-activar'"
                    :icon="cama.estado ? 'block' : 'check'"
                    :label="cama.estado ? 'Desactivar' : 'Activar'"
                    @click="toggleCamaEstado(cama)"
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
        <q-card-section class="dialog-header">
          <div class="dialog-title">{{ camaForm.id ? 'Editar Cama' : 'Añadir Nueva Cama' }}</div>
        </q-card-section>
        <q-card-section class="dialog-content">
          <q-input
            v-model="camaForm.nombre"
            label="Nombre *"
            outlined
            dense
            class="input-field"
            :rules="reglasGenericas"
          />
          <q-input
            v-model="camaForm.tipo"
            label="Tipo *"
            outlined
            dense
            class="input-field"
            :rules="reglasGenericas"
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

          <q-toggle
            v-model="camaForm.estado"
            :label="camaForm.estado ? 'Estado: Activo' : 'Estado: Inactivo'"
            :color="camaForm.estado ? 'teal' : 'red'"
            left-label
            class="q-mt-md"
          />
        </q-card-section>
        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="btn-cancelar" />
          <q-btn label="Guardar" @click="saveCama" class="btn-guardar" :disable="!isFormValido" />
        </q-card-actions>
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

const camaForm = reactive({
  id: null,
  nombre: '',
  tipo: '',
  // CAMBIADO: 'estado' ahora es un booleano
  estado: true,
  // AÑADIDO: 'disponibilidad' con valor por defecto
  disponibilidad: 1,
  sala_id: null,
})

// AÑADIDO: Opciones para el q-select de disponibilidad
const opcionesDisponibilidad = [
  { label: 'Disponible', value: 1 },
  { label: 'Ocupada', value: 0 },
  { label: 'En Mantenimiento', value: 2 },
]

const reglasGenericas = [
  (val) => (!!val && val.trim().length >= 3) || 'Debe tener al menos 3 caracteres',
]
const isFormValido = computed(
  () => camaForm.nombre.trim().length >= 3 && camaForm.tipo.trim().length >= 3,
)

// AÑADIDO: Función para obtener texto, color e ícono de la disponibilidad
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

const fetchSalas = async () => {
  try {
    const { data } = await api.get('/salas')
    salas.value = data.filter((s) => s.estado) // Solo mostrar salas activas
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

const getCamasBySala = (salaId) => camas.value.filter((cama) => cama.sala_id === salaId)

const openAddCamaDialog = (salaId) => {
  // CAMBIADO: Se reinicia el formulario con los nuevos campos
  Object.assign(camaForm, {
    id: null,
    nombre: '',
    tipo: '',
    estado: true,
    disponibilidad: 1,
    sala_id: salaId,
  })
  camaDialog.value = true
}

const openEditCamaDialog = (cama) => {
  Object.assign(camaForm, { ...cama })
  camaDialog.value = true
}

const saveCama = async () => {
  if (!isFormValido.value) return
  try {
    // El 'camaForm' ya tiene los datos correctos (booleano e integer), así que se envía directamente.
    if (camaForm.id) {
      await api.put(`/camas/${camaForm.id}`, camaForm)
      $q.notify({ type: 'positive', message: 'Cama actualizada' })
    } else {
      await api.post('/camas', camaForm)
      $q.notify({ type: 'positive', message: 'Cama creada' })
    }
    camaDialog.value = false
    await fetchCamas()
  } catch (error) {
    console.error('Error al guardar cama:', error)
    $q.notify({ type: 'negative', message: 'Error al guardar cama' })
  }
}

// CAMBIADO: La función ahora usa 'api.delete' y la lógica de notificación es booleana
const toggleCamaEstado = async (cama) => {
  try {
    await api.delete(`camas/${cama.id}`)
    const message = cama.estado ? 'Cama Desactivada' : 'Cama Activada'
    $q.notify({ type: 'info', message })
    await fetchCamas()
  } catch (error) {
    console.error('Error al cambiar estado de la cama:', error)
    $q.notify({ type: 'negative', message: 'Error al cambiar estado' })
  }
}

onMounted(() => {
  fetchSalas()
  fetchCamas()
})
</script>

<style scoped>
/* ESTILOS GENERALES Y DE HEADER */
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

/* ESTILOS DEL ACORDEÓN */
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

/* GRID Y TARJETAS DE CAMAS */
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
  border-radius: 0;
  color: white;
}
.btn-editar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
}
.btn-inactivar {
  background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
}
.btn-activar {
  background: linear-gradient(135deg, #065f46 0%, #059669 100%);
}
.estado-activo {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}
.estado-inactivo {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-style: italic;
}
.card-inactivo {
  opacity: 0.7;
  background-color: #f1f5f9;
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
.btn-guardar:disabled {
  background: #cccccc;
  color: #666666;
}
</style>
