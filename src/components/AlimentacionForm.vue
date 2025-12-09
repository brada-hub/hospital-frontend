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
                <q-item-label caption>{{ scope.opt.descripcion }}</q-item-label>
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

        <!-- Fechas -->
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-6">
            <q-input
              v-model="form.fecha_inicio"
              label="Fecha de Inicio"
              type="datetime-local"
              outlined
              dense
              color="teal"
              :rules="[
                (val) => !!val || 'Campo requerido',
                validarFechaInicio
              ]"
            >
                <template v-slot:prepend>
                <q-icon name="event" color="teal" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="form.fecha_fin"
              label="Fecha de Fin"
              type="datetime-local"
              outlined
              dense
              color="teal"
              :rules="[
                (val) => !!val || 'Campo requerido',
                validarFechaFin
              ]"
            >
                <template v-slot:prepend>
                <q-icon name="event_busy" color="teal" />
              </template>
            </q-input>
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
import { ref, onMounted } from 'vue'
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

// Mapeo de frecuencia a tiempos de comida
const tiemposMap = {
  1: ['Comida Principal'],
  2: ['Desayuno', 'Cena'],
  3: ['Desayuno', 'Almuerzo', 'Cena'],
  4: ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'],
  5: ['Desayuno', 'Merienda AM', 'Almuerzo', 'Merienda PM', 'Cena'],
}

const form = ref({
  tipo_dieta_id: props.alimentacion?.tipo_dieta_id || null,
  via_administracion: props.alimentacion?.via_administracion || 'Oral',
  frecuencia_tiempos: props.alimentacion?.frecuencia_tiempos || null,
  restricciones: props.alimentacion?.restricciones || '',
  descripcion: props.alimentacion?.descripcion || '',
  fecha_inicio: props.alimentacion?.fecha_inicio
    ? formatDateTimeLocal(props.alimentacion.fecha_inicio)
    : '',
  fecha_fin: props.alimentacion?.fecha_fin ? formatDateTimeLocal(props.alimentacion.fecha_fin) : '',
})

const tiemposComida = ref([])

// Formatear fecha para input datetime-local
function formatDateTimeLocal(dateString) {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

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

// Validaciones de Fecha
function validarFechaInicio(val) {
  if (!val) return true
  const fechaInicio = new Date(val)
  const ahora = new Date()
  // Restamos 1 minuto para dar margen si es "justo ahora"
  ahora.setMinutes(ahora.getMinutes() - 1)

  if (fechaInicio < ahora) {
    return 'La fecha de inicio no puede ser anterior a la actual'
  }
  return true
}

function validarFechaFin(val) {
  if (!val || !form.value.fecha_inicio) return true

  const fechaInicio = new Date(form.value.fecha_inicio)
  const fechaFin = new Date(val)

  if (fechaFin <= fechaInicio) {
    return 'La fecha fin debe ser posterior a la fecha de inicio'
  }
  return true
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
      fecha_inicio: form.value.fecha_inicio,
      fecha_fin: form.value.fecha_fin,
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
