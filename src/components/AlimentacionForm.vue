<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">Alimentación</div>
    </q-card-section>

    <q-card-section>
      <q-form @submit="onSubmit" class="q-gutter-md">
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
          :rules="[(val) => !!val || 'Campo requerido']"
        >
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
          :rules="[(val) => !!val || 'Campo requerido']"
        />

        <!-- Frecuencia (1-5 tiempos) -->
        <q-select
          v-model="form.frecuencia_tiempos"
          :options="[1, 2, 3, 4, 5]"
          label="Frecuencia (Número de tiempos)"
          outlined
          dense
          :rules="[(val) => !!val || 'Campo requerido']"
          @update:model-value="onFrecuenciaChange"
        />

        <!-- Tiempos de Comida Dinámicos -->
        <div v-if="form.frecuencia_tiempos" class="q-gutter-sm">
          <div class="text-subtitle2 q-mb-sm">Distribución de Tiempos de Comida</div>

          <div
            v-for="(tiempo, index) in tiemposComida"
            :key="index"
            class="q-pa-sm bg-grey-2 rounded-borders"
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
                />
              </div>
              <div class="col-12 col-md-8">
                <q-input
                  v-model="tiempo.descripcion"
                  label="Descripción de lo que se dará"
                  outlined
                  dense
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
        />

        <!-- Descripción/Observaciones -->
        <q-input
          v-model="form.descripcion"
          label="Observaciones Médicas"
          type="textarea"
          outlined
          dense
          rows="3"
          :rules="[(val) => !!val || 'Campo requerido']"
        />

        <!-- Fechas -->
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-6">
            <q-input
              v-model="form.fecha_inicio"
              label="Fecha de Inicio"
              type="datetime-local"
              outlined
              dense
              :rules="[(val) => !!val || 'Campo requerido']"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="form.fecha_fin"
              label="Fecha de Fin"
              type="datetime-local"
              outlined
              dense
              :rules="[(val) => !!val || 'Campo requerido']"
            />
          </div>
        </div>

        <!-- Botones -->
        <div class="row q-gutter-sm justify-end">
          <q-btn label="Cancelar" color="grey" flat @click="$emit('cancel')" />
          <q-btn label="Guardar" type="submit" color="primary" :loading="loading" />
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

async function onSubmit() {
  // Validar que todos los tiempos tengan descripción
  const tiemposSinDescripcion = tiemposComida.value.filter((t) => !t.descripcion)
  if (tiemposSinDescripcion.length > 0) {
    $q.notify({
      type: 'warning',
      message: 'Por favor complete la descripción de todos los tiempos de comida',
    })
    return
  }

  loading.value = true

  try {
    // <CHANGE> Enviar 'tiempos' en lugar de 'tiempos_comida' para coincidir con el backend
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
      $q.notify({
        type: 'positive',
        message: 'Alimentación actualizada correctamente',
      })
    } else {
      await api.post('/alimentaciones', data)
      $q.notify({
        type: 'positive',
        message: 'Alimentación registrada correctamente',
      })
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

onMounted(() => {
  loadTiposDieta()
  initializeTiemposComida()
})
</script>
