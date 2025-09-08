<template>
  <div class="salas-container">
    <!-- Vista Lista de Salas -->
    <div v-if="!showSalaDetail" class="salas-list-view">
      <!-- Header -->
      <div class="salas-header">
        <div class="row items-center justify-between q-pa-lg">
          <div class="col-auto">
            <h5 class="section-title">Salas y Camas</h5>
            <p class="section-subtitle">Gestiona las salas y camas del hospital</p>
          </div>
          <div class="col-auto">
            <q-btn
              label="Añadir Sala"
              color="primary"
              icon="add"
              @click="showAddSalaModal = true"
              class="add-button"
            />
          </div>
        </div>
      </div>

      <!-- Contenido de Salas -->
      <div class="salas-content q-pa-lg">
        <div v-for="piso in pisos" :key="piso.nombre" class="piso-section q-mb-xl">
          <h6 class="piso-title">{{ piso.nombre }}</h6>
          <div class="row q-col-gutter-md">
            <div v-for="sala in piso.salas" :key="sala.id" class="col-12 col-md-6 col-lg-4">
              <q-card class="sala-card" flat bordered @click="verDetalleSala(sala)">
                <q-card-section class="q-pa-md">
                  <div class="flex items-center justify-between q-mb-sm">
                    <div class="flex items-center">
                      <q-icon name="bed" size="24px" color="primary" class="q-mr-sm" />
                      <h6 class="sala-title">{{ sala.nombre }}</h6>
                    </div>
                    <q-chip :color="getSalaStatusColor(sala)" text-color="white" size="sm">
                      {{ getSalaStatus(sala) }}
                    </q-chip>
                  </div>

                  <p class="sala-description">{{ sala.descripcion }}</p>

                  <div class="sala-stats q-mt-md">
                    <div class="row q-col-gutter-sm">
                      <div class="col-6">
                        <div class="stat-item">
                          <span class="stat-number">{{ sala.camas.length }}</span>
                          <span class="stat-label">Total Camas</span>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="stat-item">
                          <span class="stat-number text-positive">{{
                            getCamasDisponibles(sala)
                          }}</span>
                          <span class="stat-label">Disponibles</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-if="pisos.length === 0" class="empty-state">
          <q-icon name="bed" size="64px" color="grey-4" />
          <h6 class="text-grey-6 q-mt-md">No hay salas registradas</h6>
          <p class="text-grey-5">Comienza agregando la primera sala</p>
          <q-btn
            label="Añadir Primera Sala"
            color="primary"
            @click="showAddSalaModal = true"
            class="q-mt-md"
          />
        </div>
      </div>
    </div>

    <!-- Vista Detalle de Sala -->
    <div v-else class="sala-detail-view">
      <!-- Header del detalle -->
      <div class="detail-header">
        <div class="row items-center justify-between q-pa-lg">
          <div class="col-auto">
            <q-btn
              flat
              icon="arrow_back"
              label="Volver a Salas"
              @click="showSalaDetail = false"
              class="q-mb-sm"
            />
            <h5 class="section-title">{{ selectedSala?.nombre }}</h5>
            <p class="section-subtitle">{{ selectedSala?.descripcion }}</p>
          </div>
          <div class="col-auto">
            <q-btn
              label="Añadir Cama"
              color="secondary"
              icon="add"
              @click="showAddCamaModal = true"
              class="add-button"
            />
          </div>
        </div>
      </div>

      <!-- Grid de Camas -->
      <div class="camas-content q-pa-lg">
        <div class="row q-col-gutter-md">
          <div
            v-for="cama in selectedSala?.camas"
            :key="cama.id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card :class="['cama-card', getCamaCardClass(cama.estado)]" flat bordered>
              <q-card-section class="text-center q-pa-md">
                <q-icon
                  name="bed"
                  size="32px"
                  :color="getCamaIconColor(cama.estado)"
                  class="q-mb-sm"
                />
                <h6 class="cama-id">{{ cama.id }}</h6>
                <q-chip
                  :color="getCamaStatusColor(cama.estado)"
                  text-color="white"
                  size="sm"
                  class="q-mb-sm"
                >
                  {{ cama.estado }}
                </q-chip>

                <!-- Información del paciente si está ocupada -->
                <div v-if="cama.estado === 'Ocupado' && cama.paciente" class="paciente-info">
                  <q-separator class="q-my-sm" />
                  <p class="paciente-nombre">{{ cama.paciente }}</p>
                  <p class="paciente-ci">CI: {{ cama.ci }}</p>
                </div>
              </q-card-section>

              <q-card-actions align="center" class="q-pa-sm">
                <q-btn flat size="sm" icon="edit" @click="editCama(cama)"> Editar </q-btn>
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Añadir Sala -->
    <q-dialog v-model="showAddSalaModal" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Nueva Sala</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeAddSalaModal" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveSala" class="q-gutter-md">
            <q-input
              v-model="salaForm.nombre"
              label="Nombre de la Sala"
              filled
              :rules="[(val) => !!val || 'El nombre es requerido']"
            />

            <q-input
              v-model="salaForm.descripcion"
              label="Descripción"
              filled
              :rules="[(val) => !!val || 'La descripción es requerida']"
            />

            <q-input
              v-model="salaForm.piso"
              label="Piso/Ala"
              filled
              :rules="[(val) => !!val || 'El piso es requerido']"
            />

            <q-input
              v-model.number="salaForm.capacidad"
              label="Capacidad de Camas"
              type="number"
              filled
              min="1"
              :rules="[(val) => val > 0 || 'Debe ser mayor a 0']"
            />

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn label="Cancelar" color="grey" flat @click="closeAddSalaModal" />
              <q-btn label="Guardar" color="primary" type="submit" :loading="saving" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Modal Añadir Cama -->
    <q-dialog v-model="showAddCamaModal" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Nueva Cama - {{ selectedSala?.nombre }}</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeAddCamaModal" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveCama" class="q-gutter-md">
            <q-input
              v-model="camaForm.id"
              label="ID de la Cama"
              filled
              :rules="[(val) => !!val || 'El ID es requerido']"
            />

            <q-select
              v-model="camaForm.estado"
              :options="estadosCama"
              label="Estado"
              filled
              :rules="[(val) => !!val || 'El estado es requerido']"
            />

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn label="Cancelar" color="grey" flat @click="closeAddCamaModal" />
              <q-btn label="Guardar" color="secondary" type="submit" :loading="saving" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// Estado reactivo
const showSalaDetail = ref(false)
const selectedSala = ref(null)
const showAddSalaModal = ref(false)
const showAddCamaModal = ref(false)
const saving = ref(false)

const estadosCama = ['Disponible', 'Ocupado', 'Mantenimiento']

const pisos = ref([
  {
    nombre: 'Piso 1 - Cardiología',
    salas: [
      {
        id: '101',
        nombre: 'Sala 101',
        descripcion: 'Ala de Cardiología',
        camas: [
          { id: '101-A', estado: 'Disponible' },
          { id: '101-B', estado: 'Ocupado', paciente: 'Ana Gómez', ci: '1234567 LP' },
          { id: '101-C', estado: 'Mantenimiento' },
        ],
      },
      {
        id: '102',
        nombre: 'Sala 102',
        descripcion: 'Ala de Cardiología',
        camas: [
          { id: '102-A', estado: 'Disponible' },
          { id: '102-B', estado: 'Disponible' },
          { id: '102-C', estado: 'Ocupado', paciente: 'Juan Pérez', ci: '9876543 SC' },
          { id: '102-D', estado: 'Ocupado', paciente: 'Maria Luna', ci: '4567891 CB' },
          { id: '102-E', estado: 'Ocupado', paciente: 'Carlos Soliz', ci: '7891234 OR' },
        ],
      },
    ],
  },
  {
    nombre: 'Piso 2 - Neurología',
    salas: [
      {
        id: '205',
        nombre: 'Sala 205',
        descripción: 'Ala de Neurología',
        camas: [
          { id: '205-A', estado: 'Ocupado', paciente: 'Luisa Méndez', ci: '3216549 PT' },
          { id: '205-B', estado: 'Ocupado', paciente: 'Mario Durán', ci: '6549873 TJ' },
        ],
      },
    ],
  },
])

const salaForm = reactive({
  nombre: '',
  descripcion: '',
  piso: '',
  capacidad: 1,
})

const camaForm = reactive({
  id: '',
  estado: 'Disponible',
})

// Métodos
const getCamasDisponibles = (sala) => {
  return sala.camas.filter((cama) => cama.estado === 'Disponible').length
}

const getSalaStatus = (sala) => {
  const disponibles = getCamasDisponibles(sala)
  const total = sala.camas.length

  if (disponibles === 0) return 'Completa'
  if (disponibles === total) return 'Disponible'
  return 'Parcial'
}

const getSalaStatusColor = (sala) => {
  const status = getSalaStatus(sala)
  const colors = {
    Completa: 'negative',
    Parcial: 'warning',
    Disponible: 'positive',
  }
  return colors[status] || 'grey'
}

const getCamaStatusColor = (estado) => {
  const colors = {
    Disponible: 'positive',
    Ocupado: 'negative',
    Mantenimiento: 'warning',
  }
  return colors[estado] || 'grey'
}

const getCamaIconColor = (estado) => {
  const colors = {
    Disponible: 'positive',
    Ocupado: 'negative',
    Mantenimiento: 'warning',
  }
  return colors[estado] || 'grey'
}

const getCamaCardClass = (estado) => {
  const classes = {
    Disponible: 'cama-disponible',
    Ocupado: 'cama-ocupada',
    Mantenimiento: 'cama-mantenimiento',
  }
  return classes[estado] || ''
}

const verDetalleSala = (sala) => {
  selectedSala.value = sala
  showSalaDetail.value = true
}

const editCama = (cama) => {
  // Implementar edición de cama
  $q.notify({
    type: 'info',
    message: `Editando cama ${cama.id}`,
    position: 'top-right',
  })
}

const saveSala = async () => {
  saving.value = true

  try {
    // Crear camas automáticamente
    const camas = []
    for (let i = 1; i <= salaForm.capacidad; i++) {
      camas.push({
        id: `${salaForm.nombre.replace(/\s+/g, '')}-${String.fromCharCode(64 + i)}`,
        estado: 'Disponible',
      })
    }

    const nuevaSala = {
      id: Date.now().toString(),
      nombre: salaForm.nombre,
      descripcion: salaForm.descripcion,
      camas: camas,
    }

    // Buscar o crear el piso
    let piso = pisos.value.find((p) => p.nombre.includes(salaForm.piso))
    if (!piso) {
      piso = {
        nombre: salaForm.piso,
        salas: [],
      }
      pisos.value.push(piso)
    }

    piso.salas.push(nuevaSala)

    $q.notify({
      type: 'positive',
      message: 'Sala creada correctamente',
      position: 'top-right',
      icon: 'check_circle',
    })

    closeAddSalaModal()
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Error al crear la sala',
      position: 'top-right',
      icon: 'error',
    })
  } finally {
    saving.value = false
  }
}

const saveCama = async () => {
  saving.value = true

  try {
    selectedSala.value.camas.push({
      id: camaForm.id,
      estado: camaForm.estado,
    })

    $q.notify({
      type: 'positive',
      message: 'Cama añadida correctamente',
      position: 'top-right',
      icon: 'check_circle',
    })

    closeAddCamaModal()
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Error al añadir la cama',
      position: 'top-right',
      icon: 'error',
    })
  } finally {
    saving.value = false
  }
}

const closeAddSalaModal = () => {
  showAddSalaModal.value = false
  salaForm.nombre = ''
  salaForm.descripcion = ''
  salaForm.piso = ''
  salaForm.capacidad = 1
}

const closeAddCamaModal = () => {
  showAddCamaModal.value = false
  camaForm.id = ''
  camaForm.estado = 'Disponible'
}
</script>

<style scoped>
.salas-container {
  min-height: 400px;
}

.salas-header,
.detail-header {
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1976d2;
}

.section-subtitle {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.salas-content,
.camas-content {
  background: #fafafa;
  min-height: 300px;
}

.piso-section {
  margin-bottom: 40px;
}

.piso-title {
  margin: 0 0 16px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #424242;
  padding-bottom: 8px;
  border-bottom: 2px solid #e0e0e0;
}

.sala-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
}

.sala-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.sala-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1976d2;
}

.sala-description {
  margin: 8px 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.sala-stats {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1976d2;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
}

.cama-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  height: 100%;
}

.cama-disponible {
  border-left: 4px solid #4caf50;
}

.cama-ocupada {
  border-left: 4px solid #f44336;
}

.cama-mantenimiento {
  border-left: 4px solid #ff9800;
}

.cama-id {
  margin: 8px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #424242;
}

.paciente-info {
  background: #ffebee;
  border-radius: 8px;
  padding: 8px;
  margin-top: 8px;
}

.paciente-nombre {
  margin: 0 0 4px 0;
  font-weight: 600;
  color: #d32f2f;
  font-size: 0.85rem;
}

.paciente-ci {
  margin: 0;
  color: #666;
  font-size: 0.8rem;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.add-button {
  border-radius: 8px;
  font-weight: 600;
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .salas-header .row,
  .detail-header .row {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .section-title {
    font-size: 1.3rem;
  }

  .piso-title {
    font-size: 1.1rem;
  }
}

@media (min-width: 1024px) {
  .section-title {
    font-size: 1.7rem;
  }

  .piso-title {
    font-size: 1.3rem;
  }
}
</style>
