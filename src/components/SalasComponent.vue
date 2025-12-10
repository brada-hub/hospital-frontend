<template>
  <div class="salas-container">
    <div class="header-section">
      <h2 class="titulo-principal">Gestión de Salas Médicas</h2>
      <q-btn
        class="btn-agregar"
        label="Añadir Sala"
        icon="add"
        @click="openAddDialog"
        no-caps
        rounded
      />
    </div>

    <div class="salas-grid">
      <div v-for="sala in salasActivas" :key="sala.id" class="sala-card">
        <div class="card-header">
          <div class="sala-info">
            <q-icon :name="getSalaIcon(sala.tipo)" class="sala-icon" size="2rem" />
            <div class="sala-details">
              <h3 class="sala-nombre"><strong>Sala:</strong> {{ sala.nombre }}</h3>
              <p class="sala-tipo"><strong>Tipo:</strong> {{ sala.tipo }}</p>
            </div>
          </div>
          <q-chip class="estado-activo" label="Activo" dense />
        </div>

        <div class="card-body">
          <div class="info-item">
            <q-icon name="medical_services" class="info-icon" />
            <span class="info-label">Especialidad:</span>
            <span class="info-value">{{ sala.especialidad?.nombre || 'N/A' }}</span>
          </div>
        </div>

        <div class="card-actions">
          <q-btn
            flat
            dense
            class="btn-editar"
            icon="edit"
            label="Editar"
            @click="openEditDialog(sala)"
            no-caps
          />
          <q-btn
            flat
            dense
            class="btn-inactivar"
            icon="delete"
            label="Eliminar"
            @click="eliminarSala(sala)"
            no-caps
          />
        </div>
      </div>

      <div class="add-card" @click="openAddDialog">
        <div class="add-content">
          <q-icon name="add_circle" class="add-icon" />
          <p class="add-text">Añadir Nueva Sala</p>
        </div>
      </div>
    </div>

    <q-dialog v-model="dialog" persistent>
      <q-card class="dialog-card">
        <q-form ref="formRef" @submit.prevent="saveSala">
          <q-card-section class="dialog-header">
            <div class="dialog-title">
              {{ salaForm.id ? 'Editar Sala' : 'Añadir Nueva Sala' }}
            </div>
          </q-card-section>

          <q-card-section class="dialog-content">
            <q-input
              v-model="salaForm.nombre"
              label="Nombre de la Sala *"
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
              v-model="salaForm.tipo"
              label="Tipo de Sala *"
              :options="[
                'SALA COMÚN',
                'QUIRÓFANO',
                'CONSULTORIO',
                'TERAPIA INTENSIVA (UTI)',
                'LABORATORIO',
                'SALA DE ESPERA',
              ]"
              outlined
              dense
              class="input-field"
              :rules="[(val) => !!val || 'El tipo es requerido']"
            />

            <q-select
              v-model="salaForm.especialidad_id"
              :options="especialidadesOptions"
              option-value="id"
              option-label="nombre"
              emit-value
              map-options
              label="Especialidad *"
              outlined
              dense
              class="input-field"
              :rules="[(val) => !!val || 'Debe seleccionar una especialidad']"
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const $q = useQuasar()
const salas = ref([])
const especialidadesOptions = ref([])
const dialog = ref(false)
const formRef = ref(null)
const backendErrors = ref({})

const salaForm = reactive({
  id: null,
  nombre: '',
  tipo: '',
  estado: true,
  especialidad_id: null,
})

const salasActivas = computed(() => {
  return salas.value.filter((s) => s.estado)
})

const getSalaIcon = (tipo) => {
  const tipoLower = tipo ? tipo.toLowerCase() : ''
  if (tipoLower.includes('quirófano')) return 'healing'
  if (tipoLower.includes('consultorio')) return 'medical_information'
  if (tipoLower.includes('laboratorio')) return 'science'
  if (tipoLower.includes('terapia intensiva')) return 'emergency'
  return 'meeting_room'
}

const fetchSalas = async () => {
  try {
    const { data } = await api.get('/salas')
    salas.value = data
  } catch (error) {
    console.error('Error al cargar salas:', error)
    $q.notify({ type: 'negative', message: 'Error al cargar salas' })
  }
}

const fetchEspecialidades = async () => {
  try {
    const { data } = await api.get('/especialidades')
    especialidadesOptions.value = data.filter((e) => e.estado)
  } catch (error) {
    console.error('Error al cargar especialidades:', error)
    $q.notify({ type: 'negative', message: 'Error al cargar especialidades' })
  }
}

const resetForm = () => {
  Object.assign(salaForm, {
    id: null,
    nombre: '',
    tipo: '',
    estado: true,
    especialidad_id: null,
  })
  formRef.value?.resetValidation()
  backendErrors.value = {}
}

const openAddDialog = () => {
  resetForm()
  dialog.value = true
}

// --- AQUÍ ESTÁ LA CORRECCIÓN CLAVE ---
const openEditDialog = (sala) => {
  resetForm()
  // Hacemos una copia y convertimos los campos necesarios a mayúsculas
  // para que coincidan con las opciones del q-select y la validación del backend.
  const salaParaFormulario = { ...sala }
  salaParaFormulario.nombre = sala.nombre.toUpperCase()
  salaParaFormulario.tipo = sala.tipo.toUpperCase()

  Object.assign(salaForm, salaParaFormulario)
  dialog.value = true
}

const saveSala = async () => {
  backendErrors.value = {}
  const isValid = await formRef.value.validate()
  if (!isValid) return

  try {
    const payload = { ...salaForm }
    if (salaForm.id) {
      await api.put(`/salas/${salaForm.id}`, payload)
      $q.notify({ type: 'positive', message: 'Sala actualizada' })
    } else {
      await api.post('/salas', payload)
      $q.notify({ type: 'positive', message: 'Sala creada' })
    }
    dialog.value = false
    await fetchSalas()
  } catch (error) {
    console.error('Error al guardar la sala:', error)
    if (error.response && error.response.status === 422) {
      backendErrors.value = error.response.data.errors
    } else {
      $q.notify({ type: 'negative', message: 'Error inesperado al guardar la sala' })
    }
  }
}

const eliminarSala = (sala) => {
  $q.dialog({
    title: 'Confirmar Eliminación',
    message: `¿Estás seguro de que quieres eliminar la sala "${sala.nombre}"?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Eliminar', color: 'red-8' },
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/salas/${sala.id}`)
      salas.value = salas.value.filter((s) => s.id !== sala.id)
      $q.notify({ type: 'info', message: 'La sala ha sido eliminada.' })
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar la sala'
      $q.notify({ type: 'negative', message: errorMessage, icon: 'warning' })
    }
  })
}

onMounted(() => {
  fetchSalas()
  fetchEspecialidades()
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
  padding: 0 8px;
  flex-wrap: wrap;
  gap: 12px;
}
.titulo-principal {
  background: linear-gradient(135deg, #0f3027 0%, #082f49 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 900;
  font-size: 1.5rem;
  margin: 0;
}
.btn-agregar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  font-weight: 700;
  padding: 12px 24px;
}
@media (max-width: 600px) {
  .titulo-principal {
    font-size: 1.2rem;
    text-align: center;
    width: 100%;
  }
  .btn-agregar {
    width: 100%;
    justify-content: center;
  }
}
.salas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
}
.sala-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}
.card-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-body {
  padding: 20px;
  background: #f8fafc;
}
.card-actions {
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  background: #f8fafc;
}
.estado-activo {
  background: #065f46;
  color: white;
  font-weight: 600;
}
.btn-editar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  flex: 1;
}
.btn-inactivar {
  background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
  color: white;
  flex: 1;
}
.add-card {
  border: 2px dashed #0d9488;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.add-content {
  text-align: center;
  color: #0d9488;
}
.dialog-card {
  display: flex;
  flex-direction: column;
  max-width: 95vw;
  max-height: 90vh;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
}
.dialog-header {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  padding: 16px;
}
.dialog-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}
.dialog-actions {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}
@media (min-width: 600px) {
  .dialog-card {
    max-width: 600px;
  }
}
.input-field {
  margin-bottom: 16px;
}
.sala-details h3.sala-nombre {
  font-size: 1.3rem;
  margin: 0;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
.sala-details p.sala-tipo {
  font-size: 0.9rem;
  margin: 4px 0 0 0;
  opacity: 0.9;
  font-weight: 500;
}
</style>
