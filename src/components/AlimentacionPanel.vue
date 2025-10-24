<template>
  <q-card>
    <q-card-section class="bg-teal-1">
      <div class="row items-center no-wrap">
        <div class="col">
          <div class="text-h6">Plan de Alimentación</div>
        </div>

        <div class="col-auto" v-if="alimentacion">
          <q-btn icon="more_vert" flat round dense>
            <q-menu auto-close>
              <q-list style="min-width: 180px">
                <q-item clickable @click="onEditClick">
                  <q-item-section avatar>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Modificar Plan</q-item-section>
                </q-item>

                <q-item clickable @click="onSuspendClick">
                  <q-item-section avatar>
                    <q-icon name="cancel" color="negative" />
                  </q-item-section>
                  <q-item-section>Suspender Plan</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>
    </q-card-section>

    <q-card-section v-if="cargando">
      <q-inner-loading showing />
      <div class="text-center q-pa-md text-grey-7">Cargando plan y registros...</div>
    </q-card-section>

    <q-card-section v-else-if="!alimentacion" class="text-center text-grey-6 q-pa-md">
      <q-icon name="restaurant_off" size="48px" />
      <div class="q-mt-sm">No hay prescripciones de alimentación activas</div>
    </q-card-section>

    <template v-else>
      <q-card-section>
        <q-item-label class="text-weight-bold">
          {{ alimentacion.tipo_dieta?.nombre }} (Activo)
        </q-item-label>
        <q-item-label caption class="q-mt-sm">
          <div><strong>Vía:</strong> {{ alimentacion.via_administracion }}</div>
          <div v-if="alimentacion.restricciones" class="q-mt-xs">
            <strong>Restricciones:</strong> {{ alimentacion.restricciones }}
          </div>
        </q-item-label>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-subtitle1 text-weight-medium text-teal-8">
          Registrar Nuevo Consumo (Hoy)
        </div>

        <q-list separator bordered class="rounded-borders">
          <q-item v-for="tiempo in alimentacion.tiempos" :key="tiempo.id" class="q-pa-md">
            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ tiempo.tiempo_comida }}
              </q-item-label>
              <q-item-label caption>
                {{ tiempo.descripcion || 'Sin descripción específica' }}
              </q-item-label>

              <q-slider
                v-if="inputsNuevos[tiempo.tiempo_comida]"
                v-model="inputsNuevos[tiempo.tiempo_comida].porcentaje_consumido"
                :min="0"
                :max="100"
                :step="25"
                label-always
                markers
                color="teal"
                class="q-mt-md q-px-sm"
              />

              <q-input
                v-if="inputsNuevos[tiempo.tiempo_comida]"
                v-model="inputsNuevos[tiempo.tiempo_comida].observaciones"
                label="Observaciones (ej: 'Refiere náuseas')"
                outlined
                dense
                autogrow
                class="q-mt-md"
              />

              <div class="q-mt-md text-right">
                <q-btn
                  dense
                  unelevated
                  :label="`Registrar ${tiempo.tiempo_comida}`"
                  color="primary"
                  icon="add_circle"
                  @click="handleGuardarTiempo(tiempo.tiempo_comida)"
                  :loading="guardandoTiempo === tiempo.tiempo_comida"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-subtitle1 text-weight-medium text-grey-8">
          Historial de Registros (Hoy)
        </div>

        <div v-if="historialConsumos.length === 0" class="text-center text-grey-6 q-pa-md">
          <q-icon name="history" size="32px" />
          <div class="q-mt-sm">Aún no hay registros de consumo para hoy.</div>
        </div>

        <q-list v-else separator class="q-mt-md">
          <q-item
            v-for="consumo in historialConsumos"
            :key="consumo.id"
            class="q-pa-sm historial-item"
          >
            <q-item-section avatar>
              <q-avatar
                :color="getPorcentajeColor(consumo.porcentaje_consumido)"
                text-color="white"
                size="lg"
              >
                {{ consumo.porcentaje_consumido }}%
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ consumo.tiempo_comida }}
              </q-item-label>
              <q-item-label caption v-if="consumo.observaciones">
                Obs: {{ consumo.observaciones }}
              </q-item-label>
            </q-item-section>

            <q-item-section side top>
              <q-item-label caption>
                {{ formatearFechaGuardado(consumo.created_at) }}
              </q-item-label>
              <q-item-label caption v-if="consumo.registrado_por">
                Por: {{ consumo.registrado_por.nombre.split(' ')[0] }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </template>
  </q-card>
</template>

<script setup>
// CAMBIO: Añadidos defineEmits y defineExpose
import { ref, onMounted, defineEmits, defineExpose } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const props = defineProps({
  internacionId: {
    type: Number,
    required: true,
  },
  tratamientoId: {
    type: Number,
    required: true,
  },
})

// CAMBIO: Definir los eventos que este componente puede emitir
const emit = defineEmits(['editRequest'])

const $q = useQuasar()

const cargando = ref(true)
const alimentacion = ref(null)
const guardandoTiempo = ref(null)

const inputsNuevos = ref({})
const historialConsumos = ref([])

const getFechaHoy = () => {
  return format(new Date(), 'yyyy-MM-dd')
}

const formatearFechaGuardado = (fecha) => {
  if (!fecha) return ''
  return format(new Date(fecha), 'dd MMM, hh:mm a', { locale: es })
}

const getPorcentajeColor = (porcentaje) => {
  if (porcentaje <= 30) return 'negative' // Rojo
  if (porcentaje <= 70) return 'warning' // Amarillo
  return 'positive' // Verde
}

onMounted(() => {
  cargarDatosAlimentacion()
})

const cargarDatosAlimentacion = async () => {
  cargando.value = true
  historialConsumos.value = []
  inputsNuevos.value = {}

  try {
    // 1. Obtener la dieta activa
    const responseDieta = await api.get(`/alimentaciones/internacion/${props.internacionId}`)
    // CAMBIO: Asegurarse de tomar la activa (estado 0)
    const dietaActiva = responseDieta.data.find((a) => a.estado === 0)

    if (!dietaActiva) {
      alimentacion.value = null
      cargando.value = false // Importante: finalizar carga si no hay dieta
      return
    }

    alimentacion.value = dietaActiva
    const fechaHoy = getFechaHoy()

    // 2. Inicializar los INPUTS (sliders) a 0
    for (const tiempo of dietaActiva.tiempos) {
      inputsNuevos.value[tiempo.tiempo_comida] = {
        porcentaje_consumido: 0,
        observaciones: '',
      }
    }

    // 3. Cargar el HISTORIAL de hoy (la "listita")
    try {
      const responseConsumos = await api.get(`/consumos/alimentacion/${dietaActiva.id}/${fechaHoy}`)
      historialConsumos.value = responseConsumos.data || []
    } catch (loadError) {
      console.warn('No se pudieron cargar consumos previos (o no existen):', loadError.message)
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al cargar el PLAN de alimentación',
    })
    console.error('Error cargando la dieta:', error)
  } finally {
    cargando.value = false
  }
}

const handleGuardarTiempo = async (tiempoComida) => {
  guardandoTiempo.value = tiempoComida

  const dataTiempo = inputsNuevos.value[tiempoComida]
  if (!dataTiempo) {
    guardandoTiempo.value = null // Liberar bloqueo si no hay datos
    return
  }

  // Validar que se haya movido el slider O añadido observación
  if (dataTiempo.porcentaje_consumido === 0 && !dataTiempo.observaciones) {
    $q.notify({
      type: 'warning',
      message: 'Mueva el slider o añada una observación para registrar.',
    })
    guardandoTiempo.value = null
    return
  }

  const payload = {
    tratamiento_id: props.tratamientoId,
    alimentacion_id: alimentacion.value.id,
    fecha: getFechaHoy(),
    tiempo_comida: tiempoComida,
    porcentaje_consumido: dataTiempo.porcentaje_consumido,
    observaciones: dataTiempo.observaciones,
  }

  try {
    const response = await api.post('/consumos/registrar-tiempo', payload)

    // Añadir el nuevo registro AL INICIO de la "listita"
    historialConsumos.value.unshift(response.data)

    // Reseteamos el input para ese tiempo
    inputsNuevos.value[tiempoComida] = {
      porcentaje_consumido: 0,
      observaciones: '',
    }

    $q.notify({
      type: 'positive',
      message: `${tiempoComida} registrado exitosamente.`,
      icon: 'check_circle',
    })
  } catch (error) {
    console.error(`Error al guardar ${tiempoComida}`, error)
    $q.notify({
      type: 'negative',
      message: `Error al guardar ${tiempoComida}.`,
    })
  } finally {
    guardandoTiempo.value = null
  }
}

// --- INICIO DE NUEVAS FUNCIONES ---

/**
 * CAMBIO: Emite un evento al componente padre para que abra el diálogo de edición.
 */
const onEditClick = () => {
  if (alimentacion.value) {
    // Pasa el objeto 'alimentacion' completo al padre
    emit('editRequest', alimentacion.value)
  }
}

/**
 * CAMBIO: Muestra un diálogo para confirmar y registrar el motivo de suspensión.
 */
const onSuspendClick = () => {
  $q.dialog({
    title: 'Suspender Plan de Alimentación',
    message: 'Ingrese el motivo de la suspensión (ej: "Ayuno por cirugía", "Intolerancia"):',
    prompt: {
      model: '',
      type: 'text', // o 'textarea'
      isValid: (val) => val.length >= 5 || 'El motivo debe tener al menos 5 caracteres.',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (motivo) => {
    // Si el usuario da OK y el motivo es válido, procede a suspender
    await handleSuspender(motivo)
  })
}

/**
 * CAMBIO: Función que llama a la API para suspender el plan.
 */
const handleSuspender = async (motivo) => {
  if (!alimentacion.value) return

  $q.loading.show({ message: 'Suspendiendo plan...' })
  try {
    // Llama al endpoint definido en api.php:
    // Route::post('/alimentaciones/{alimentacion}/suspender', [AlimentacionController::class, 'suspender']);
    await api.post(`/alimentaciones/${alimentacion.value.id}/suspender`, {
      motivo_suspension: motivo,
    })

    $q.notify({
      type: 'positive',
      message: 'Plan de alimentación suspendido correctamente.',
    })

    // Vuelve a cargar los datos. Como el plan ya no estará activo,
    // el panel mostrará el estado "No hay prescripciones...".
    cargarDatosAlimentacion()
  } catch (error) {
    console.error('Error al suspender la alimentación:', error)
    $q.notify({
      type: 'negative',
      message: 'No se pudo suspender el plan. Intente nuevamente.',
    })
  } finally {
    $q.loading.hide()
  }
}

/**
 * CAMBIO: Expone la función de recarga para que el padre pueda llamarla
 * después de que el formulario de edición se guarde.
 */
defineExpose({
  cargarDatosAlimentacion,
})

// --- FIN DE NUEVAS FUNCIONES ---
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}
.historial-item {
  border-bottom: 1px solid #eee;
}
.historial-item:last-child {
  border-bottom: none;
}
</style>
