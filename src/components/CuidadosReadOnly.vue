<template>
  <div class="cuidados-readonly-container">
    <!-- Plan de Cuidados -->
    <div class="section-wrapper">
      <div class="section-header">
        <q-icon name="health_and_safety" size="32px" />
        <span class="text-h6">Plan de Cuidados Activos</span>
      </div>

      <div v-if="!cuidados || cuidados.length === 0" class="empty-state">
        <q-icon name="health_and_safety" size="80px" class="empty-icon" />
        <div class="empty-text">
          <h3>Sin plan de cuidados activo</h3>
          <p>No hay cuidados definidos en este momento.</p>
        </div>
      </div>

      <div v-else class="cuidados-grid">
        <q-card v-for="cuidado in cuidados" :key="cuidado.id" class="cuidado-card">
          <q-card-section class="cuidado-header">
            <div class="header-content">
              <q-icon :name="getIconForCuidado(cuidado.tipo)" size="32px" class="cuidado-icon" />
              <div class="header-text">
                <h3 class="cuidado-titulo">{{ cuidado.tipo }}</h3>
                <p class="cuidado-descripcion">{{ cuidado.descripcion }}</p>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="cuidado-body">
            <div class="info-item">
              <q-icon name="schedule" color="primary" size="20px" />
              <span class="info-label">Frecuencia:</span>
              <span class="info-value">{{ cuidado.frecuencia || 'Según necesidad' }}</span>
            </div>

            <div v-if="cuidado.observaciones" class="info-item">
              <q-icon name="notes" color="primary" size="20px" />
              <span class="info-label">Observaciones:</span>
              <span class="info-value">{{ cuidado.observaciones }}</span>
            </div>

            <div
              v-if="cuidado.cuidados_aplicados && cuidado.cuidados_aplicados.length > 0"
              class="ultimo-registro"
            >
              <div class="registro-header">
                <q-icon name="check_circle" color="positive" size="20px" />
                <span class="registro-titulo">Último Registro</span>
              </div>
              <div class="registro-content">
                <div class="registro-row">
                  <q-icon name="event" size="18px" class="registro-icon" />
                  <span>{{
                    formatearFechaHora(cuidado.cuidados_aplicados[0].fecha_aplicacion)
                  }}</span>
                </div>
                <div class="registro-row">
                  <q-icon name="person" size="18px" class="registro-icon" />
                  <span
                    >Por: {{ cuidado.cuidados_aplicados[0].user?.nombre }}
                    {{ cuidado.cuidados_aplicados[0].user?.apellidos }}</span
                  >
                </div>
                <div
                  v-if="cuidado.cuidados_aplicados[0].observaciones"
                  class="registro-row observacion"
                >
                  <q-icon name="notes" size="18px" class="registro-icon" />
                  <span>{{ cuidado.cuidados_aplicados[0].observaciones }}</span>
                </div>
              </div>
            </div>

            <div v-else class="sin-registro">
              <q-icon name="warning" color="warning" size="24px" />
              <span>Sin registros de aplicación</span>
            </div>
          </q-card-section>

          <q-separator />

          <!-- Historial de aplicaciones -->
          <q-card-section
            v-if="cuidado.cuidados_aplicados && cuidado.cuidados_aplicados.length > 1"
            class="historial-section"
          >
            <q-expansion-item
              icon="history"
              label="Ver historial completo"
              header-class="historial-toggle"
              dense
            >
              <q-list separator class="historial-list">
                <q-item
                  v-for="(aplicacion, index) in cuidado.cuidados_aplicados.slice(1)"
                  :key="aplicacion.id"
                  dense
                >
                  <q-item-section avatar>
                    <q-avatar color="grey-4" text-color="grey-8" size="32px">
                      {{ cuidado.cuidados_aplicados.length - index - 1 }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ formatearFechaHora(aplicacion.fecha_aplicacion) }}
                    </q-item-label>
                    <q-item-label caption>
                      Por: {{ aplicacion.user?.nombre }} {{ aplicacion.user?.apellidos }}
                    </q-item-label>
                    <q-item-label
                      caption
                      v-if="aplicacion.observaciones"
                      class="text-grey-7 q-mt-xs"
                    >
                      {{ aplicacion.observaciones }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Evoluciones de Enfermería -->
    <div class="section-wrapper q-mt-xl">
      <div class="section-header section-header-enfermeria">
        <q-icon name="event_note" size="32px" />
        <span class="text-h6">Evolución y Novedades de Enfermería</span>
      </div>

      <div v-if="!evoluciones || evoluciones.length === 0" class="empty-state">
        <q-icon name="description" size="80px" class="empty-icon" />
        <div class="empty-text">
          <h3>Sin novedades registradas</h3>
          <p>Las evoluciones de enfermería aparecerán aquí.</p>
        </div>
      </div>

      <div v-else class="evoluciones-grid">
        <q-card
          v-for="(evolucion, index) in evoluciones"
          :key="evolucion.id"
          class="evolucion-card"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <q-card-section class="evolucion-header">
            <div class="evolucion-icon">
              <q-icon name="medical_services" size="24px" />
            </div>
            <div class="evolucion-meta">
              <div class="evolucion-date">
                <q-icon name="schedule" size="16px" />
                <span v-if="evolucion.cuidados_aplicados && evolucion.cuidados_aplicados.length">
                  {{ formatearFechaHora(evolucion.cuidados_aplicados[0].fecha_aplicacion) }}
                </span>
                <span v-else>{{ formatearFechaHora(evolucion.fecha_inicio) }}</span>
              </div>
              <div
                v-if="evolucion.cuidados_aplicados && evolucion.cuidados_aplicados.length"
                class="evolucion-user"
              >
                <q-icon name="person" size="16px" />
                <span>{{ evolucion.cuidados_aplicados[0].user?.nombre }}</span>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <p class="evolucion-descripcion">{{ evolucion.descripcion }}</p>
          </q-card-section>

          <q-card-section class="evolucion-footer">
            <div class="footer-badge">
              <q-icon name="check_circle" size="14px" />
              <span>Registrado</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const props = defineProps({
  internacion: {
    type: Object,
    required: true,
  },
})

// Tipos que se consideran evoluciones/novedades de enfermería (NO van en Plan de Cuidados)
const tiposEvolucion = ['Evolución', 'Novedad', 'A Demanda - Enfermería']

const cuidados = computed(() => {
  const allCuidados = props.internacion?.cuidados || []
  console.log('🔍 Todos los cuidados:', allCuidados)
  console.log(
    '🔍 Tipos encontrados:',
    allCuidados.map((c) => c.tipo),
  )

  // Filtrar solo cuidados que NO son evoluciones/novedades
  const filtered = allCuidados.filter((c) => !tiposEvolucion.includes(c.tipo))
  console.log('✅ Plan de cuidados (filtrado):', filtered)
  return filtered
})

const evoluciones = computed(() => {
  const allCuidados = props.internacion?.cuidados || []
  // Filtrar solo evoluciones/novedades de enfermería
  const filtered = allCuidados.filter((c) => tiposEvolucion.includes(c.tipo))
  console.log('✅ Evoluciones (filtrado):', filtered)
  return filtered
})

function getIconForCuidado(tipo) {
  const iconMap = {
    Higiene: 'clean_hands',
    Movilización: 'transfer_within_a_station',
    Alimentación: 'restaurant',
    Medicación: 'medication',
    Curaciones: 'healing',
    Monitoreo: 'monitor_heart',
    Baño: 'bathtub',
    'Cambio de posición': 'screen_rotation',
    Oxigenoterapia: 'air',
    'Cuidado General': 'health_and_safety',
  }
  return iconMap[tipo] || 'health_and_safety'
}

function formatearFechaHora(fecha) {
  if (!fecha) return 'N/A'
  try {
    const date = new Date(fecha.replace(' ', 'T'))
    if (isNaN(date)) return 'N/A'
    return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm 'hs'", { locale: es })
  } catch {
    return 'N/A'
  }
}
</script>

<style scoped>
.cuidados-readonly-container {
  width: 100%;
  padding: 24px;
  background: #f8fafc;
  border-radius: 8px;
}

.section-wrapper {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header-enfermeria {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.empty-icon {
  color: #cbd5e1;
  margin-bottom: 24px;
}

.empty-text h3 {
  font-size: 1.5rem;
  color: #475569;
  margin: 0 0 8px 0;
}

.empty-text p {
  color: #94a3b8;
  margin: 0;
}

.cuidados-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.cuidado-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
}

.cuidado-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(13, 148, 136, 0.15);
}

.cuidado-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  padding: 20px;
  color: white;
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.cuidado-icon {
  color: white;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
}

.cuidado-titulo {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.cuidado-descripcion {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.95;
  line-height: 1.5;
}

.cuidado-body {
  padding: 20px;
  background: white;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-item:last-of-type {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #475569;
  min-width: 120px;
}

.info-value {
  flex: 1;
  color: #1e293b;
  font-weight: 500;
}

.ultimo-registro {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-radius: 12px;
  border: 1px solid #6ee7b7;
}

.registro-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.registro-titulo {
  font-weight: 700;
  color: #065f46;
  font-size: 0.95rem;
}

.registro-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.registro-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #047857;
  font-size: 0.9rem;
}

.registro-row.observacion {
  padding: 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  font-style: italic;
  color: #064e3b;
}

.registro-icon {
  color: #059669;
  flex-shrink: 0;
}

.sin-registro {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: #fef3c7;
  border-radius: 12px;
  border: 1px solid #fde047;
  color: #92400e;
  font-weight: 600;
  margin-top: 16px;
}

.historial-section {
  padding: 0;
  background: #f8fafc;
}

.historial-toggle {
  padding: 12px 16px;
  color: #64748b;
  font-weight: 600;
}

.historial-list {
  background: white;
  max-height: 300px;
  overflow-y: auto;
}

/* Estilos para Evoluciones */
.evoluciones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.evolucion-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: slideInUp 0.5s ease-out backwards;
}

.evolucion-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(13, 148, 136, 0.15);
}

.evolucion-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.evolucion-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.evolucion-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.evolucion-date,
.evolucion-user {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.evolucion-descripcion {
  font-size: 15px;
  line-height: 1.6;
  color: #374151;
  margin: 0;
}

.evolucion-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.footer-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #059669;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .cuidados-readonly-container {
    padding: 16px;
  }

  .cuidados-grid,
  .evoluciones-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .info-item {
    flex-direction: column;
    gap: 4px;
  }

  .info-label {
    min-width: auto;
  }
}
</style>
