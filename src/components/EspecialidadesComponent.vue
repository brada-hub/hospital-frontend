<template>
  <div class="especialidades-container">
    <!-- Header -->
    <div class="especialidades-header">
      <div class="row items-center justify-between q-pa-lg">
        <div class="col-auto">
          <h5 class="section-title">Especialidades Médicas</h5>
          <p class="section-subtitle">Gestiona las especialidades disponibles en el hospital</p>
        </div>
        <div class="col-auto">
          <q-btn
            label="Añadir Especialidad"
            color="primary"
            icon="add"
            @click="showAddModal = true"
            class="add-button"
          />
        </div>
      </div>
    </div>

    <!-- Grid de Especialidades -->
    <div class="especialidades-content q-pa-lg">
      <div class="row q-col-gutter-md">
        <div
          v-for="especialidad in especialidades"
          :key="especialidad.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <q-card class="especialidad-card" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="flex items-center q-mb-sm">
                <q-icon
                  :name="getEspecialidadIcon(especialidad.nombre)"
                  size="32px"
                  color="primary"
                  class="q-mr-sm"
                />
                <div>
                  <h6 class="especialidad-title">{{ especialidad.nombre }}</h6>
                  <div class="especialidad-stats">
                    <q-chip size="sm" color="positive" text-color="white">
                      {{ especialidad.doctores || 0 }} Doctores
                    </q-chip>
                  </div>
                </div>
              </div>
              <p class="especialidad-description">{{ especialidad.descripcion }}</p>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md q-pt-none">
              <q-btn
                flat
                color="primary"
                icon="edit"
                size="sm"
                @click="editEspecialidad(especialidad)"
              >
                Editar
              </q-btn>
              <q-btn
                flat
                color="negative"
                icon="delete"
                size="sm"
                @click="deleteEspecialidad(especialidad.id)"
              >
                Eliminar
              </q-btn>
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-if="especialidades.length === 0" class="empty-state">
        <q-icon name="medical_services" size="64px" color="grey-4" />
        <h6 class="text-grey-6 q-mt-md">No hay especialidades registradas</h6>
        <p class="text-grey-5">Comienza agregando la primera especialidad médica</p>
        <q-btn
          label="Añadir Primera Especialidad"
          color="primary"
          @click="showAddModal = true"
          class="q-mt-md"
        />
      </div>
    </div>

    <!-- Modal para Añadir/Editar Especialidad -->
    <q-dialog v-model="showAddModal" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ editingEspecialidad ? 'Editar Especialidad' : 'Nueva Especialidad' }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeModal" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveEspecialidad" class="q-gutter-md">
            <q-input
              v-model="especialidadForm.nombre"
              label="Nombre de la Especialidad"
              filled
              :rules="[(val) => !!val || 'El nombre es requerido']"
            >
              <template v-slot:prepend>
                <q-icon name="medical_services" />
              </template>
            </q-input>

            <q-input
              v-model="especialidadForm.descripcion"
              label="Descripción"
              type="textarea"
              rows="3"
              filled
              :rules="[(val) => !!val || 'La descripción es requerida']"
            >
              <template v-slot:prepend>
                <q-icon name="description" />
              </template>
            </q-input>

            <q-input
              v-model.number="especialidadForm.doctores"
              label="Número de Doctores"
              type="number"
              filled
              min="0"
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn label="Cancelar" color="grey" flat @click="closeModal" />
              <q-btn label="Guardar" color="primary" type="submit" :loading="saving" />
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
const especialidades = ref([
  {
    id: 1,
    nombre: 'Cardiología',
    descripcion:
      'Especialidad médica que se encarga del estudio, diagnóstico y tratamiento de las enfermedades del corazón y del aparato circulatorio.',
    doctores: 5,
  },
  {
    id: 2,
    nombre: 'Neurología',
    descripcion:
      'Especialidad médica que trata los trastornos del sistema nervioso central, periférico y autónomo.',
    doctores: 3,
  },
  {
    id: 3,
    nombre: 'Pediatría',
    descripcion:
      'Especialidad médica que involucra la atención médica de bebés, niños y adolescentes.',
    doctores: 4,
  },
])

const showAddModal = ref(false)
const editingEspecialidad = ref(null)
const saving = ref(false)

const especialidadForm = reactive({
  nombre: '',
  descripcion: '',
  doctores: 0,
})

// Métodos
const getEspecialidadIcon = (nombre) => {
  const iconMap = {
    Cardiología: 'favorite',
    Neurología: 'psychology',
    Pediatría: 'child_care',
    Traumatología: 'healing',
    Ginecología: 'pregnant_woman',
    Dermatología: 'face',
    Oftalmología: 'visibility',
    Otorrinolaringología: 'hearing',
  }
  return iconMap[nombre] || 'medical_services'
}

const editEspecialidad = (especialidad) => {
  editingEspecialidad.value = especialidad
  especialidadForm.nombre = especialidad.nombre
  especialidadForm.descripcion = especialidad.descripcion
  especialidadForm.doctores = especialidad.doctores || 0
  showAddModal.value = true
}

const deleteEspecialidad = (id) => {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: '¿Estás seguro de que deseas eliminar esta especialidad?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    const index = especialidades.value.findIndex((e) => e.id === id)
    if (index > -1) {
      especialidades.value.splice(index, 1)
      $q.notify({
        type: 'positive',
        message: 'Especialidad eliminada correctamente',
        position: 'top-right',
        icon: 'check_circle',
      })
    }
  })
}

const saveEspecialidad = async () => {
  saving.value = true

  try {
    if (editingEspecialidad.value) {
      // Editar especialidad existente
      const index = especialidades.value.findIndex((e) => e.id === editingEspecialidad.value.id)
      if (index > -1) {
        especialidades.value[index] = {
          ...especialidades.value[index],
          nombre: especialidadForm.nombre,
          descripcion: especialidadForm.descripcion,
          doctores: especialidadForm.doctores,
        }
      }
      $q.notify({
        type: 'positive',
        message: 'Especialidad actualizada correctamente',
        position: 'top-right',
        icon: 'check_circle',
      })
    } else {
      // Crear nueva especialidad
      const newId = Math.max(...especialidades.value.map((e) => e.id)) + 1
      especialidades.value.push({
        id: newId,
        nombre: especialidadForm.nombre,
        descripcion: especialidadForm.descripcion,
        doctores: especialidadForm.doctores,
      })
      $q.notify({
        type: 'positive',
        message: 'Especialidad creada correctamente',
        position: 'top-right',
        icon: 'check_circle',
      })
    }

    closeModal()
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Error al guardar la especialidad',
      position: 'top-right',
      icon: 'error',
    })
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingEspecialidad.value = null
  especialidadForm.nombre = ''
  especialidadForm.descripcion = ''
  especialidadForm.doctores = 0
}
</script>

<style scoped>
.especialidades-container {
  min-height: 400px;
}

.especialidades-header {
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

.especialidades-content {
  background: #fafafa;
  min-height: 300px;
}

.especialidad-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  height: 100%;
}

.especialidad-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.especialidad-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1976d2;
}

.especialidad-stats {
  margin-top: 4px;
}

.especialidad-description {
  margin: 12px 0 0 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
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
  .especialidades-header .row {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .section-title {
    font-size: 1.3rem;
  }
}

@media (min-width: 1024px) {
  .section-title {
    font-size: 1.7rem;
  }
}
</style>
