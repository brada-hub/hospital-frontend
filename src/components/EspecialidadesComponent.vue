<template>
  <div class="q-pa-md">
    <!-- Botón para añadir nueva especialidad -->
    <q-btn
      color="primary"
      label="Añadir especialidad"
      icon="add"
      class="q-mb-md add-button"
      @click="abrirModalAgregar"
    />

    <!-- Lista de especialidades -->
    <q-card
      v-for="especialidad in especialidades"
      :key="especialidad.id"
      class="q-mb-md especialidad-card"
    >
      <q-card-section class="row items-center justify-between">
        <div class="row items-center">
          <!-- Ícono dinámico -->
          <q-icon
            :name="getEspecialidadIcon(especialidad.nombre)"
            size="md"
            color="primary"
            class="q-mr-sm"
          />
          <div>
            <div class="text-h6">{{ especialidad.nombre }}</div>
            <div class="text-caption text-grey">{{ especialidad.descripcion }}</div>
          </div>
        </div>

        <!-- Botón editar -->
        <q-btn dense flat icon="edit" color="secondary" @click="abrirModalEditar(especialidad)" />
      </q-card-section>

      <q-card-section>
        <q-badge color="green" v-if="especialidad.estado === 'activo'"> Activo </q-badge>
        <q-badge color="red" v-else> Inactivo </q-badge>
      </q-card-section>
    </q-card>

    <!-- Estado vacío -->
    <div v-if="especialidades.length === 0" class="empty-state">
      <q-icon name="medical_services" size="64px" color="grey" />
      <p class="text-grey q-mt-md">No hay especialidades registradas</p>
    </div>

    <!-- Modal Añadir / Editar -->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ isEditar ? 'Editar Especialidad' : 'Nueva Especialidad' }}</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="form.nombre" label="Nombre" outlined dense />
          <q-input
            v-model="form.descripcion"
            label="Descripción"
            outlined
            dense
            type="textarea"
            class="q-mt-sm"
          />
          <q-select
            v-model="form.estado"
            :options="['activo', 'inactivo']"
            label="Estado"
            outlined
            dense
            class="q-mt-sm"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup @click="cancelarModal" />
          <q-btn color="primary" label="Guardar" @click="guardarEspecialidad" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useEspecialidadStore } from 'src/stores/especialidad'

const props = defineProps({
  hospitalId: {
    type: Number,
    required: true,
  },
})

const especialidadStore = useEspecialidadStore()
const especialidades = computed(() => especialidadStore.especialidades)

// Modal y formulario
const showDialog = ref(false)
const isEditar = ref(false)
const form = ref({
  id: null,
  nombre: '',
  descripcion: '',
  estado: 'activo',
  hospital_id: props.hospitalId,
})

// Función íconos
const getEspecialidadIcon = (nombre) => {
  if (!nombre) return 'medical_services'
  switch (nombre.toLowerCase()) {
    case 'cardiología':
      return 'favorite'
    case 'pediatría':
      return 'child_care'
    case 'traumatología':
      return 'accessible'
    default:
      return 'medical_services'
  }
}

// Cargar especialidades por hospitalId
const cargarEspecialidades = () => {
  if (props.hospitalId) especialidadStore.fetchEspecialidades(props.hospitalId)
}

// Abrir modal añadir
const abrirModalAgregar = () => {
  form.value = {
    id: null,
    nombre: '',
    descripcion: '',
    estado: 'activo',
    hospital_id: props.hospitalId,
  }
  isEditar.value = false
  showDialog.value = true
}

// Abrir modal editar
const abrirModalEditar = (especialidad) => {
  form.value = { ...especialidad }
  isEditar.value = true
  showDialog.value = true
}

// Cancelar modal
const cancelarModal = () => {
  showDialog.value = false
}

// Guardar especialidad
const guardarEspecialidad = async () => {
  try {
    if (isEditar.value) {
      await especialidadStore.updateEspecialidad(form.value.id, form.value)
    } else {
      await especialidadStore.addEspecialidad(form.value)
    }
    cargarEspecialidades()
    showDialog.value = false
  } catch (err) {
    console.error('Error al guardar especialidad:', err)
  }
}

// Recargar al cambiar hospital
watch(
  () => props.hospitalId,
  () => cargarEspecialidades(),
)
onMounted(() => cargarEspecialidades())
</script>

<style scoped>
.especialidad-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}
.especialidad-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}
.empty-state {
  text-align: center;
  padding: 60px 20px;
}
.add-button {
  border-radius: 8px;
  font-weight: 600;
}
</style>
