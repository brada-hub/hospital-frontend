<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-2">
    <!-- Drawer (sidebar) -->
    <q-drawer v-model="drawer" show-if-above bordered class="bg-primary text-white">
      <div class="q-pa-md flex items-center">
        <q-icon name="local_hospital" size="32px" color="teal-2" />
        <div class="text-h6 q-ml-sm">Mi Hospital</div>
      </div>

      <q-list padding>
        <q-item clickable v-ripple to="/dashboard" exact>
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/gestion-hospital">
          <q-item-section avatar><q-icon name="business" /></q-item-section>
          <q-item-section>Gestión de Hospital</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/pacientes">
          <q-item-section avatar><q-icon name="groups" /></q-item-section>
          <q-item-section>Gestión de Pacientes</q-item-section>
        </q-item>

        <!-- Solo visible si es admin -->
        <q-item clickable v-ripple to="/usuarios" v-if="isAdmin">
          <q-item-section avatar><q-icon name="admin_panel_settings" /></q-item-section>
          <q-item-section>Usuarios y Roles</q-item-section>
        </q-item>
      </q-list>

      <!-- Botón de logout -->
      <div class="absolute-bottom q-pa-md">
        <q-btn flat round color="white" icon="logout" label="Cerrar sesión" @click="cerrarSesion" />
      </div>
    </q-drawer>

    <!-- Header -->
    <q-header elevated class="bg-white text-primary">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="drawer = !drawer" class="q-mr-sm" />

        <q-toolbar-title class="text-dark">
          <span class="text-h6">Dashboard Principal</span>
        </q-toolbar-title>

        <q-btn dense flat round icon="notifications" color="primary">
          <q-badge floating color="red" label="2" />
        </q-btn>

        <q-btn flat round dense icon="account_circle" color="primary" />
      </q-toolbar>
    </q-header>

    <!-- Contenido -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from 'stores/user'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const drawer = ref(true)
const userStore = useUserStore()
const router = useRouter()

// Validar si es admin (rol_id === 1)
const isAdmin = userStore.user?.rol_id === 1

// Función de logout con redirección
const cerrarSesion = async () => {
  await userStore.logout()
  router.push('/')
  $q.notify({
    type: 'positive',
    message: 'Sesión cerrada correctamente',
    position: 'top-right',
    icon: 'logout',
  })
}
</script>

<style scoped>
.q-drawer {
  width: 250px;
}
</style>
