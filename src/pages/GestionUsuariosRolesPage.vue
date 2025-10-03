<template>
  <div class="page-container">
    <div class="page-header">
      <h4 class="page-title">Gestión de Usuarios y Roles</h4>
      <p class="page-subtitle">Administra los usuarios y define los roles del sistema</p>
    </div>

    <q-card class="elegant-card" flat bordered>
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

      <q-separator class="elegant-separator" />

      <q-tab-panels v-model="activeTab" animated class="elegant-panels">
        <q-tab-panel name="gestionar-usuarios" class="q-pa-none elegant-tab-panel">
          <GestionarUsuarios :roles="rols" :all-permissions="allPermissions" />
        </q-tab-panel>

        <q-tab-panel name="roles-permisos" class="q-pa-none elegant-tab-panel">
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
// El script no necesita cambios, la lógica se mantiene
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import GestionarUsuarios from 'src/components/usuarios/GestionarUsuarios.vue'
import RolesPermisos from 'src/components/usuarios/RolesPermisos.vue'

const $q = useQuasar()
const activeTab = ref('gestionar-usuarios')

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

---

<style scoped>
.page-container {
  padding: 24px;
  background: #f8fafc;
}

.page-header {
  margin-bottom: 32px;
  flex-shrink: 0; /* ✨ No se encoge */
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 2.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}

.page-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 1.125rem;
}

.elegant-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background: white;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  position: relative;
  flex-grow: 1; /* ✨ La tarjeta crece para llenar el espacio vertical */
  display: flex; /* ✨ Y se convierte en un flexbox para organizar su contenido */
  flex-direction: column; /* ✨ En columna */
}

.elegant-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  z-index: 2;
}

.elegant-tabs {
  background: #f8fafc;
  padding: 8px;
  flex-shrink: 0; /* ✨ No se encoge */
}

.elegant-tab {
  font-weight: 600;
  transition: all 0.2s ease;
}

.elegant-tab:hover {
  background-color: rgba(20, 184, 166, 0.1);
  border-radius: 8px;
}

.elegant-separator {
  background: linear-gradient(90deg, transparent 0%, #14b8a6 50%, transparent 100%);
  height: 1px;
  opacity: 0.5;
  flex-shrink: 0; /* ✨ No se encoge */
}

.elegant-panels {
  background: white;
  /* ❌ Se eliminaron las reglas de flexbox */
}

.elegant-tab-panel {
  /* No necesita estilos especiales aquí */
  padding: 0 !important;
}
</style>
