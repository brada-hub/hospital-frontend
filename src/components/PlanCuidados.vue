<template>
  <div class="plan-cuidados-container">
    <div class="section-header">
      <q-icon name="medical_services" size="28px" />
      <span>Plan de Cuidados Activos</span>
    </div>

    <div v-if="!plan || plan.length === 0" class="empty-state">
      <q-icon name="assignment" size="64px" />
      <p>Sin plan de cuidados activo.</p>
    </div>

    <div v-else class="cuidados-grid">
      <div
        v-for="(cuidado, index) in plan"
        :key="cuidado.id"
        class="cuidado-card"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <div class="cuidado-card-header">
          <div class="header-content">
            <q-icon name="healing" size="24px" class="header-icon" />
            <div class="header-text">
              <div class="cuidado-tipo">{{ cuidado.tipo }}</div>
              <div class="cuidado-descripcion">{{ cuidado.descripcion }}</div>
            </div>
          </div>
          <q-btn
            unelevated
            class="registrar-btn"
            icon="done"
            label="Registrar"
            @click="abrirDialogoRegistrarCuidado(cuidado)"
          />
        </div>

        <div class="cuidado-card-body">
          <div v-if="cuidado.cuidados_aplicados && cuidado.cuidados_aplicados.length">
            <div class="historial-header">
              <q-icon name="history" size="20px" />
              <span>Historial de Aplicaciones</span>
            </div>
            <div class="aplicaciones-list">
              <div
                v-for="aplicado in cuidado.cuidados_aplicados"
                :key="aplicado.id"
                class="aplicacion-item"
              >
                <div class="aplicacion-icon">
                  <q-icon name="check_circle" color="positive" size="20px" />
                </div>
                <div class="aplicacion-content">
                  <div class="aplicacion-fecha">
                    {{ formatDateTime(aplicado.fecha_aplicacion) }}
                  </div>
                  <div class="aplicacion-usuario">
                    por <strong>{{ aplicado.user.nombre }}</strong>
                  </div>
                  <div v-if="aplicado.observaciones" class="aplicacion-observaciones">
                    <q-icon name="comment" size="14px" />
                    {{ aplicado.observaciones }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="estado-pendiente">
            <q-icon name="warning" size="20px" />
            <span>¡PENDIENTE! No se ha registrado cumplimiento.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { api } from 'boot/axios'
import { Notify, Dialog } from 'quasar'
import { format } from 'date-fns'
import { useUserStore } from 'stores/user'

const userStore = useUserStore()

const { plan } = defineProps({
  plan: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['recargar-pacientes'])

function abrirDialogoRegistrarCuidado(cuidado) {
  const idUsuario = userStore.user?.id
  if (!idUsuario) {
    Notify.create({ color: 'negative', message: 'Error de sesión. Usuario no identificado.' })
    return
  }
  Dialog.create({
    title: `Registrar Cuidado: ${cuidado.tipo}`,
    message: 'Añada observaciones sobre el cuidado realizado.',
    prompt: { model: '', type: 'textarea', label: 'Observaciones (opcional)' },
    cancel: true,
    persistent: true,
  }).onOk(async (observaciones) => {
    try {
      await api.post('/cuidados-aplicados', {
        cuidado_id: cuidado.id,
        observaciones: observaciones,
      })
      Notify.create({
        color: 'positive',
        message: `Cuidado "${cuidado.tipo}" registrado correctamente.`,
      })
      emit('recargar-pacientes')
    } catch {
      Notify.create({ color: 'negative', message: 'Hubo un error al registrar el cuidado.' })
    }
  })
}

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
.plan-cuidados-container {
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
  border-radius: 16px;
  width: 100%;
  height: auto;
  margin-top: 32px;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-state {
  text-align: center;
  padding: 64px 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  color: #9ca3af;
  width: 100%;
}

.empty-state p {
  margin-top: 16px;
  font-size: 16px;
}

.cuidados-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.cuidado-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: slideInUp 0.5s ease-out backwards;
}

.cuidado-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(13, 148, 136, 0.15);
}

.cuidado-card-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 200px;
}

.header-icon {
  color: white;
  flex-shrink: 0;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cuidado-tipo {
  color: white;
  font-size: 18px;
  font-weight: 700;
}

.cuidado-descripcion {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.registrar-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.registrar-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.cuidado-card-body {
  padding: 20px;
}

.historial-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 16px;
}

.aplicaciones-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.aplicacion-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
  border-radius: 12px;
  border-left: 4px solid #10b981;
  transition: all 0.3s ease;
}

.aplicacion-item:hover {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  transform: translateX(4px);
}

.aplicacion-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.aplicacion-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.aplicacion-fecha {
  font-size: 13px;
  color: #1e293b;
  font-weight: 600;
}

.aplicacion-usuario {
  font-size: 12px;
  color: #64748b;
}

.aplicacion-usuario strong {
  color: #0d9488;
  font-weight: 700;
}

.aplicacion-observaciones {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: #475569;
  font-style: italic;
  margin-top: 4px;
  padding: 8px;
  background: white;
  border-radius: 8px;
}

.estado-pendiente {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  border-left: 4px solid #f59e0b;
  color: #92400e;
  font-size: 14px;
  font-weight: 600;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .plan-cuidados-container {
    padding: 20px;
  }

  .cuidados-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .plan-cuidados-container {
    padding: 16px;
  }

  .cuidados-grid {
    grid-template-columns: 1fr;
  }

  .cuidado-card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .registrar-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .plan-cuidados-container {
    padding: 12px;
  }

  .section-header {
    font-size: 18px;
    padding: 10px;
  }

  .cuidado-card {
    border-radius: 12px;
  }

  .cuidado-card-body {
    padding: 14px;
  }
}
</style>
