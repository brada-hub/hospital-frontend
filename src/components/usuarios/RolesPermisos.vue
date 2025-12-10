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
            unelevated
            class="btn-editar"
            icon="edit"
            label="Editar"
            @click="openEditRolDialog(rol)"
            no-caps
          />
          <q-btn
            unelevated
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
      <q-card class="dialog-card scrollable-dialog">
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
            <q-list bordered separator class="q-mt-sm permission-list rounded-borders">
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
            <q-btn flat label="Cancelar" v-close-popup class="btn-cancelar rounded-borders" />
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
  background: #f8fafc;
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

/* ✅ Estilo del Título Principal (Nuevo) */
.titulo-principal {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
  font-size: clamp(1.5rem, 4vw, 2rem);
  margin: 0 0 8px 0;
  line-height: 1.2;
}

/* ✅ Estilo del Botón de Agregar (Actualizado) */
.btn-agregar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 12px;
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

/* ✅ Nuevo estilo para las tarjetas */
.rol-card {
  background: white;
  border-radius: 16px; /* Bordes redondeados */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden; /* Para que el header respete el border-radius */
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex; /* Para flex column layout interno si es necesario */
  flex-direction: column;
}

.rol-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  padding: 20px 24px;
}
.rol-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.rol-icon {
  opacity: 0.9;
}
.rol-details {
  display: flex;
  flex-direction: column;
}
.rol-label {
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.rol-nombre {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
}
.card-body {
  padding: 24px;
  background: #ffffff;
  flex: 1; /* Ocupa el espacio restante */
}
.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #475569;
  margin-bottom: 8px;
}
.info-item-permissions {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #475569;
}
.info-label {
  font-weight: 700;
  color: #334155;
  flex-shrink: 0;
}
.info-value {
  flex: 1;
  word-break: break-word;
  line-height: 1.5;
}
.info-icon {
  margin-top: 2px;
  color: #94a3b8;
}
.permisos-value {
  flex: 1;
}
.permisos-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}
.permiso-chip {
  background-color: #f0fdfa; /* Teal 50 */
  color: #0f766e; /* Teal 700 */
  font-weight: 600;
  height: 28px;
  padding: 0 12px;
  border-radius: 9999px; /* Pill shape fully rounded */
  border: 1px solid #ccfbf1;
}
.card-actions {
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}
.btn-editar,
.btn-eliminar {
  flex: 1;
  font-weight: 700;
  border-radius: 12px; /* Botones más redondeados */
  font-size: 0.9rem;
  padding: 8px 0;
}
.btn-editar {
  background: #0d9488; /* Teal 600 */
  color: white;
}
.btn-editar:hover {
  background: #0f766e;
}
.btn-eliminar {
  background: #dc2626; /* Red 600 */
  color: white;
}
.btn-eliminar:hover {
  background: #b91c1c;
}

/* Estilos para Modales (estandarizados) */
.dialog-card {
  width: 90vw;
  max-width: 600px;
  border-radius: 20px; /* Modal muy redondeado */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
.dialog-header {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  padding: 20px 32px;
}
.dialog-title {
  font-size: 1.35rem;
  font-weight: 700;
}
.dialog-content {
  padding: 32px;
}
.input-field {
  margin-bottom: 20px;
}
.dialog-actions {
  padding: 20px 32px;
  background-color: #f8fafc;
  border-top: 1px solid #f1f5f9;
  gap: 12px;
}
.btn-cancelar {
  color: #64748b;
  font-weight: 600;
  border-radius: 8px;
}
.btn-guardar {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  border-radius: 12px;
  padding: 10px 32px;
  font-weight: 700;
  box-shadow: 0 4px 6px -1px rgba(20, 184, 166, 0.2);
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
