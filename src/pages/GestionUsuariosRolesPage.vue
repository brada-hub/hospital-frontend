<template>
  <div class="salas-container">
    <div class="header-section">
      <h2 class="titulo-principal">Gestión de Usuarios y Roles</h2>
    </div>

    <q-card class="sala-card">
      <q-tabs
        v-model="activeTab"
        dense
        class="elegant-tabs"
        active-color="teal-6"
        indicator-color="teal-6"
        align="justify"
      >
        <q-tab
          name="gestionar-usuarios"
          icon="group"
          label="Gestionar Usuarios"
          class="elegant-tab"
        />
        <q-tab
          name="roles-permisos"
          icon="lock_person"
          label="Roles y Permisos"
          class="elegant-tab"
        />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated class="elegant-panels">
        <q-tab-panel name="gestionar-usuarios" class="q-pa-none">
          <GestionarUsuarios :roles="rols" :all-permissions="allPermissions" />
        </q-tab-panel>

        <q-tab-panel name="roles-permisos" class="q-pa-none">
          <RolesPermisos
            :roles="rols"
            :all-permissions="allPermissions"
            @roles-updated="fetchRols"
          />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import GestionarUsuarios from 'src/components/usuarios/GestionarUsuarios.vue'
import RolesPermisos from 'src/components/usuarios/RolesPermisos.vue'

const $q = useQuasar()
const activeTab = ref('gestionar-usuarios')

// Datos compartidos que el padre gestionará
const rols = ref([])
const allPermissions = ref([])

const fetchRols = async () => {
  try {
    const response = await api.get('/rols')
    rols.value = response.data
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error al cargar roles' })
  }
}

const fetchAllPermissions = async () => {
  try {
    const response = await api.get('/permissions')
    allPermissions.value = response.data
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error al cargar permisos' })
  }
}

onMounted(() => {
  fetchRols()
  fetchAllPermissions()
})
</script>

<style scoped>
/* Estilos generales del contenedor y las pestañas */
.salas-container {
  padding: 24px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}
.titulo-principal {
  background: linear-gradient(135deg, #0f3027 0%, #082f49 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 900;
  font-size: 1.75rem;
  margin: 0;
}
.sala-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* Estilos para Pestañas (Tabs) */
.elegant-tabs {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.elegant-tab {
  font-weight: 600;
}
.elegant-panels {
  background: transparent;
}
.q-tab-panel {
  padding: 16px;
}
</style>
