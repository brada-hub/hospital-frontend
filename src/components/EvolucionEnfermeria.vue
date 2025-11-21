<template>
  <div class="evolucion-container">
    <div class="evolucion-header">
      <div class="header-content">
        <div class="header-icon">
          <q-icon name="event_note" size="28px" />
        </div>
        <h2 class="header-title">Evolución y Novedades de Enfermería</h2>
      </div>
    </div>

    <div v-if="!evoluciones || !evoluciones.length" class="empty-state">
      <div class="empty-icon">
        <q-icon name="description" size="64px" />
      </div>
      <p class="empty-text">Sin novedades registradas</p>
      <p class="empty-subtext">Las evoluciones de enfermería aparecerán aquí</p>
    </div>

    <div v-else class="evoluciones-grid">
      <div
        v-for="(evento, index) in evoluciones"
        :key="evento.id"
        class="evolucion-card"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <div class="card-header">
          <div class="card-icon">
            <q-icon name="medical_services" size="20px" />
          </div>
          <div class="card-meta">
            <div class="card-date">
              <q-icon name="schedule" size="16px" class="meta-icon" />
              <span v-if="evento.cuidados_aplicados && evento.cuidados_aplicados.length">
                {{ formatDateTime(evento.cuidados_aplicados[0].fecha_aplicacion) }}
              </span>
              <span v-else>Fecha no disponible</span>
            </div>
            <div
              v-if="evento.cuidados_aplicados && evento.cuidados_aplicados.length"
              class="card-user"
            >
              <q-icon name="person" size="16px" class="meta-icon" />
              <span class="user-name">{{ evento.cuidados_aplicados[0].user.nombre }}</span>
            </div>
          </div>
        </div>

        <div class="card-content">
          <p class="card-description">{{ evento.descripcion }}</p>
        </div>

        <div class="card-footer">
          <div class="footer-badge">
            <q-icon name="check_circle" size="14px" />
            <span>Registrado</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { format } from 'date-fns'

const { evoluciones } = defineProps({
  evoluciones: {
    type: Array,
    default: () => [],
  },
})

// <CHANGE> Función corregida para manejar correctamente la zona horaria de Bolivia
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A'
  try {
    // Parsear la fecha de Laravel sin forzar UTC
    const date = new Date(dateTimeString.toString().replace(' ', 'T'))
    if (isNaN(date)) return 'N/A'
    return format(date, 'dd/MM/yyyy HH:mm')
  } catch {
    return 'N/A'
  }
}
</script>

<style scoped>
/* === CONTENEDOR PRINCIPAL === */
.evolucion-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
  border-radius: 16px;
  height: auto;
}

/* === HEADER === */
.evolucion-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 8px rgba(13, 148, 136, 0.15);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  backdrop-filter: blur(10px);
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0;
}

/* === ESTADO VACÍO === */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  background: white;
  border-radius: 16px;
  border: 2px dashed #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
  animation: fadeIn 0.5s ease-out;
}

.empty-icon {
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
  border-radius: 50%;
  margin-bottom: 24px;
  color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.empty-text {
  font-size: 20px;
  font-weight: 600;
  color: #059669;
  margin: 0 0 8px 0;
}

.empty-subtext {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* === GRID === */
.evoluciones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

/* === TARJETAS === */
.evolucion-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  opacity: 0;
  animation: slideInUp 0.5s ease forwards;
}

.evolucion-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(13, 148, 136, 0.15);
  border-color: #10b981;
}

/* === HEADER TARJETA === */
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.card-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.card-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-date,
.card-user {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
}

.meta-icon {
  color: #10b981;
}

.user-name {
  font-weight: 600;
  color: #059669;
}

/* === CONTENIDO === */
.card-content {
  margin-bottom: 16px;
}

.card-description {
  font-size: 15px;
  line-height: 1.6;
  color: #374151;
  margin: 0;
  word-wrap: break-word;
}

/* === FOOTER TARJETA === */
.card-footer {
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

/* === ANIMACIONES === */
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* === RESPONSIVE === */
@media (max-width: 1024px) {
  .evolucion-container {
    padding: 20px;
  }
  .evoluciones-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (max-width: 768px) {
  .evolucion-container {
    padding: 16px;
  }
  .evoluciones-grid {
    grid-template-columns: 1fr;
  }
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-title {
    font-size: 20px;
  }
  .empty-state {
    padding: 48px 20px;
  }
}

@media (max-width: 480px) {
  .evolucion-container {
    padding: 12px;
  }
  .header-title {
    font-size: 18px;
  }
  .evolucion-card {
    padding: 16px;
    border-radius: 12px;
  }
  .card-description {
    font-size: 14px;
  }
}
</style>
