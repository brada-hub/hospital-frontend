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
      <div v-for="sala in salas" :key="sala.id" class="sala-card">
        <div class="card-header">
          <div class="sala-info">
            <q-icon :name="getSalaIcon(sala.tipo)" class="sala-icon" size="2rem" />
            <div class="sala-details">
              <h3 class="sala-nombre"><strong>Sala:</strong> {{ sala.nombre }}</h3>
              <p class="sala-tipo"><strong>Tipo:</strong> {{ sala.tipo }}</p>
            </div>
          </div>
          <q-chip
            :class="sala.estado === 'activo' ? 'estado-activo' : 'estado-inactivo'"
            :label="sala.estado"
            dense
          />
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
            :class="sala.estado === 'activo' ? 'btn-inactivar' : 'btn-activar'"
            :icon="sala.estado === 'activo' ? 'block' : 'check'"
            :label="sala.estado === 'activo' ? 'Desactivar' : 'Activar'"
            @click="toggleEstado(sala)"
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

    <!-- MODAL -->
    <q-dialog v-model="dialog" persistent>
      <q-card class="dialog-card">
        <q-card-section class="dialog-header">
          <div class="dialog-title">
            {{ salaForm.id ? 'Editar Sala' : 'Añadir Nueva Sala' }}
          </div>
        </q-card-section>

        <!-- CONTENIDO SCROLLEABLE -->
        <q-card-section class="dialog-content">
          <q-input
            v-model="salaForm.nombre"
            label="Nombre de la Sala *"
            outlined
            dense
            class="input-field"
            :rules="reglasNombre"
          />

          <q-input
            v-model="salaForm.tipo"
            label="Tipo de Sala *"
            outlined
            dense
            class="input-field"
            :rules="reglasTipo"
          />

          <q-input
            v-model="salaForm.estado"
            label="Estado"
            outlined
            dense
            readonly
            class="input-field"
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
            :rules="reglasEspecialidad"
          />
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup @click="resetForm" class="btn-cancelar" />
          <q-btn label="Guardar" @click="saveSala" class="btn-guardar" :disable="!isFormValid" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const $q = useQuasar()

const salas = ref([])
const especialidadesOptions = ref([])
const dialog = ref(false)
const formTouched = ref(false)

const salaForm = reactive({
  id: null,
  nombre: '',
  tipo: '',
  estado: 'activo',
  especialidad_id: null,
})

const reglasNombre = [
  (val) => !!val || 'El nombre es obligatorio',
  (val) => val.length >= 3 || 'El nombre debe tener al menos 3 caracteres',
]

const reglasTipo = [
  (val) => !!val || 'El tipo es obligatorio',
  (val) => val.length >= 3 || 'El tipo debe tener al menos 3 caracteres',
]

const reglasEspecialidad = [(val) => !!val || 'Debe seleccionar una especialidad']

const isFormValid = computed(() => {
  return (
    salaForm.nombre.trim().length >= 3 &&
    salaForm.tipo.trim().length >= 3 &&
    salaForm.especialidad_id !== null
  )
})

watch([() => salaForm.nombre, () => salaForm.tipo, () => salaForm.especialidad_id], () => {
  formTouched.value = true
})

const getSalaIcon = (tipo) => {
  const iconMap = {
    emergencia: 'emergency',
    cirugia: 'healing',
    consulta: 'medical_information',
    laboratorio: 'science',
    radiologia: 'camera_alt',
    pediatria: 'child_care',
    cardiologia: 'favorite',
    neurologia: 'psychology',
    oncologia: 'local_hospital',
    default: 'meeting_room',
  }

  const tipoLower = tipo ? tipo.toLowerCase() : ''
  return iconMap[tipoLower] || iconMap.default
}

const fetchSalas = async () => {
  try {
    const { data } = await api.get('/salas')
    salas.value = data
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Error al cargar salas' })
  }
}

const fetchEspecialidades = async () => {
  try {
    const { data } = await api.get('/especialidades')
    especialidadesOptions.value = data
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Error al cargar especialidades' })
  }
}

const openAddDialog = () => {
  resetForm()
  dialog.value = true
}

const openEditDialog = (sala) => {
  formTouched.value = false
  Object.assign(salaForm, sala)
  dialog.value = true
}

const saveSala = async () => {
  if (!isFormValid.value) {
    $q.notify({
      type: 'negative',
      message: 'Por favor completa todos los campos correctamente.',
    })
    return
  }

  try {
    const payload = {
      nombre: salaForm.nombre.trim(),
      tipo: salaForm.tipo.trim(),
      estado: salaForm.estado.toLowerCase(),
      especialidad_id: salaForm.especialidad_id,
    }

    if (salaForm.id) {
      await api.put(`/salas/${salaForm.id}`, payload)
      $q.notify({
        type: 'positive',
        message: 'Sala actualizada correctamente',
      })
    } else {
      await api.post('/salas', payload)
      $q.notify({
        type: 'positive',
        message: 'Sala creada correctamente',
      })
    }

    dialog.value = false
    resetForm()
    await fetchSalas()
  } catch (error) {
    console.error('Error al guardar sala:', error.response?.data || error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al guardar sala',
    })
  }
}

const toggleEstado = async (sala) => {
  try {
    await api.delete(`/salas/${sala.id}`)
    await fetchSalas()
    $q.notify({
      type: 'positive',
      message: `Sala ${sala.estado === 'activo' ? 'Desactivada' : 'activada'}`,
    })
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Error al cambiar estado' })
  }
}

const resetForm = () => {
  formTouched.value = false
  Object.assign(salaForm, {
    id: null,
    nombre: '',
    tipo: '',
    estado: 'activo',
    especialidad_id: null,
  })
}

onMounted(() => {
  fetchSalas()
  fetchEspecialidades()
})
</script>

<style scoped>
/* CONTENEDOR */
.salas-container {
  padding: 24px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
  /* min-height: 100vh;*/
}

/* HEADER */
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

/* GRID */
.salas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-top: 24px;
}
@media (min-width: 1200px) {
  .salas-grid {
    gap: 24px;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

/* TARJETAS */
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

/* CHIP ESTADO */
.estado-activo {
  background: #065f46;
  color: white;
  font-weight: 600;
}
.estado-inactivo {
  background: #991b1b;
  color: white;
  font-weight: 600;
}

/* BOTONES */
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
.btn-activar {
  background: linear-gradient(135deg, #065f46 0%, #059669 100%);
  color: white;
  flex: 1;
}

/* CARD ADD */
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

/* DIALOG */
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
  overflow-y: auto; /* Scroll solo en el contenido */
  flex: 1; /* ocupa espacio disponible */
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
@media (min-width: 1025px) {
  .dialog-card {
    max-width: 700px;
  }
}

/* INPUTS */
.input-field {
  margin-bottom: 16px;
}
.sala-details h3.sala-nombre {
  font-size: 1.3rem; /* <-- ESTA LÍNEA CONTROLA EL TAMAÑO */
  margin: 0;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); /* Opcional: para que se lea mejor */
}

.sala-details p.sala-tipo {
  font-size: 0.9rem;
  margin: 4px 0 0 0;
  opacity: 0.9;
  font-weight: 500;
}
</style>
