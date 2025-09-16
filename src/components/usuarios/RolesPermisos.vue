<template>
  <div>
    <div class="header-section">
      <h2 class="titulo-secundario">Roles Definidos</h2>
      <q-btn
        class="btn-agregar"
        label="Crear Rol"
        icon="add"
        @click="openAddRolDialog"
        no-caps
        rounded
      />
    </div>
    <div class="salas-grid">
      <div v-for="rol in roles" :key="rol.id" class="sala-card-rol">
        <div class="card-header">
          <div class="sala-info">
            <q-icon name="shield" class="sala-icon" size="2rem" />
            <div class="sala-details">
              <span class="sala-label">ROL:</span>
              <h3 class="sala-nombre">{{ rol.nombre }}</h3>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="info-item">
            <q-icon name="description" class="info-icon" />
            <span class="info-label">Descripción:</span>
            <span class="info-value">{{ rol.descripcion }}</span>
          </div>
          <q-separator class="q-my-md" />
          <div class="info-item items-start">
            <q-icon name="checklist" class="info-icon" />
            <span class="info-label">Permisos:</span>
            <div class="info-value">
              <div v-if="rol.permissions.length > 0">
                <q-chip
                  v-for="permiso in rol.permissions"
                  :key="permiso.id"
                  dense
                  class="permiso-chip"
                  :label="permiso.nombre"
                />
              </div>
              <div v-else class="text-grey-7">Sin permisos.</div>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <q-btn
            flat
            dense
            class="btn-editar"
            icon="edit"
            label="Editar"
            @click="openEditRolDialog(rol)"
            no-caps
          />
          <q-btn
            flat
            dense
            class="btn-inactivar"
            icon="delete"
            label="Eliminar"
            @click="deleteRol(rol)"
            no-caps
          />
        </div>
      </div>
    </div>

    <q-dialog v-model="rolDialog" persistent>
      <q-card class="dialog-card" style="max-width: 700px">
        <q-form @submit.prevent="saveRolAndPermissions">
          <q-card-section class="dialog-header">
            <div class="dialog-title">{{ rolForm.id ? 'Editar Rol' : 'Añadir Rol' }}</div>
          </q-card-section>
          <q-card-section class="dialog-content">
            <q-input
              v-model="rolForm.nombre"
              label="Nombre del Rol"
              outlined
              dense
              class="input-field"
            />
            <q-input
              v-model="rolForm.descripcion"
              label="Descripción"
              outlined
              dense
              class="input-field"
            />
            <div class="text-subtitle1 q-mt-lg">Permisos del Rol</div>
            <q-list bordered separator class="q-mt-sm permission-list">
              <q-item v-for="permiso in allPermissions" :key="permiso.id" tag="label" v-ripple>
                <q-item-section side top>
                  <q-checkbox v-model="rolPermissions" :val="permiso.id" color="teal" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ permiso.nombre }}</q-item-label>
                  <q-item-label caption>{{ permiso.descripcion }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancelar" v-close-popup class="btn-cancelar" />
            <q-btn label="Guardar" type="submit" class="btn-guardar" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'

// Recibimos los datos del padre
// eslint-disable-next-line no-unused-vars
const props = defineProps({
  roles: { type: Array, required: true },
  allPermissions: { type: Array, required: true },
})

// Definimos el evento que vamos a emitir al padre
const emit = defineEmits(['roles-updated'])

const $q = useQuasar()
const rolDialog = ref(false)
const rolForm = ref({})
const rolPermissions = ref([])

const openAddRolDialog = () => {
  rolForm.value = { nombre: '', descripcion: '' }
  rolPermissions.value = []
  rolDialog.value = true
}

const openEditRolDialog = (rol) => {
  rolForm.value = { ...rol }
  rolPermissions.value = rol.permissions.map((p) => p.id)
  rolDialog.value = true
}

const saveRolAndPermissions = async () => {
  try {
    let rolResponse
    if (rolForm.value.id) {
      rolResponse = await api.put(`/rols/${rolForm.value.id}`, rolForm.value)
    } else {
      rolResponse = await api.post('/rols', rolForm.value)
    }
    await api.put(`/rols/${rolResponse.data.id}/permissions`, { permissions: rolPermissions.value })
    emit('roles-updated') // Notificamos al padre que los roles cambiaron
    $q.notify({ type: 'positive', message: 'Rol y permisos actualizados' })
    rolDialog.value = false
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error al guardar rol' })
  }
}

const deleteRol = async (rol) => {
  $q.dialog({
    title: 'Confirmar Eliminación',
    message: `¿Estás seguro de que quieres eliminar el rol "${rol.nombre}"?`,
    cancel: { label: 'Cancelar', flat: true, color: 'grey-8' },
    ok: { label: 'Eliminar', color: 'white', class: 'bg-red-6' },
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/rols/${rol.id}`)
      emit('roles-updated') // Notificamos al padre que los roles cambiaron
      $q.notify({ type: 'positive', message: 'Rol eliminado' })
    } catch (e) {
      console.error(e)
      $q.notify({ type: 'negative', message: 'Error al eliminar rol' })
    }
  })
}
</script>

<style scoped>
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.titulo-secundario {
  font-size: 1.25rem;
  font-weight: 600;
  color: #334155;
}
.btn-agregar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  font-weight: 700;
  padding: 10px 20px;
}
/* Estilos para Tarjetas de Roles */
.salas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}
.sala-card-rol {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.card-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  padding: 16px;
}
.sala-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.sala-details {
  display: flex;
  flex-direction: column;
}
.sala-label {
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.8;
  text-transform: uppercase;
}
.sala-nombre {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}
.card-body {
  padding: 16px;
  background: #f8fafc;
  flex-grow: 1;
}
.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #475569;
}
.info-label {
  font-weight: 600;
  color: #334155;
}
.info-value {
  flex: 1;
  word-break: break-word;
}
.info-icon {
  margin-top: 3px;
  color: #94a3b8;
}
.permiso-chip {
  margin: 2px;
  background-color: #e0f2f1;
  color: #00796b;
  font-weight: 500;
}
.card-actions {
  padding: 8px;
  display: flex;
  gap: 8px;
  background: #f1f5f9;
  border-top: 1px solid #e2e8f0;
}
.btn-editar,
.btn-inactivar {
  flex: 1;
  font-weight: 600;
  border-radius: 8px;
  color: white;
}
.btn-editar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
}
.btn-inactivar {
  background: linear-gradient(135deg, #be123c 0%, #dc2626 100%);
}

/* Estilos para Listas de Permisos */
.permission-list {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  max-height: 300px;
  overflow-y: auto;
}

/* Estilos para Modales (estandarizados) */
.dialog-card {
  width: 90vw;
  max-width: 500px;
  border-radius: 16px;
  overflow: hidden;
}
.dialog-header {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  padding: 16px 24px;
}
.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
}
.dialog-content {
  padding: 24px;
}
.input-field {
  margin-bottom: 16px;
}
.dialog-actions {
  padding: 16px 24px;
  background-color: #f8fafc;
  border-top: 1px solid #e5e7eb;
}
.btn-cancelar {
  color: #64748b;
  font-weight: 600;
}
.btn-guardar {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  border-radius: 12px;
  padding: 8px 24px;
  font-weight: 600;
}
</style>
