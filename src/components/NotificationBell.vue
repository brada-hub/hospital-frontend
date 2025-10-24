<template>
  <div class="notification-bell">
    <q-btn flat round dense class="bell-btn">
      <q-icon name="notifications" size="24px" />
      <q-badge
        v-if="unreadCount > 0"
        color="red"
        floating
        rounded
        :label="unreadCount > 99 ? '99+' : unreadCount"
      />

      <q-menu
        anchor="bottom right"
        self="top right"
        :offset="[0, 8]"
        class="notification-menu"
        max-width="420px"
        max-height="600px"
        @show="onMenuShow"
      >
        <div class="notification-header">
          <div class="header-title">
            <q-icon name="notifications_active" size="20px" />
            <span>Notificaciones</span>
            <q-badge v-if="unreadCount > 0" color="red" :label="unreadCount" rounded />
          </div>
          <q-btn
            v-if="unreadCount > 0"
            flat
            dense
            size="sm"
            label="Marcar todas como leídas"
            @click="marcarTodasComoLeidas"
            class="mark-all-btn"
          />
        </div>

        <q-separator />

        <div v-if="loading" class="notification-loading">
          <q-spinner color="primary" size="40px" />
          <p>Cargando notificaciones...</p>
        </div>

        <div v-else-if="notifications.length === 0" class="notification-empty">
          <q-icon name="notifications_none" size="48px" color="grey-5" />
          <p>No tienes notificaciones</p>
        </div>

        <q-list v-else class="notification-list">
          <q-item
            v-for="notif in notifications"
            :key="notif.id"
            clickable
            v-ripple
            :class="['notification-item', { 'notification-unread': !notif.leida }]"
            @click="handleNotificationClick(notif)"
          >
            <q-item-section avatar>
              <q-avatar
                :color="getNotificationColor(notif.tipo)"
                text-color="white"
                :icon="getNotificationIcon(notif.tipo)"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="notification-title">
                {{ notif.titulo }}
              </q-item-label>
              <q-item-label caption class="notification-message" lines="2">
                {{ notif.mensaje }}
              </q-item-label>
              <q-item-label caption class="notification-time">
                {{ formatearFecha(notif.created_at) }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="close"
                @click.stop="eliminarNotificacion(notif.id)"
                class="delete-btn"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from 'boot/axios'
import { Notify } from 'quasar'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const router = useRouter()
const notifications = ref([])
const loading = ref(false)

const unreadCount = computed(() => {
  return notifications.value.filter((n) => !n.leida).length
})

const onMenuShow = () => {
  fetchNotifications()
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const response = await api.get('/notificaciones', {
      params: { limit: 20 },
    })
    notifications.value = response.data
  } catch (error) {
    console.error('Error al cargar notificaciones:', error)
    Notify.create({
      color: 'negative',
      message: 'Error al cargar notificaciones',
      icon: 'error',
    })
  } finally {
    loading.value = false
  }
}

const marcarTodasComoLeidas = async () => {
  try {
    await api.post('/notificaciones/leer-todas')
    notifications.value.forEach((n) => (n.leida = true))
    Notify.create({
      color: 'positive',
      message: 'Todas las notificaciones marcadas como leídas',
      icon: 'check_circle',
    })
  } catch (error) {
    console.error('[v0] Error al marcar notificaciones:', error)
    Notify.create({
      color: 'negative',
      message: 'Error al marcar notificaciones',
    })
  }
}

const handleNotificationClick = async (notif) => {
  console.log('[v0] Notification clicked:', notif)

  // Mark as read
  if (!notif.leida) {
    try {
      await api.patch(`/notificaciones/${notif.id}/leer`)
      notif.leida = true
    } catch (error) {
      console.error('[v0] Error al marcar como leída:', error)
    }
  }

  // Navigate to patient's internacion panel
  if (notif.internacion_id) {
    try {
      console.log('[v0] Navigating to internacion:', notif.internacion_id)
      // Adjust the route path according to your router configuration
      // Common patterns: '/internaciones/:id', '/pacientes/internacion/:id', '/panel-internacion/:id'
      await router.push({
        path: '/mis-pacientes',
        query: { internacion: notif.internacion_id },
      })
    } catch (error) {
      console.error('[v0] Error al navegar:', error)
      Notify.create({
        color: 'negative',
        message: 'Error al abrir el panel del paciente',
        icon: 'error',
      })
    }
  } else {
    console.warn('[v0] Notification has no internacion_id')
  }
}

const eliminarNotificacion = async (id) => {
  try {
    await api.delete(`/notificaciones/${id}`)
    notifications.value = notifications.value.filter((n) => n.id !== id)
    Notify.create({
      color: 'positive',
      message: 'Notificación eliminada',
      icon: 'delete',
    })
  } catch (error) {
    console.error('[v0] Error al eliminar notificación:', error)
    Notify.create({
      color: 'negative',
      message: 'Error al eliminar notificación',
    })
  }
}

const getNotificationColor = (tipo) => {
  const colors = {
    critica: 'red',
    advertencia: 'orange',
    recordatorio: 'blue',
  }
  return colors[tipo] || 'grey'
}

const getNotificationIcon = (tipo) => {
  const icons = {
    critica: 'warning',
    advertencia: 'info',
    recordatorio: 'event',
  }
  return icons[tipo] || 'notifications'
}

const formatearFecha = (fecha) => {
  try {
    return formatDistanceToNow(new Date(fecha), {
      addSuffix: true,
      locale: es,
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return fecha
  }
}

onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.bell-btn {
  color: #64748b;
  transition: all 0.2s ease;
}

.bell-btn:hover {
  color: #14b8a6;
  background: rgba(20, 184, 166, 0.1);
}

.notification-menu {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.notification-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.mark-all-btn {
  color: white;
  font-size: 12px;
  opacity: 0.9;
}

.mark-all-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

.notification-loading,
.notification-empty {
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
}

.notification-loading p,
.notification-empty p {
  margin-top: 12px;
  font-size: 14px;
}

.notification-list {
  max-height: 500px;
  overflow-y: auto;
}

.notification-item {
  padding: 16px 20px;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f1f5f9;
}

.notification-item:hover {
  background: #f8fafc;
}

.notification-unread {
  background: #f0fdfa;
  border-left: 3px solid #14b8a6;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: #94a3b8;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
</style>
