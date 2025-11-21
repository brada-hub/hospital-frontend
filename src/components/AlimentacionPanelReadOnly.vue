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

        <q-separator />

        <!-- Tiempos de Comida -->
        <q-card-section v-if="alimentacion.tiempos && alimentacion.tiempos.length">
          <div class="section-title">
            <q-icon name="schedule" size="24px" class="q-mr-sm" />
            <span>Tiempos de Comida Programados</span>
          </div>
          <q-list bordered separator class="tiempos-list">
            <q-item v-for="tiempo in alimentacion.tiempos" :key="tiempo.id" class="tiempo-item">
              <q-item-section avatar>
                <q-avatar color="teal" text-color="white" icon="schedule" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ tiempo.tiempo_comida }}</q-item-label>
                <q-item-label caption>
                  {{ tiempo.descripcion || 'Sin descripción específica' }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <!-- Historial de Consumos -->
        <q-card-section>
          <div class="section-title">
            <q-icon name="history" size="24px" class="q-mr-sm" />
            <span>Historial de Consumos (Últimos 7 días)</span>
          </div>

          <div v-if="cargandoConsumos" class="text-center q-pa-md">
            <q-spinner color="teal" size="40px" />
            <div class="q-mt-sm text-grey-7">Cargando consumos...</div>
          </div>

          <div v-else-if="historialConsumos.length === 0" class="empty-state-small">
            <q-icon name="history" size="48px" />
            <div class="q-mt-sm">Sin registros de consumo recientes.</div>
          </div>

          <div v-else class="consumos-timeline">
            <div v-for="(grupo, fecha) in consumosAgrupados" :key="fecha" class="consumo-dia-grupo">
              <div class="fecha-badge">
                <q-icon name="calendar_today" size="18px" class="q-mr-xs" />
                {{ formatearFechaLarga(fecha) }}
              </div>
              <q-list separator bordered class="consumos-list">
                <q-item v-for="consumo in grupo" :key="consumo.id" class="consumo-item">
                  <q-item-section avatar>
                    <q-avatar
                      :color="getPorcentajeColor(consumo.porcentaje_consumido)"
                      text-color="white"
                      size="56px"
                    >
                      {{ consumo.porcentaje_consumido }}%
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-bold text-h6">
                      {{ consumo.tiempo_comida }}
                    </q-item-label>
                    <q-item-label caption v-if="consumo.observaciones" class="observaciones-text">
                      <q-icon name="notes" size="xs" />
                      {{ consumo.observaciones }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side top>
                    <q-item-label caption class="time-label">
                      {{ formatearHora(consumo.created_at) }}
                    </q-item-label>
                    <q-item-label caption v-if="consumo.registrado_por" class="user-label">
                      <q-icon name="person" size="xs" />
                      {{ consumo.registrado_por.nombre.split(' ')[0] }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-card-section>
      </template>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { format, parseISO, subDays } from 'date-fns'
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

const consumosAgrupados = computed(() => {
  const grupos = {}
  historialConsumos.value.forEach((consumo) => {
    const fecha = consumo.fecha
    if (!grupos[fecha]) {
      grupos[fecha] = []
    }
    grupos[fecha].push(consumo)
  })
  return grupos
})

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

    // 2. Cargar consumos de los últimos 7 días
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
  const consumosTotales = []

  try {
    // Generar las últimas 7 fechas
    const hoy = new Date()
    const fechas = []
    for (let i = 0; i < 7; i++) {
      const fecha = subDays(hoy, i)
      fechas.push(format(fecha, 'yyyy-MM-dd'))
    }

    // Hacer peticiones para cada fecha
    const promesas = fechas.map(async (fecha) => {
      try {
        const response = await api.get(`/consumos/alimentacion/${alimentacionId}/${fecha}`)
        return response.data || []
      } catch {
        // Si no hay consumos para esa fecha, retornar array vacío
        console.log(`No hay consumos para ${fecha}`)
        return []
      }
    })

    const resultados = await Promise.all(promesas)

    // Combinar todos los consumos y ordenarlos por fecha descendente
    resultados.forEach((consumos) => {
      if (Array.isArray(consumos)) {
        consumosTotales.push(...consumos)
      }
    })

    // Ordenar por fecha y hora descendente (más reciente primero)
    consumosTotales.sort((a, b) => {
      const fechaA = new Date(a.created_at || a.fecha)
      const fechaB = new Date(b.created_at || b.fecha)
      return fechaB - fechaA
    })

    historialConsumos.value = consumosTotales
  } catch (error) {
    console.error('Error cargando consumos históricos:', error)
    $q.notify({
      type: 'warning',
      message: 'No se pudieron cargar algunos registros de consumo',
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 24px;
}

.plan-info {
  padding: 24px;
  background: #f8fafc;
}

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

.section-title {
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.tiempos-list {
  border-radius: 12px;
  overflow: hidden;
}

.tiempo-item {
  padding: 16px;
  background: white;
}

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

.consumos-timeline {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.consumo-dia-grupo {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.fecha-badge {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  text-transform: capitalize;
}

.consumos-list {
  border: none;
}

.consumo-item {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.consumo-item:last-child {
  border-bottom: none;
}

.observaciones-text {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.time-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.user-label {
  font-size: 0.8rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .info-row {
    flex-direction: column;
    gap: 8px;
  }

  .consumo-item {
    padding: 12px;
  }
}
</style>
