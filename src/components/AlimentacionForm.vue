<template>
  <q-card>
    <q-card-section class="bg-teal-1 text-teal-9">
      <div class="text-h6 flex items-center">
        <q-icon name="restaurant_menu" class="q-mr-sm" />
        Alimentación
      </div>
    </q-card-section>

    <q-card-section>
      <q-form @submit="onSubmit" @validation-error="onValidationError" ref="formRef" class="q-gutter-md">
        <!-- Tipo de Dieta -->
        <q-select
          v-model="form.tipo_dieta_id"
          :options="tiposDieta"
          option-value="id"
          option-label="nombre"
          emit-value
          map-options
          label="Tipo de Dieta"
          outlined
          dense
          color="teal"
          :rules="[(val) => !!val || 'Campo requerido']"
        >
          <template v-slot:prepend>
            <q-icon name="local_dining" color="teal" />
          </template>
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.nombre }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Vía de Administración -->
        <q-select
          v-model="form.via_administracion"
          :options="['Oral', 'Enteral', 'Parenteral']"
          label="Vía de Administración"
          outlined
          dense
          color="teal"
          :rules="[(val) => !!val || 'Campo requerido']"
        >
            <template v-slot:prepend>
            <q-icon name="alt_route" color="teal" />
          </template>
        </q-select>

        <!-- Frecuencia (1-5 tiempos) -->
        <q-select
          v-model="form.frecuencia_tiempos"
          :options="[1, 2, 3, 4, 5]"
          label="Frecuencia (Número de tiempos)"
          outlined
          dense
          color="teal"
          :rules="[(val) => !!val || 'Campo requerido']"
          @update:model-value="onFrecuenciaChange"
        >
            <template v-slot:prepend>
            <q-icon name="access_time" color="teal" />
          </template>
        </q-select>

        <!-- Tiempos de Comida Dinámicos -->
        <div v-if="form.frecuencia_tiempos" class="q-gutter-sm">
          <div class="text-subtitle2 q-mb-sm text-teal">Distribución de Tiempos de Comida</div>

          <div
            v-for="(tiempo, index) in tiemposComida"
            :key="index"
            class="q-pa-sm bg-teal-50 rounded-borders"
            style="border: 1px solid #ccfbf1"
          >
            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-md-4">
                <q-input
                  :model-value="tiempo.tiempo_comida"
                  label="Tiempo de Comida"
                  outlined
                  dense
                  readonly
                  filled
                  color="teal"
                />
              </div>
              <div class="col-12 col-md-8">
                <q-input
                  v-model="tiempo.descripcion"
                  label="Descripción de lo que se dará"
                  outlined
                  dense
                  color="teal"
                  placeholder="Ej: Leche materna, papilla de frutas, etc."
                  :rules="[(val) => !!val || 'Describa qué se dará en este tiempo']"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Restricciones -->
        <q-input
          v-model="form.restricciones"
          label="Restricciones (Ej: Sin azúcares añadidos, sin frituras)"
          type="textarea"
          outlined
          dense
          rows="2"
          color="teal"
        >
            <template v-slot:prepend>
            <q-icon name="block" color="teal" />
          </template>
        </q-input>

        <!-- Descripción/Observaciones -->
        <q-input
          v-model="form.descripcion"
          label="Observaciones Médicas"
          type="textarea"
          outlined
          dense
          rows="3"
          color="teal"
          :rules="[(val) => !!val || 'Campo requerido']"
        >
            <template v-slot:prepend>
            <q-icon name="note" color="teal" />
          </template>
        </q-input>

        <!-- Duración del Plan -->
        <div class="row q-col-gutter-sm items-center">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="form.duracion_dias"
              label="Duración (días)"
              type="number"
              min="1"
              max="365"
              outlined
              dense
              color="teal"
              hint="Ej: 7 días, 14 días, 30 días"
              :rules="[(val) => (val && val >= 1) || 'Mínimo 1 día']"
            >
              <template v-slot:prepend>
                <q-icon name="date_range" color="teal" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-8">
            <div class="text-caption text-grey-7 q-pa-sm bg-grey-2 rounded-borders">
              <q-icon name="info" class="q-mr-xs" />
              <strong>Inicio:</strong> Hoy ({{ fechaHoyFormateada }}) →
              <strong>Fin:</strong> {{ fechaFinCalculada }}
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="row q-gutter-sm justify-end">
          <q-btn label="Cancelar" color="grey" flat @click="$emit('cancel')" />
          <q-btn label="Guardar" type="submit" color="teal" :loading="loading" icon="save" />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

const props = defineProps({
  alimentacion: {
    type: Object,
    default: null,
  },
  internacionId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['saved', 'cancel'])
const $q = useQuasar()
const loading = ref(false)
const tiposDieta = ref([])

// Mapeo de frecuencia a tiempos de comida (deben coincidir con backend validation)
const tiemposMap = {
  1: ['Almuerzo'],
  2: ['Desayuno', 'Cena'],
  3: ['Desayuno', 'Almuerzo', 'Cena'],
  4: ['Desayuno', 'Almuerzo', 'Merienda PM', 'Cena'],
  5: ['Desayuno', 'Merienda AM', 'Almuerzo', 'Merienda PM', 'Cena'],
}

const form = ref({
  tipo_dieta_id: props.alimentacion?.tipo_dieta_id || null,
  via_administracion: props.alimentacion?.via_administracion || 'Oral',
  frecuencia_tiempos: props.alimentacion?.frecuencia_tiempos || null,
  restricciones: props.alimentacion?.restricciones || '',
  descripcion: props.alimentacion?.descripcion || '',
  duracion_dias: calcularDuracionDias(props.alimentacion) || 7, // Default 7 días
})

// Calcular duración en días desde fechas existentes
function calcularDuracionDias(alimentacion) {
  if (!alimentacion?.fecha_inicio || !alimentacion?.fecha_fin) return null
  const inicio = new Date(alimentacion.fecha_inicio)
  const fin = new Date(alimentacion.fecha_fin)
  const diffTime = Math.abs(fin - inicio)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Computed para mostrar fecha de hoy
const fechaHoyFormateada = computed(() => {
  const hoy = new Date()
  return hoy.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
})

// Computed para calcular y mostrar fecha de fin
const fechaFinCalculada = computed(() => {
  if (!form.value.duracion_dias) return 'Seleccione duración'
  const fin = new Date()
  fin.setDate(fin.getDate() + form.value.duracion_dias)
  return fin.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
})

const tiemposComida = ref([])

async function loadTiposDieta() {
  try {
    const response = await api.get('/tipos-dieta')
    tiposDieta.value = response.data
  } catch (error) {
    console.error('Error al cargar tipos de dieta:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar tipos de dieta',
    })
  }
}

// <CHANGE> Inicializar tiempos desde la relación 'tiempos' del backend
const initializeTiemposComida = () => {
  if (props.alimentacion?.frecuencia_tiempos && props.alimentacion?.tiempos) {
    // Mapear desde la estructura de la base de datos relacional
    tiemposComida.value = props.alimentacion.tiempos.map((t) => ({
      tiempo_comida: t.tiempo_comida,
      descripcion: t.descripcion || '',
    }))
  } else if (form.value.frecuencia_tiempos) {
    generarTiemposComida(form.value.frecuencia_tiempos)
  }
}

function generarTiemposComida(frecuencia) {
  const tiempos = tiemposMap[frecuencia] || []
  const tiemposAnteriores = tiemposComida.value.reduce((acc, t) => {
    acc[t.tiempo_comida] = t.descripcion
    return acc
  }, {})

  // <CHANGE> Usar 'tiempo_comida' en lugar de 'tiempo' para coincidir con el backend
  tiemposComida.value = tiempos.map((tiempo) => ({
    tiempo_comida: tiempo,
    descripcion: tiemposAnteriores[tiempo] || '',
  }))
}

function onFrecuenciaChange(newFrecuencia) {
  generarTiemposComida(newFrecuencia)
}

// Calcular fecha de fin basada en duración en días
function calcularFechaFin() {
  const fin = new Date()
  fin.setDate(fin.getDate() + (form.value.duracion_dias || 7))
  return fin
}

const formRef = ref(null)

async function onSubmit() {
  // Nota: La validación de los campos q-input/q-select se hace automáticamente al enviar
  // pero la validación manual de tiempos de comida la hacemos aquí.

  // Validar que todos los tiempos tengan descripción
  const tiemposSinDescripcion = tiemposComida.value.filter((t) => !t.descripcion)
  if (tiemposSinDescripcion.length > 0) {
    $q.notify({
      type: 'warning',
      message: 'Por favor complete la descripción de todos los tiempos de comida',
    })
    // Scroll al área de tiempos
    const tiemposElement = document.querySelector('.text-subtitle2.q-mb-sm.text-teal')
    if (tiemposElement) {
       tiemposElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  // Si hay algún error de validación nativo de Quasar (rules),
  // el submit no se dispara si usamos @submit en q-form.
  // Pero si se dispara, asumimos que los rules pasaron o need to check manual.

  loading.value = true

  try {
    const data = {
      internacion_id: props.internacionId,
      tipo_dieta_id: form.value.tipo_dieta_id,
      via_administracion: form.value.via_administracion,
      frecuencia_tiempos: form.value.frecuencia_tiempos,
      tiempos: tiemposComida.value,
      restricciones: form.value.restricciones,
      descripcion: form.value.descripcion,
      fecha_inicio: new Date().toISOString(),
      fecha_fin: calcularFechaFin().toISOString(),
    }

    if (props.alimentacion) {
      await api.put(`/alimentaciones/${props.alimentacion.id}`, data)
      // Eliminamos la notificación duplicada aquí
    } else {
      await api.post('/alimentaciones', data)
      // Eliminamos la notificación duplicada aquí
    }

    emit('saved')
  } catch (error) {
    console.error('Error:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al guardar la alimentación',
    })
  } finally {
    loading.value = false
  }
}

function onValidationError(ref) {
  // Esta función se puede usar si enlazamos el evento @validation-error en q-form
  if (ref) {
    ref.$el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

onMounted(() => {
  loadTiposDieta()
  initializeTiemposComida()
})
</script>
