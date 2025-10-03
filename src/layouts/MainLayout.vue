<template>
  <q-layout view="lHh Lpr fFf" class="main-layout">
    <q-drawer v-model="drawer" show-if-above bordered class="elegant-drawer" :width="280">
      <div class="drawer-header">
        <div class="hospital-icon-container">
          <q-icon name="local_hospital" size="28px" class="hospital-icon" />
        </div>
        <div class="hospital-info">
          <div class="hospital-name">{{ hospitalName || 'Mi Hospital' }}</div>
          <div class="hospital-subtitle">Sistema de Gestión</div>
        </div>
      </div>
      <q-list class="navigation-menu">
        <q-item
          clickable
          v-ripple
          to="/dashboard"
          exact
          class="nav-item"
          active-class="nav-item-active"
          v-if="userStore.hasPermission('acceso.dashboard')"
          ><q-item-section avatar><q-icon name="dashboard" class="nav-icon" /></q-item-section
          ><q-item-section
            ><q-item-label class="nav-label">Dashboard</q-item-label></q-item-section
          ></q-item
        >
        <q-item
          clickable
          v-ripple
          to="/gestion-hospital"
          class="nav-item"
          active-class="nav-item-active"
          v-if="userStore.hasPermission('acceso.gestion-hospital')"
          ><q-item-section avatar><q-icon name="business" class="nav-icon" /></q-item-section
          ><q-item-section
            ><q-item-label class="nav-label">Gestión de Hospital</q-item-label></q-item-section
          ></q-item
        >
        <q-item
          clickable
          v-ripple
          to="/admision"
          class="nav-item"
          active-class="nav-item-active"
          v-if="userStore.hasPermission('acceso.admision')"
          ><q-item-section avatar><q-icon name="login" class="nav-icon" /></q-item-section
          ><q-item-section
            ><q-item-label class="nav-label">Admisión de Pacientes</q-item-label></q-item-section
          ></q-item
        >
        <q-item
          clickable
          v-ripple
          to="/pacientes"
          class="nav-item"
          active-class="nav-item-active"
          v-if="userStore.hasPermission('acceso.pacientes')"
          ><q-item-section avatar><q-icon name="groups" class="nav-icon" /></q-item-section
          ><q-item-section
            ><q-item-label class="nav-label">Gestión de Pacientes</q-item-label></q-item-section
          ></q-item
        >
        <q-item
          clickable
          v-ripple
          to="/usuarios-y-roles"
          class="nav-item"
          active-class="nav-item-active"
          v-if="userStore.hasPermission('acceso.usuarios-y-roles')"
          ><q-item-section avatar
            ><q-icon name="admin_panel_settings" class="nav-icon" /></q-item-section
          ><q-item-section
            ><q-item-label class="nav-label">Usuarios y Roles</q-item-label></q-item-section
          ></q-item
        >
        <q-item
          clickable
          v-ripple
          to="/medicamentos"
          class="nav-item"
          active-class="nav-item-active"
          v-if="userStore.hasPermission('acceso.medicamentos')"
          ><q-item-section avatar><q-icon name="medication" class="nav-icon" /></q-item-section
          ><q-item-section
            ><q-item-label class="nav-label">Gestión de Farmacia</q-item-label></q-item-section
          ></q-item
        >
        <q-item
          clickable
          v-ripple
          to="/mis-pacientes"
          class="nav-item"
          active-class="nav-item-active"
          v-if="userStore.hasPermission('acceso.mis-pacientes')"
        >
          <q-item-section avatar
            ><q-icon name="medication_liquid" class="nav-icon"
          /></q-item-section>
          <q-item-section>
            <q-item-label class="nav-label">Mis Pacientes</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/estacion-enfermeria"
          class="nav-item"
          active-class="nav-item-active"
          v-if="userStore.hasPermission('acceso.estacion-enfermeria')"
        >
          <q-item-section avatar><q-icon name="local_pharmacy" class="nav-icon" /></q-item-section>
          <q-item-section
            ><q-item-label class="nav-label">Estación de Enfermería</q-item-label></q-item-section
          >
        </q-item>
      </q-list>

      <div class="drawer-footer">
        <q-btn
          flat
          class="logout-btn"
          icon="logout"
          label="Cerrar sesión"
          @click="cerrarSesion"
          no-caps
        />
      </div>
    </q-drawer>

    <q-header class="elegant-header" height-hint="64">
      <q-toolbar class="header-toolbar">
        <q-btn flat dense round icon="menu" @click="drawer = !drawer" class="menu-btn" />
        <q-toolbar-title class="header-title">
          <span class="title-text">Dashboard Principal</span>
        </q-toolbar-title>
        <div class="header-actions">
          <q-btn flat round dense icon="account_circle" class="action-btn profile-btn">
            <q-menu anchor="bottom right" self="top right" class="profile-menu">
              <div class="user-info-header q-pa-md text-white">
                <div class="text-weight-bold">{{ userName }}</div>
                <div class="text-caption">{{ userRole }}</div>
              </div>
              <q-list style="min-width: 230px">
                <q-item
                  clickable
                  v-ripple
                  @click="openProfileModal('profile')"
                  v-close-popup
                  class="profile-menu-item"
                >
                  <q-item-section avatar><q-icon name="person" /></q-item-section>
                  <q-item-section>Mi Perfil</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-ripple
                  @click="openProfileModal('password')"
                  v-close-popup
                  class="profile-menu-item"
                >
                  <q-item-section avatar><q-icon name="lock_reset" /></q-item-section>
                  <q-item-section>Cambiar Contraseña</q-item-section>
                </q-item>
                <q-separator spaced />
                <q-item
                  clickable
                  v-ripple
                  @click="cerrarSesion"
                  v-close-popup
                  class="profile-menu-item-logout"
                >
                  <q-item-section avatar><q-icon name="logout" /></q-item-section>
                  <q-item-section>Cerrar Sesión</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container class="page-container">
      <router-view />
    </q-page-container>

    <UserProfileModal v-model="showProfileModal" :initial-tab="activeTab" />
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from 'stores/user'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import UserProfileModal from 'components/UserProfileModal.vue'

const userStore = useUserStore()
const $q = useQuasar()
const router = useRouter()

const hospitalName = computed(() => userStore.hospital?.nombre || 'Mi Hospital')
const userName = computed(() =>
  userStore.user ? `${userStore.user.nombre} ${userStore.user.apellidos}` : 'Usuario',
)
const userRole = computed(() => userStore.user?.rol?.nombre || 'Sin Rol Asignado')

// Lógica para manejar el modal
const showProfileModal = ref(false)
const activeTab = ref('profile')

const openProfileModal = (initialTab = 'profile') => {
  activeTab.value = initialTab
  showProfileModal.value = true
}

// TU FUNCIÓN CERRAR SESIÓN ORIGINAL
const cerrarSesion = async () => {
  await userStore.logout()
  router.push('/login')
  $q.notify({
    type: 'positive',
    message: 'Sesión cerrada correctamente',
    position: 'top-right',
    icon: 'logout',
  })
}

const drawer = ref(true)
</script>

<style scoped>
/* TUS ESTILOS ORIGINALES */
.main-layout {
  background: #f8fafc;
}
.elegant-drawer {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-right: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.drawer-header {
  padding: 24px 20px;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
}
.drawer-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
}
.hospital-icon-container {
  background: rgba(255, 255, 255, 0.2);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}
.hospital-icon {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}
.hospital-info {
  flex: 1;
}
.hospital-name {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 4px;
}
.hospital-subtitle {
  font-size: 13px;
  opacity: 0.9;
  font-weight: 400;
}
.navigation-menu {
  padding: 16px 8px;
}
.nav-item {
  border-radius: 12px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  color: #64748b;
}
.nav-item:hover {
  background: rgba(20, 184, 166, 0.08);
  color: #14b8a6;
}
.nav-item-active {
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
  color: #14b8a6;
  border-left: 3px solid #14b8a6;
}
.nav-icon {
  font-size: 20px;
  transition: all 0.2s ease;
}
.nav-item:hover .nav-icon,
.nav-item-active .nav-icon {
  color: #14b8a6;
  transform: scale(1.1);
}
.nav-label {
  font-weight: 500;
  font-size: 14px;
}
.drawer-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(180deg, transparent 0%, rgba(248, 250, 252, 0.8) 100%);
  backdrop-filter: blur(10px);
}
.logout-btn {
  width: 100%;
  color: #64748b;
  font-weight: 500;
  padding: 12px 16px;
  border-radius: 10px;
  transition: all 0.2s ease;
}
.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
.elegant-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.header-toolbar {
  padding: 0 24px;
  min-height: 64px;
}
.menu-btn {
  color: #64748b;
  margin-right: 16px;
  transition: all 0.2s ease;
}
.menu-btn:hover {
  color: #14b8a6;
  background: rgba(20, 184, 166, 0.1);
}
.header-title {
  flex: 1;
}
.title-text {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.action-btn {
  color: #64748b;
  transition: all 0.2s ease;
}
.action-btn:hover {
  color: #14b8a6;
  background: rgba(20, 184, 166, 0.1);
}
.profile-btn {
  margin-left: 8px;
}
.page-container {
  background: #f8fafc;
}
@media (max-width: 1023px) {
  .elegant-drawer {
    width: 280px;
  }
  .header-toolbar {
    padding: 0 16px;
  }
  .title-text {
    font-size: 18px;
  }
}
@media (max-width: 599px) {
  .drawer-header {
    padding: 20px 16px;
  }
  .hospital-name {
    font-size: 16px;
  }
  .hospital-subtitle {
    font-size: 12px;
  }
  .title-text {
    font-size: 16px;
  }
}

/* ESTILOS NUEVOS PARA EL MENÚ DE PERFIL */
.profile-menu {
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.user-info-header {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
}
.profile-menu-item .q-item__section--avatar {
  color: #64748b;
  min-width: 40px;
}
.profile-menu-item:hover {
  background: rgba(20, 184, 166, 0.08);
  color: #14b8a6;
}
.profile-menu-item:hover .q-item__section--avatar {
  color: #14b8a6;
}
.profile-menu-item-logout:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
.profile-menu-item-logout:hover .q-item__section--avatar {
  color: #ef4444;
}
</style>
