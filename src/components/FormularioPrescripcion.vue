<template>
  <q-card class="styled-card" flat bordered>
    <q-card-section>
      <div class="text-h6 text-primary">
        <q-icon name="medical_services" class="q-mr-sm" />
        Prescribir Tratamiento
      </div>
      <div class="text-subtitle2 text-grey-7">Para la Internación #{{ internacionId }}</div>
    </q-card-section>

    <q-separator />

    <div class="q-gutter-y-md q-pt-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              outlined
              v-model="tratamientoForm.tipo"
              label="Tipo de Tratamiento *"
              lazy-rules
              :rules="[(val) => !!val || 'El tipo es requerido']"
            >
              <template v-slot:prepend><q-icon name="category" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-input
              outlined
              v-model="tratamientoForm.descripcion"
              label="Descripción / Diagnóstico *"
              lazy-rules
              :rules="[(val) => !!val || 'La descripción es requerida']"
            >
              <template v-slot:prepend><q-icon name="description" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-input
              outlined
              v-model="tratamientoForm.fecha_inicio"
              label="Fecha y Hora de Inicio *"
            >
              <template v-slot:prepend>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="tratamientoForm.fecha_inicio" mask="yyyy-MM-dd HH:mm" />
                  </q-popup-proxy>
                </q-icon>
              </template>
              <template v-slot:append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time
                      v-model="tratamientoForm.fecha_inicio"
                      mask="yyyy-MM-dd HH:mm"
                      format24h
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-input outlined v-model="tratamientoForm.fecha_fin" label="Fecha y Hora de Fin *">
              <template v-slot:prepend>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="tratamientoForm.fecha_fin"
                      mask="yyyy-MM-dd HH:mm"
                      :options="
                        (date) =>
                          date >= tratamientoForm.fecha_inicio.substring(0, 10).replace(/-/g, '/')
                      "
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
              <template v-slot:append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="tratamientoForm.fecha_fin" mask="yyyy-MM-dd HH:mm" format24h />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-subtitle1 text-grey-8 q-mb-md section-title">
          <q-icon name="medication" />
          <span>Receta de Medicamentos</span>
        </div>
        <div class="row items-start q-col-gutter-md">
          <div class="col-12 col-md-8">
            <q-select
              outlined
              v-model="medicamentoSeleccionado"
              use-input
              hide-selected
              fill-input
              input-debounce="400"
              label="Buscar medicamento en catálogo..."
              :options="opcionesFiltradas"
              @filter="filtrarMedicamentos"
              option-value="id"
              option-label="nombre"
              emit-value
              map-options
            >
              <template v-slot:prepend><q-icon name="search" /></template>
              <template v-slot:no-option>
                <q-item
                  ><q-item-section class="text-grey"
                    >No se encontraron resultados</q-item-section
                  ></q-item
                >
              </template>
            </q-select>
          </div>
          <div class="col-12 col-md-4">
            <q-btn
              label="Añadir"
              icon="add"
              color="secondary"
              class="full-width q-py-md"
              :disable="!medicamentoSeleccionado"
              @click="agregarReceta"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-section v-if="recetas.length > 0" class="q-pt-none">
        <q-list bordered separator class="rounded-borders">
          <q-item-label header class="bg-grey-2"
            >Medicamentos Prescritos ({{ recetas.length }})</q-item-label
          >
          <q-item v-for="(receta, index) in recetas" :key="receta.medicamento_id" class="q-py-md">
            <q-item-section>
              <q-item-label class="text-weight-medium text-subtitle1">{{
                getMedicamentoNombre(receta.medicamento_id)
              }}</q-item-label>
              <div class="row q-col-gutter-sm q-mt-xs">
                <div class="col-12 col-sm-6">
                  <q-input
                    dense
                    outlined
                    v-model="receta.concentracion"
                    label="Dosis/Concentración *"
                    :rules="[(val) => !!val || 'Requerido']"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    dense
                    outlined
                    v-model="receta.frecuencia_medica"
                    label="Frecuencia *"
                    :rules="[(val) => !!val || 'Requerido']"
                  />
                </div>
              </div>
            </q-item-section>
            <q-item-section side>
              <q-btn flat dense round icon="delete" color="negative" @click="quitarReceta(index)">
                <q-tooltip>Quitar</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-section v-else>
        <div class="empty-state">
          <q-icon name="pill" size="4em" color="grey-5" />
          <p class="text-grey-7">Aún no se han añadido medicamentos a la receta.</p>
        </div>
      </q-card-section>

      <q-separator spaced />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          label="Guardar Tratamiento"
          @click="onSubmit"
          color="positive"
          unelevated
          icon="save"
          :loading="submitting"
          :disable="recetas.length === 0"
        />
      </q-card-actions>
    </div>
  </q-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { format, addDays } from 'date-fns'

const props = defineProps({
  internacionId: {
    type: [Number, String],
    required: true,
  },
})

const emit = defineEmits(['tratamientoGuardado'])
const $q = useQuasar()

const tratamientoForm = reactive({
  internacion_id: props.internacionId,
  tipo: '',
  descripcion: '',
  // ❗️ CORRECCIÓN APLICADA AQUÍ ❗️
  fecha_inicio: format(new Date(), 'yyyy-MM-dd HH:mm'),
  fecha_fin: format(addDays(new Date(), 7), 'yyyy-MM-dd HH:mm'),
  observaciones: '',
})

const recetas = ref([])
const catalogoMedicamentos = ref([])
const opcionesFiltradas = ref([])
const medicamentoSeleccionado = ref(null)
const submitting = ref(false)

onMounted(async () => {
  try {
    const response = await api.get('/medicamentos')
    catalogoMedicamentos.value = response.data
  } catch (error) {
    console.error('Error al cargar catálogo:', error)
    $q.notify({ color: 'negative', message: 'No se pudo cargar el catálogo de medicamentos.' })
  }
})

function filtrarMedicamentos(val, update) {
  if (!val) {
    update(() => {
      opcionesFiltradas.value = catalogoMedicamentos.value.slice(0, 20)
    })
    return
  }
  update(() => {
    const needle = val.toLowerCase()
    opcionesFiltradas.value = catalogoMedicamentos.value.filter((v) =>
      v.nombre.toLowerCase().includes(needle),
    )
  })
}

function agregarReceta() {
  if (!medicamentoSeleccionado.value) return
  if (recetas.value.some((r) => r.medicamento_id === medicamentoSeleccionado.value)) {
    $q.notify({ color: 'warning', message: 'Este medicamento ya ha sido añadido.' })
    return
  }
  recetas.value.push({
    medicamento_id: medicamentoSeleccionado.value,
    concentracion: '',
    frecuencia_medica: '',
  })
  medicamentoSeleccionado.value = null
}

function quitarReceta(index) {
  recetas.value.splice(index, 1)
}

function getMedicamentoNombre(id) {
  const med = catalogoMedicamentos.value.find((m) => m.id === id)
  return med ? med.nombre : 'Desconocido'
}

async function onSubmit() {
  submitting.value = true
  try {
    const payload = { ...tratamientoForm, recetas: recetas.value }
    const response = await api.post('/tratamientos', payload)
    $q.notify({
      color: 'positive',
      message: response.data.message || 'Tratamiento guardado con éxito',
      icon: 'check_circle',
    })
    emit('tratamientoGuardado', response.data.data)
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error al guardar el tratamiento.'
    $q.notify({ color: 'negative', message: errorMessage, icon: 'report_problem' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.styled-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #555;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
}
</style>
