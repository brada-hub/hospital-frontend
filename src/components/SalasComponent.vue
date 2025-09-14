<template>
  <div class="salas-content q-pa-lg">
    <!-- Botón añadir sala -->
    <div class="q-mb-md">
      <q-btn label="Añadir Sala" color="primary" @click="abrirModalSala()" />
    </div>

    <!-- Listado de salas -->
    <div class="row q-col-gutter-md">
      <div v-for="sala in salas" :key="sala.id" class="col-12 col-md-6 col-lg-4">
        <q-card class="sala-card" flat bordered>
          <q-card-section @click="verDetalleSala(sala)">
            <div class="flex items-center justify-between">
              <h6>{{ sala.nombre }}</h6>
              <q-chip :color="getSalaStatusColor(sala)" text-color="white" size="sm">
                {{ getSalaStatus(sala) }}
              </q-chip>
            </div>
            <p>{{ sala.descripcion }}</p>
            <div><b>Tipo:</b> {{ sala.tipo || 'N/A' }}</div>
            <div><b>Especialidad:</b> {{ sala.especialidad?.nombre || 'Ninguna' }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat icon="edit" @click="abrirModalSala(sala)" />
            <q-btn flat icon="delete" color="negative" @click="eliminarSala(sala.id)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Detalle sala -->
    <div v-if="selectedSala" class="detalle-sala q-mt-lg">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6">{{ selectedSala.nombre }}</div>
          <div class="text-subtitle2">
            Tipo: {{ selectedSala.tipo || 'N/A' }} | Estado: {{ selectedSala.estado }}
          </div>
          <div class="text-caption">
            Especialidad: {{ selectedSala.especialidad?.nombre || 'Ninguna' }}
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-sm">
            <div v-for="cama in selectedSala.camas || []" :key="cama.id" class="col-6 col-md-4">
              <q-card :class="getCamaCardClass(cama.estado)" flat bordered>
                <q-card-section class="flex items-center justify-between">
                  <div>{{ cama.nombre }} ({{ cama.tipo }})</div>
                  <q-icon name="bed" :color="getCamaIconColor(cama.estado)" />
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn flat icon="edit" @click="abrirModalCama(cama)" />
                  <q-btn flat icon="delete" color="negative" @click="eliminarCama(cama.id)" />
                </q-card-actions>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="primary" @click="selectedSala = null" />
          <q-btn flat label="Añadir cama" color="secondary" @click="abrirModalCama()" />
        </q-card-actions>
      </q-card>
    </div>

    <!-- Modal Sala -->
    <q-dialog v-model="showAddSalaModal" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingSala ? 'Editar Sala' : 'Añadir Sala' }}</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="salaForm.nombre" label="Nombre" outlined dense class="q-mb-sm" />
          <q-input
            v-model="salaForm.descripcion"
            label="Descripción"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-input v-model="salaForm.tipo" label="Tipo de sala" outlined dense class="q-mb-sm" />
          <q-select
            v-model="salaForm.estado"
            :options="['Activa', 'Inactiva']"
            label="Estado"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-select
            v-model="salaForm.especialidad_id"
            :options="especialidadOptions"
            option-label="nombre"
            option-value="id"
            label="Especialidad"
            outlined
            dense
            class="q-mb-sm"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" @click="closeAddSalaModal" />
          <q-btn
            flat
            label="Guardar"
            color="positive"
            :loading="saving"
            @click="editingSala ? updateSala() : saveSala()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal Cama -->
    <q-dialog v-model="showAddCamaModal" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingCama ? 'Editar Cama' : 'Añadir Cama' }}</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="camaForm.nombre"
            label="Nombre de cama"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-select
            v-model="camaForm.tipo"
            :options="tiposCama"
            label="Tipo de cama"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-select
            v-model="camaForm.estado"
            :options="estadosCama"
            label="Estado"
            outlined
            dense
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" @click="closeAddCamaModal" />
          <q-btn
            flat
            label="Guardar"
            color="positive"
            :loading="saving"
            @click="editingCama ? updateCama() : saveCama()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const $q = useQuasar()

// Estados
const showAddSalaModal = ref(false)
const showAddCamaModal = ref(false)
const selectedSala = ref(null)
const saving = ref(false)
const editingSala = ref(false)
const editingCama = ref(false)

// Opciones
const estadosCama = ['Disponible', 'Ocupado', 'Mantenimiento']
const tiposCama = [
  'Rígida',
  'Articulada manual',
  'Articulada eléctrica',
  'Bariátrica',
  'Levitación',
]

// Datos
const salas = ref([])
const especialidadOptions = ref([])

// Formularios
const salaForm = reactive({
  nombre: '',
  descripcion: '',
  tipo: '',
  estado: '',
  especialidad_id: null,
})
const camaForm = reactive({ id: null, nombre: '', tipo: 'Rígida', estado: 'Disponible' })

// Fetch inicial
const fetchSalas = async () => {
  try {
    const res = await api.get('/salas')
    salas.value = res.data
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Error al cargar salas' })
  }
}
const fetchEspecialidades = async () => {
  try {
    const res = await api.get('/especialidades')
    especialidadOptions.value = res.data
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Error al cargar especialidades' })
  }
}

// Guardar sala
const saveSala = async () => {
  saving.value = true
  try {
    const res = await api.post('/salas', { ...salaForm })
    salas.value.push(res.data)
    $q.notify({ type: 'positive', message: 'Sala creada' })
    closeAddSalaModal()
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Error' })
  } finally {
    saving.value = false
  }
}

// Actualizar sala
const updateSala = async () => {
  saving.value = true
  try {
    const res = await api.put(`/salas/${salaForm.id}`, { ...salaForm })
    const index = salas.value.findIndex((s) => s.id === salaForm.id)
    if (index !== -1) salas.value[index] = res.data
    $q.notify({ type: 'positive', message: 'Sala actualizada' })
    closeAddSalaModal()
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Error' })
  } finally {
    saving.value = false
  }
}

// Guardar cama
const saveCama = async () => {
  if (!selectedSala.value) return
  saving.value = true
  try {
    const res = await api.post('/camas', { ...camaForm, sala_id: selectedSala.value.id })
    selectedSala.value.camas = selectedSala.value.camas || []
    selectedSala.value.camas.push(res.data)
    $q.notify({ type: 'positive', message: 'Cama añadida' })
    closeAddCamaModal()
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Error' })
  } finally {
    saving.value = false
  }
}

// Actualizar cama
const updateCama = async () => {
  saving.value = true
  try {
    const res = await api.put(`/camas/${camaForm.id}`, { ...camaForm })
    const index = selectedSala.value.camas.findIndex((c) => c.id === camaForm.id)
    if (index !== -1) selectedSala.value.camas[index] = res.data
    $q.notify({ type: 'positive', message: 'Cama actualizada' })
    closeAddCamaModal()
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Error' })
  } finally {
    saving.value = false
  }
}

// Abrir modales
const abrirModalSala = (sala = null) => {
  if (sala) {
    editingSala.value = true
    Object.assign(salaForm, sala)
  } else {
    editingSala.value = false
    Object.assign(salaForm, {
      nombre: '',
      descripcion: '',
      tipo: '',
      estado: '',
      especialidad_id: null,
    })
  }
  showAddSalaModal.value = true
}
const abrirModalCama = (cama = null) => {
  if (cama) {
    editingCama.value = true
    Object.assign(camaForm, cama)
  } else {
    editingCama.value = false
    Object.assign(camaForm, { id: null, nombre: '', tipo: 'Rígida', estado: 'Disponible' })
  }
  showAddCamaModal.value = true
}
const closeAddSalaModal = () => (showAddSalaModal.value = false)
const closeAddCamaModal = () => (showAddCamaModal.value = false)

// Ver detalle sala
const verDetalleSala = async (sala) => {
  try {
    const res = await api.get(`/salas/${sala.id}`)
    selectedSala.value = res.data
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Error' })
  }
}

// Eliminar
const eliminarSala = async (id) => {
  if (!confirm('Eliminar sala?')) return
  try {
    await api.delete(`/salas/${id}`)
    salas.value = salas.value.filter((s) => s.id !== id)
  } catch (err) {
    console.error(err)
  }
}
const eliminarCama = async (id) => {
  if (!confirm('Eliminar cama?')) return
  try {
    await api.delete(`/camas/${id}`)
    selectedSala.value.camas = selectedSala.value.camas.filter((c) => c.id !== id)
  } catch (err) {
    console.error(err)
  }
}

// Utilidades
const getCamasDisponibles = (sala) =>
  sala.camas?.filter((c) => c.estado === 'Disponible').length || 0
const getSalaStatus = (sala) => {
  const d = getCamasDisponibles(sala)
  const t = sala.camas?.length || 0
  if (d === 0) return 'Completa'
  if (d === t) return 'Disponible'
  return 'Parcial'
}
const getSalaStatusColor = (sala) =>
  ({ Completa: 'negative', Parcial: 'warning', Disponible: 'positive' })[getSalaStatus(sala)] ||
  'grey'
const getCamaStatusColor = (estado) =>
  ({ Disponible: 'positive', Ocupado: 'negative', Mantenimiento: 'warning' })[estado] || 'grey'
const getCamaIconColor = getCamaStatusColor
const getCamaCardClass = (estado) =>
  ({ Disponible: 'cama-disponible', Ocupado: 'cama-ocupada', Mantenimiento: 'cama-mantenimiento' })[
    estado
  ] || ''

onMounted(() => {
  fetchSalas()
  fetchEspecialidades()
})
</script>

<style scoped>
.sala-card {
  transition: 0.2s;
  cursor: pointer;
}
.sala-card:hover {
  transform: scale(1.02);
}
.cama-disponible {
  border-left: 5px solid #21ba45;
}
.cama-ocupada {
  border-left: 5px solid #c10015;
}
.cama-mantenimiento {
  border-left: 5px solid #f2c037;
}
</style>
