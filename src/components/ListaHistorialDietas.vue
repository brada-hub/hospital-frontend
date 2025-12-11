<template>
  <div class="historial-dietas-container q-mt-lg">
    <div class="row items-center q-mb-md">
      <q-icon name="history" size="24px" class="q-mr-sm text-grey-8" />
      <div class="text-h6 text-grey-9">Historial de Planes Alimenticios</div>
    </div>

    <div v-if="cargando" class="row justify-center q-py-md">
      <q-spinner-dots color="teal" size="40px" />
    </div>

    <div v-else-if="dietasHistoricas.length === 0" class="text-center q-py-md text-grey-6">
      No hay planes anteriores registrados.
    </div>

    <div v-else class="column q-gutter-md">
      <q-card
        v-for="dieta in dietasHistoricas"
        :key="dieta.id"
        flat
        bordered
        class="history-card"
        :class="{ 'bg-red-1': dieta.estado === 1, 'bg-grey-1': dieta.estado !== 1 }"
      >
        <q-card-section>
          <div class="row justify-between items-start">
            <div>
              <div class="text-subtitle1 text-weight-bold text-blue-grey-9">
                {{ dieta.tipo_dieta?.nombre || 'Dieta Desconocida' }}
              </div>
              <div class="text-caption text-grey-7">
                Vía: {{ dieta.via_administracion }}
              </div>
            </div>
            <q-badge :color="getEstadoColor(dieta.estado)" :label="getEstadoLabel(dieta.estado)" />
          </div>

          <q-separator class="q-my-sm" />

          <div class="row q-col-gutter-sm text-caption">
            <div class="col-12 col-sm-6">
              <q-icon name="event" class="q-mr-xs" />
              Inicio: {{ formatearFecha(dieta.fecha_inicio) }}
            </div>
            <div class="col-12 col-sm-6 text-grey-8">
              <q-icon name="event_busy" class="q-mr-xs" />
              Fin/Suspensión: {{ formatearFecha(dieta.updated_at || dieta.fecha_fin) }}
            </div>
          </div>

          <div v-if="dieta.motivo_suspension" class="q-mt-md bg-white q-pa-sm rounded-borders border-red-2">
            <div class="text-caption text-negative text-weight-bold">
              <q-icon name="report_problem" /> Motivo de suspensión:
            </div>
            <div class="text-body2 text-grey-9 q-mt-xs">
              {{ dieta.motivo_suspension }}
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { api } from 'src/boot/axios'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const props = defineProps({
  internacionId: {
    type: Number,
    required: true
  }
})

const cargando = ref(false)
const dietasHistoricas = ref([])

onMounted(() => {
  cargarHistorial()
})

watch(() => props.internacionId, () => {
  cargarHistorial()
})

async function cargarHistorial() {
  cargando.value = true
  dietasHistoricas.value = []
  try {
    const response = await api.get(`/alimentaciones/internacion/${props.internacionId}`)
    // Filtrar solo las que NO están activas (estado != 0)
    // Asumiendo que 0 es Activo. Ajustar según lógica de backend si es diferente.
    // Según HospitalCompletoSeeder o lógica anterior, 0 suele ser activo.
    dietasHistoricas.value = response.data.filter(d => d.estado !== 0).sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at)
    })
  } catch (error) {
    console.error('Error al cargar historial de dietas:', error)
  } finally {
    cargando.value = false
  }
}

function getEstadoColor(estado) {
  if (estado === 1) return 'negative' // Suspendida/Inactiva
  return 'grey'
}

function getEstadoLabel(estado) {
  if (estado === 1) return 'Suspendida'
  return 'Finalizada'
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '-'
  try {
    return format(new Date(fechaStr), "dd MMM yyyy, HH:mm", { locale: es })
  } catch {
    return fechaStr
  }
}
</script>

<style scoped>
.history-card {
  border-left: 4px solid #9e9e9e;
  transition: all 0.3s ease;
}

.history-card.bg-red-1 {
  border-left-color: #f44336;
}

.border-red-2 {
    border: 1px solid #ffcdd2;
}
</style>
