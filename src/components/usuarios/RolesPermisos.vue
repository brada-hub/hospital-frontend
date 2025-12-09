<template>
  <div class="roles-container">
    <div class="header-section">
      <h2 class="titulo-principal">Roles y Permisos</h2>
      <q-btn
        class="btn-agregar"
        label="Crear Rol"
        icon="add"
        @click="openAddRolDialog"
        no-caps
        rounded
      />
    </div>
    <div class="roles-grid">
      <div v-for="rol in roles" :key="rol.id" class="rol-card">
        <div class="card-header">
          <div class="rol-info">
            <q-icon name="shield" class="rol-icon" size="2rem" />
            <div class="rol-details">
              <span class="rol-label">ROL:</span>
              <h3 class="rol-nombre">{{ rol.nombre }}</h3>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="info-item">
            <q-icon name="description" class="info-icon" />
            <span class="info-label">Descripción:</span>
            <span class="info-value">{{ rol.descripcion || 'N/A' }}</span>
          </div>
          <q-separator class="q-my-md" />
          <div class="info-item-permissions">
            <q-icon name="checklist" class="info-icon" />
            <span class="info-label">Permisos:</span>
            <div class="permisos-value">
              <div v-if="rol.permissions.length > 0" class="permisos-list">
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
            class="btn-eliminar"
            icon="delete"
            label="Eliminar"
            @click="deleteRol(rol)"
            no-caps
          />
        </div>
      </div>
    </div>
    <q-dialog v-model="rolDialog" persistent @hide="resetForm">
      <q-card class="dialog-card scrollable-dialog" style="max-width: 700px">
        <q-form @submit.prevent="saveRolAndPermissions">
          <q-card-section class="dialog-header">
            <div class="dialog-title">{{ rolForm.id ? 'Editar Rol' : 'Añadir Rol' }}</div>
          </q-card-section>

          <q-card-section class="dialog-content">
            <q-input
              v-model="rolForm.nombre"
              label="Nombre del Rol *"
              outlined
              dense
              class="input-field"
              lazy-rules
              :rules="[
                (val) => !!val || 'El nombre es requerido',
                (val) => val.length <= 50 || 'Máximo 50 caracteres',
                (val) =>
                  /^[\p{L}\s\-]*$/u.test(val) || 'Solo se permiten letras, espacios y guiones',
              ]"
              :error="!!validationErrors.nombre"
              :error-message="validationErrors.nombre"
            />
            <q-input
              v-model="rolForm.descripcion"
              label="Descripción"
              outlined
              dense
              class="input-field"
              lazy-rules
              :rules="[
                (val) => val.length <= 255 || 'Máximo 255 caracteres',
                (val) =>
                  !val ||
                  /^[\p{L}\s\-]*$/u.test(val) ||
                  'Solo se permiten letras, espacios y guiones',
              ]"
              :error="!!validationErrors.descripcion"
              :error-message="validationErrors.descripcion"
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
            <q-btn label="Guardar" type="submit" class="btn-guardar" :loading="isSaving" />
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

defineProps({
  roles: { type: Array, required: true },
  allPermissions: { type: Array, required: true },
})

const emit = defineEmits(['roles-updated'])
const $q = useQuasar()

// --- Estado del componente ---
const rolDialog = ref(false)
const rolForm = ref({})
const rolPermissions = ref([])
const isSaving = ref(false)
const validationErrors = ref({}) // ✅ Para guardar errores del backend

// --- Funciones ---
const resetForm = () => {
  rolForm.value = { nombre: '', descripcion: '' }
  rolPermissions.value = []
  validationErrors.value = {}
}

const openAddRolDialog = () => {
  resetForm()
  rolDialog.value = true
}

const openEditRolDialog = (rol) => {
  resetForm()
  rolForm.value = { ...rol }
  rolPermissions.value = rol.permissions.map((p) => p.id)
  rolDialog.value = true
}

const saveRolAndPermissions = async () => {
  isSaving.value = true
  validationErrors.value = {} // Limpiar errores previos

  try {
    let rolResponse
    if (rolForm.value.id) {
      rolResponse = await api.put(`/rols/${rolForm.value.id}`, rolForm.value)
    } else {
      rolResponse = await api.post('/rols', rolForm.value)
    }

    await api.put(`/rols/${rolResponse.data.id}/permissions`, {
      permissions: rolPermissions.value,
    })
    emit('roles-updated')
    $q.notify({ type: 'positive', message: 'Rol y permisos actualizados correctamente.' })
    rolDialog.value = false
  } catch (e) {
    console.error('Error al guardar rol:', e)
    // ✅ MANEJO DE ERRORES MEJORADO
    if (e.response && e.response.status === 422) {
      // Error de validación de Laravel
      const errors = e.response.data.errors
      // Asigna el primer error de cada campo
      Object.keys(errors).forEach((key) => {
        validationErrors.value[key] = errors[key][0]
      })
      $q.notify({ type: 'negative', message: 'Por favor, corrige los errores en el formulario.' })
    } else {
      // Otro tipo de error (servidor, red, etc.)
      $q.notify({ type: 'negative', message: 'Ocurrió un error inesperado al guardar el rol.' })
    }
  } finally {
    isSaving.value = false // ✅ Detener la carga siempre
  }
}

const deleteRol = async (rol) => {
  $q.dialog({
    title: 'Confirmar Desactivación',
    // Mensaje corregido para reflejar la acción real
    message: `¿Estás seguro de que quieres eliminar el rol "${rol.nombre}"? `,
    cancel: { label: 'Cancelar', flat: true, color: 'grey-8' },
    ok: { label: 'Eliminar', color: 'white', class: 'bg-red-6' },
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/rols/${rol.id}`)
      emit('roles-updated')
      $q.notify({ type: 'positive', message: 'Rol eliminnado correctamente.' })
    } catch (e) {
      console.error('Error al eliminar rol:', e)
      // ✅ MANEJO DE ERROR 409 (CONFLICT)
      if (e.response && e.response.status === 409) {
        $q.notify({ type: 'negative', message: e.response.data.message })
      } else {
        $q.notify({
          type: 'negative',
          message: 'Ocurrió un error inesperado al eliminar  el rol.',
        })
      }
    }
  })
}
</script>

<style scoped>
/* Tus estilos originales */
.roles-container {
  padding: 24px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
  min-height: auto;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap; /* ✅ Update */
  gap: 16px; /* ✅ Update */
}

/* ... */

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* ✅ Update: Reduced from 350px */
  gap: 24px;
  align-items: flex-start;
}

/* ✅ Media Query for Mobile */
@media (max-width: 600px) {
  .header-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .btn-agregar {
    width: 100%;
  }

  .roles-grid {
     grid-template-columns: 1fr; /* Stack on mobile */
  }
}

.card-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.rol-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.rol-icon {
  opacity: 0.8;
}
.rol-details {
  display: flex;
  flex-direction: column;
}
.rol-label {
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.8;
  text-transform: uppercase;
}
.rol-nombre {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}
.card-body {
  padding: 16px;
  background: #f8fafc;
}
.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #475569;
}
.info-item-permissions {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #475569;
}
.info-label {
  font-weight: 600;
  color: #334155;
  flex-shrink: 0;
}
.info-value {
  flex: 1;
  word-break: break-word;
}
.info-icon {
  margin-top: 3px;
  color: #94a3b8;
}
.permisos-value {
  flex: 1;
}
.permisos-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: flex-start;
}
.permiso-chip {
  background-color: #e0f2f1;
  color: #00796b;
  font-weight: 500;
  height: 24px;
  padding: 0 8px;
  border-radius: 6px;
}
.card-actions {
  margin-top: auto;
  padding: 8px;
  display: flex;
  gap: 8px;
  background: #f1f5f9;
  border-top: 1px solid #e2e8f0;
}
.btn-editar,
.btn-eliminar {
  flex: 1;
  font-weight: 600;
  border-radius: 8px;
  color: white;
}
.btn-editar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
}
.btn-eliminar {
  background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
}

/* Estilos para Modales (estandarizados) */
.dialog-card {
  width: 90vw;
  max-width: 500px; /* Reducido para que se vea mejor */
  border-radius: 16px;
  /* overflow: hidden; -> Se quita para que el flexbox funcione mejor */
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

/* ✅ === NUEVOS ESTILOS PARA EL SCROLL === */
.scrollable-dialog {
  display: flex;
  flex-direction: column;
  max-height: 85vh; /* Limita la altura del modal */
}

.scrollable-dialog .dialog-content {
  flex-grow: 1; /* Hace que el contenido ocupe el espacio disponible */
  overflow-y: auto; /* AÑADE EL SCROLL! */
}
/* === FIN DE NUEVOS ESTILOS === */
</style>
