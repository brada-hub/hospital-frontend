<template>
  <div class="alimentacion-readonly-container">
    <q-card class="alimentacion-card">
      <q-card-section class="card-header">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <q-icon name="restaurant" size="32px" class="q-mr-sm" />
            <span class="text-h6">Plan de Alimentación</span>
          </div>
        </div>
      </q-card-section>

      <q-card-section v-if="cargando">
        <q-inner-loading showing />
        <div class="text-center q-pa-md text-grey-7">Cargando información...</div>
      </q-card-section>

      <q-card-section v-else-if="!alimentacion" class="empty-state">
        <q-icon name="restaurant_off" size="64px" />
        <div class="q-mt-sm text-h6">Sin plan de alimentación activo</div>
        <p class="text-grey-7">No hay prescripciones de alimentación activas en este momento.</p>
      </q-card-section>

      <template v-else>
        <!-- Información del Plan -->
        <q-card-section class="plan-info">
          <div class="info-row">
            <q-icon name="restaurant_menu" color="teal" size="24px" />
            <div class="info-content">
              <strong>Tipo de Dieta:</strong>
              <span class="value-text">{{ alimentacion.tipo_dieta?.nombre }}</span>
            </div>
          </div>
          <div class="info-row" v-if="alimentacion.tipo_dieta?.descripcion">
            <q-icon name="description" color="teal" size="24px" />
            <div class="info-content">
              <strong>Descripción:</strong>
              <span class="value-text">{{ alimentacion.tipo_dieta?.descripcion }}</span>
            </div>
          </div>
          <div class="info-row">
            <q-icon name="local_dining" color="teal" size="24px" />
            <div class="info-content">
              <strong>Vía de Administración:</strong>
              <span class="value-text">{{ alimentacion.via_administracion }}</span>
            </div>
          </div>
          <div class="info-row" v-if="alimentacion.restricciones">
            <q-icon name="warning" color="orange" size="24px" />
            <div class="info-content">
              <strong>Restricciones:</strong>
              <span class="value-text text-orange-8">{{ alimentacion.restricciones }}</span>
            </div>
          </div>
        </q-card-section>

        <q-separator class="q-my-md" />

        <div class="q-px-md q-pb-md">
           <div class="row items-center q-mb-md">
              <q-icon name="restaurant" size="24px" class="q-mr-sm text-teal" />
              <div class="text-h6 text-blue-grey-9">Detalle por Tiempo de Comida</div>
           </div>

           <!-- Cards por Tiempo de Comida -->
           <div class="row q-col-gutter-md">
              <div
                v-for="tiempo in alimentacion.tiempos"
                :key="tiempo.id"
                class="col-12"
              >
                <q-card flat bordered class="meal-time-card">
                  <!-- Cabecera del Tiempo (Ej: Desayuno) -->
                  <q-card-section class="bg-teal-1">
                    <div class="row items-center justify-between">
                      <div class="row items-center">
                        <q-avatar color="teal" text-color="white" icon="schedule" size="md" class="q-mr-md"/>
                        <div>
                          <div class="text-h6 text-teal-9">{{ tiempo.tiempo_comida }}</div>
                          <div class="text-subtitle2 text-grey-7">{{ tiempo.descripcion || 'Sin descripción detallada' }}</div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>

                  <q-separator color="teal-2" />

                  <!-- Historial de ese tiempo -->
                  <q-card-section class="q-pa-none">
                     <div class="bg-grey-1 q-px-md q-py-sm text-caption text-grey-7 text-uppercase text-weight-bold">
                        Historial Reciente (7 días)
                     </div>

                     <div v-if="getConsumosPorTiempo(tiempo.tiempo_comida).length === 0" class="text-center q-pa-md text-grey-6 text-italic">
                        Sin registros recientes.
                     </div>

                     <q-list separator v-else>
                        <q-item v-for="consumo in getConsumosPorTiempo(tiempo.tiempo_comida)" :key="consumo.id" class="q-py-md">
                           <q-item-section avatar>
                              <q-circular-progress
                                show-value
                                font-size="12px"
                                :value="consumo.porcentaje_consumido"
                                size="40px"
                                :thickness="0.25"
                                :color="getPorcentajeColor(consumo.porcentaje_consumido)"
                                track-color="grey-3"
                                class="text-weight-bold"
                              >
                                {{ consumo.porcentaje_consumido }}%
                              </q-circular-progress>
                           </q-item-section>

                           <q-item-section>
                              <q-item-label>
                                 <span class="text-weight-medium">{{ formatearFechaLarga(consumo.fecha) }}</span>
                              </q-item-label>
                              <q-item-label caption v-if="consumo.observaciones">
                                 {{ consumo.observaciones }}
                              </q-item-label>
                           </q-item-section>

                           <q-item-section side>
                              <div class="text-caption text-grey-6">{{ formatearHora(consumo.created_at) }}</div>
                              <div class="text-caption text-teal-8" v-if="consumo.registrado_por">
                                 <q-icon name="person" size="xs"/> {{ consumo.registrado_por.nombre.split(' ')[0] }}
                              </div>
                           </q-item-section>
                        </q-item>
                     </q-list>
                  </q-card-section>
                </q-card>
              </div>
           </div>
        </div>
      </template>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const props = defineProps({
  internacionId: {
    type: Number,
    required: true,
  },
})

const $q = useQuasar()

const cargando = ref(true)
const cargandoConsumos = ref(false)
const alimentacion = ref(null)
const historialConsumos = ref([])

const formatearFechaLarga = (fecha) => {
  if (!fecha) return ''
  return format(parseISO(fecha), "EEEE, dd 'de' MMMM", { locale: es })
}

const formatearHora = (fecha) => {
  if (!fecha) return ''
  return format(new Date(fecha), 'hh:mm a', { locale: es })
}

const getPorcentajeColor = (porcentaje) => {
  if (porcentaje <= 30) return 'negative'
  if (porcentaje <= 70) return 'warning'
  return 'positive'
}

const getConsumosPorTiempo = (tiempoNombre) => {
  if (!tiempoNombre || !historialConsumos.value) return []
  return historialConsumos.value
    .filter(c => c.tiempo_comida === tiempoNombre)
    // Ordenar de más reciente a más antiguo
    .sort((a, b) => new Date(b.created_at || b.fecha) - new Date(a.created_at || a.fecha))
}

onMounted(() => {
  cargarDatosAlimentacion()
})

const cargarDatosAlimentacion = async () => {
  cargando.value = true
  historialConsumos.value = []

  try {
    // 1. Obtener la dieta activa
    const responseDieta = await api.get(`/alimentaciones/internacion/${props.internacionId}`)
    const dietaActiva = responseDieta.data.find((a) => a.estado === 0)

    if (!dietaActiva) {
      alimentacion.value = null
      cargando.value = false
      return
    }

    alimentacion.value = dietaActiva

    // 2. Cargar consumos de los últimos 7 días (endpoint optimizado)
    await cargarConsumosUltimos7Dias(dietaActiva.id)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al cargar el plan de alimentación',
    })
    console.error('Error cargando la dieta:', error)
  } finally {
    cargando.value = false
  }
}

const cargarConsumosUltimos7Dias = async (alimentacionId) => {
  cargandoConsumos.value = true
  try {
    // PETICIÓN ÚNICA y OPTIMIZADA
    const response = await api.get(`/consumos/alimentacion/${alimentacionId}/historial`, {
        params: { dias: 7 }
    })

    // La respuesta ya viene ordenada por fecha y created_at desde el backend
    historialConsumos.value = response.data

  } catch (error) {
    console.error('Error cargando consumos históricos:', error)
    $q.notify({
      type: 'warning',
      message: 'No se pudieron cargar los registros de consumo',
    })
  } finally {
    cargandoConsumos.value = false
  }
}
</script>

<style scoped>
.alimentacion-readonly-container {
  width: 100%;
}

.alimentacion-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  padding: 24px;
}

.plan-info {
  padding: 24px;
  background: #f8fafc;
}

/* Info Row Styles */
.info-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-content strong {
  color: #475569;
  font-size: 0.9rem;
  font-weight: 600;
}

.value-text {
  color: #1e293b;
  font-size: 1rem;
  font-weight: 500;
}

/* Meal Time Card Styles */
.meal-time-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.meal-time-card:hover {
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.15);
  transform: translateY(-2px);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 64px 24px;
  color: #64748b;
}

.empty-state-small {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: white;
  border-radius: 12px;
  color: #94a3b8;
  border: 2px dashed #cbd5e1;
}

@media (max-width: 768px) {
  .info-row {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
