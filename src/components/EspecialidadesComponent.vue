<template>
  <div class="q-pa-md">
    <div class="row q-col-gutter-md">
      <div
        v-for="especialidad in especialidades"
        :key="especialidad.id"
        class="col-12 col-sm-6 col-md-4 col-lg-2-5"
      >
        <q-card
          flat
          bordered
          class="especialidad-card square-card"
          :class="{ 'status-inactivo': especialidad.estado === 'inactivo' }"
        >
          <q-card-section class="q-pa-md text-center flex flex-center column full-height">
            <q-icon
              :name="especialidad.estado === 'activo' ? 'medical_services' : 'medical_mask'"
              size="xl"
              :color="especialidad.estado === 'activo' ? 'primary' : 'grey-5'"
            />
            <div class="text-h6 q-mt-sm">{{ especialidad.nombre }}</div>
            <div class="text-caption text-grey-8">{{ especialidad.descripcion }}</div>
            <div
              class="text-caption text-bold q-mt-sm"
              :class="{
                'text-positive': especialidad.estado === 'activo',
                'text-negative': especialidad.estado === 'inactivo',
              }"
            >
              {{ especialidad.estado === 'activo' ? 'Activo' : 'Inactivo' }}
            </div>
          </q-card-section>

          <q-card-actions align="center" class="bg-gradient-primary text-white">
            <q-btn
              dense
              round
              flat
              icon="edit"
              color="warning"
              @click="openEditDialog(especialidad)"
            />
            <q-btn
              dense
              round
              flat
              :icon="especialidad.estado === 'activo' ? 'block' : 'check'"
              :color="especialidad.estado === 'activo' ? 'negative' : 'positive'"
              @click="toggleEstado(especialidad)"
            />
          </q-card-actions>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-4 col-lg-2-5">
        <q-card
          flat
          bordered
          class="add-especialidad-card cursor-pointer square-card"
          @click="openAddDialog"
        >
          <q-card-section class="text-center q-pa-lg flex flex-center column full-height">
            <q-icon name="add_circle_outline" size="lg" color="primary" />
            <div class="q-mt-sm text-primary text-weight-bold">Añadir Especialidad</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="dialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            {{ especialidadForm.id ? 'Editar Especialidad' : 'Añadir Especialidad' }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="especialidadForm.nombre"
            label="Nombre"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-input
            v-model="especialidadForm.descripcion"
            label="Descripción"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-select
            v-model="especialidadForm.estado"
            :options="['activo', 'inactivo']"
            label="Estado"
            outlined
            dense
            class="q-mb-sm"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" v-close-popup />
          <q-btn flat label="Guardar" color="primary" @click="saveEspecialidad" />
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

const especialidades = ref([])
const dialog = ref(false)

const especialidadForm = reactive({
  id: null,
  nombre: '',
  descripcion: '',
  estado: 'activo',
  hospital_id: 1,
})

const fetchEspecialidades = async () => {
  try {
    const { data } = await api.get('/especialidades')
    especialidades.value = data
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Error al cargar especialidades' })
  }
}

const openAddDialog = () => {
  Object.assign(especialidadForm, {
    id: null,
    nombre: '',
    descripcion: '',
    estado: 'activo',
    hospital_id: 1,
  })
  dialog.value = true
}

const openEditDialog = (especialidad) => {
  Object.assign(especialidadForm, especialidad)
  dialog.value = true
}

const saveEspecialidad = async () => {
  if (!especialidadForm.nombre || !especialidadForm.descripcion) {
    $q.notify({ type: 'negative', message: 'Completa todos los campos' })
    return
  }
  try {
    const payload = {
      nombre: especialidadForm.nombre,
      descripcion: especialidadForm.descripcion,
      estado: especialidadForm.estado.toLowerCase(),
      hospital_id: especialidadForm.hospital_id,
    }
    if (especialidadForm.id) {
      await api.put(`/especialidades/${especialidadForm.id}`, payload)
      $q.notify({ type: 'positive', message: 'Especialidad actualizada correctamente' })
    } else {
      await api.post('/especialidades', payload)
      $q.notify({ type: 'positive', message: 'Especialidad creada correctamente' })
    }
    dialog.value = false
    await fetchEspecialidades()
  } catch (error) {
    console.error('Error al guardar especialidad:', error.response?.data || error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al guardar especialidad',
    })
  }
}

const toggleEstado = async (especialidad) => {
  try {
    const newEstado = especialidad.estado === 'activo' ? 'inactivo' : 'activo'
    await api.put(`/especialidades/${especialidad.id}`, { ...especialidad, estado: newEstado })
    await fetchEspecialidades()
    $q.notify({
      type: 'positive',
      message: `Especialidad ${newEstado} correctamente`,
    })
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Error al cambiar estado' })
  }
}

onMounted(() => {
  fetchEspecialidades()
})
</script>

<style scoped>
/*
  Clase personalizada para las columnas que permite 5 tarjetas por fila en escritorio
*/
.col-lg-2-5 {
  width: 20%;
}
@media (max-width: 1439px) {
  .col-lg-2-5 {
    width: 33.3333%;
  }
}
@media (max-width: 1023px) {
  .col-lg-2-5 {
    width: 50%;
  }
}
@media (max-width: 599px) {
  .col-lg-2-5 {
    width: 100%;
  }
}

.especialidad-card,
.add-especialidad-card {
  border-radius: 12px;
  min-height: 200px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  cursor: pointer;
  height: 100%;
  aspect-ratio: 1 / 1;
}

.especialidad-card:hover,
.add-especialidad-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.add-especialidad-card {
  border: 2px dashed #14b8a6;
  color: #14b8a6;
  opacity: 0.8;
  display: flex;
  justify-content: center;
  align-items: center;
}

.add-especialidad-card:hover {
  opacity: 1;
}

.status-inactivo {
  background-color: #ffebee;
}

.square-card {
  display: flex;
  flex-direction: column;
}
.square-card .q-card-section {
  flex-grow: 1;
}

/* 📌 Estilos para los inputs del modal */
.q-input:focus-within :deep(.q-field__label),
.q-select:focus-within :deep(.q-field__label) {
  color: #14b8a6 !important;
}
.q-input:focus-within :deep(.q-field__control) {
  border-color: #14b8a6 !important;
  box-shadow: 0 4px 16px rgba(20, 184, 166, 0.3);
}

/* Degradado para las acciones de la tarjeta */
.bg-gradient-primary {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%) !important;
}
</style>
