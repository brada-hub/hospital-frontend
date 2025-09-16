<template>
  <div>
    <div class="table-header-row">
      <q-input
        dense
        debounce="300"
        v-model="filter"
        placeholder="Buscar por nombre, apellidos, teléfono o email..."
        outlined
        class="table-search"
        style="max-width: 420px"
      >
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>

      <div class="grow" />

      <q-btn
        class="btn-agregar"
        label="Crear Usuario"
        icon="person_add"
        @click="openAddUserDialog"
        no-caps
        rounded
      />
    </div>

    <q-table
      :rows="filteredUsers"
      :columns="userColumns"
      row-key="id"
      flat
      class="styled-table"
      :loading="loadingTable"
      virtual-scroll
    >
      <template v-slot:body-cell-rol="props">
        <q-td :props="props">
          <q-badge :label="props.row.rol?.nombre || 'Sin rol'" class="rol-badge" />
        </q-td>
      </template>

      <template v-slot:body-cell-permisos="props">
        <q-td :props="props" class="text-center">
          <q-btn
            dense
            outline
            no-caps
            label="Permisos"
            icon="vpn_key"
            @click="openPermissionsDialog(props.row)"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-acciones="props">
        <q-td :props="props" class="text-center">
          <q-btn
            dense
            flat
            round
            icon="edit"
            class="action-btn-edit"
            @click="openEditUserDialog(props.row)"
            title="Editar usuario"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-estado="props">
        <q-td :props="props" class="text-center">
          <q-toggle
            dense
            :model-value="props.row.estado === 1 || props.row.estado === true"
            @update:model-value="(val) => toggleUserEstado(props.row, val)"
            label="Activo"
            left-label
            :true-value="true"
            :false-value="false"
            color="primary"
          />
        </q-td>
      </template>

      <template v-slot:top-right>
        <!-- dejar vacío porque ya tenemos header arriba -->
      </template>
    </q-table>

    <!-- DIALOG: Crear Usuario -->
    <q-dialog v-model="userAddDialog" persistent>
      <q-card class="dialog-card">
        <q-form ref="userAddFormRef" @submit.prevent="saveNewUser">
          <q-card-section class="dialog-header">
            <div class="dialog-title">Crear Nuevo Usuario</div>
          </q-card-section>

          <q-card-section class="dialog-content">
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="userAddForm.nombre"
                  label="Nombre *"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Requerido']"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="userAddForm.apellidos"
                  label="Apellidos *"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Requerido']"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-6">
                <q-input
                  v-model="userAddForm.email"
                  label="Email *"
                  outlined
                  dense
                  type="email"
                  :rules="[
                    (v) => !!v || 'Requerido',
                    (v) => /.+@.+\..+/.test(v) || 'Email inválido',
                  ]"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="userAddForm.telefono"
                  label="Teléfono"
                  outlined
                  dense
                  mask="########"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-6">
                <q-input
                  v-model="userAddForm.password"
                  label="Contraseña *"
                  type="password"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Requerido', (v) => (v && v.length >= 8) || 'Min 8 chars']"
                />
              </div>
              <div class="col-6">
                <q-select
                  v-model="userAddForm.rol_id"
                  :options="rolOptions"
                  emit-value
                  map-options
                  option-label="label"
                  option-value="value"
                  label="Rol *"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Requerido']"
                />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancelar" v-close-popup @click="userAddDialog = false" />
            <q-btn :loading="savingNewUser" label="Crear" color="primary" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- DIALOG: Editar Usuario -->
    <q-dialog v-model="userDialog" persistent>
      <q-card class="dialog-card" style="max-width: 700px">
        <q-form ref="userEditFormRef" @submit.prevent="saveUserAndPermissions">
          <q-card-section class="dialog-header">
            <div class="dialog-title">Editar Usuario</div>
            <div class="dialog-subtitle">{{ editingUser?.email || '' }}</div>
          </q-card-section>

          <q-card-section class="dialog-content">
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="editingUser.nombre"
                  label="Nombre *"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Requerido']"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="editingUser.apellidos"
                  label="Apellidos *"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Requerido']"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-6">
                <q-input
                  v-model="editingUser.email"
                  label="Email *"
                  outlined
                  dense
                  type="email"
                  :rules="[
                    (v) => !!v || 'Requerido',
                    (v) => /.+@.+\..+/.test(v) || 'Email inválido',
                  ]"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="editingUser.telefono"
                  label="Teléfono"
                  outlined
                  dense
                  mask="########"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-6">
                <q-select
                  v-model="editingUser.rol_id"
                  :options="rolOptions"
                  emit-value
                  map-options
                  option-label="label"
                  option-value="value"
                  label="Rol"
                  outlined
                  dense
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="editingUser.password"
                  label="Nueva Contraseña (dejar vacío para mantener)"
                  type="password"
                  outlined
                  dense
                />
              </div>
            </div>

            <div v-if="editingUser?.rol" class="q-mt-md text-caption">
              Permisos del rol: <strong>{{ editingUser.rol.nombre }}</strong>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancelar" v-close-popup @click="userDialog = false" />
            <q-btn :loading="savingUser" label="Guardar" color="primary" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- DIALOG: Permisos individuales -->
    <q-dialog v-model="permissionsDialog" persistent>
      <q-card class="dialog-card" style="max-width: 720px">
        <q-card-section class="dialog-header">
          <div class="dialog-title">Permisos Individuales</div>
          <div class="dialog-subtitle">{{ permissionsUser?.email || '' }}</div>
        </q-card-section>

        <q-card-section class="dialog-content">
          <div class="text-subtitle1 q-mb-sm">Lista de permisos</div>
          <q-list bordered separator class="permission-list">
            <q-item v-for="perm in permissionsLocal" :key="perm.id" class="items-center">
              <q-item-section>
                <q-item-label>{{ perm.nombre }}</q-item-label>
                <q-item-label caption>{{ perm.descripcion }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle
                  dense
                  :model-value="perm.estadoBool"
                  @update:model-value="(val) => (perm.estadoBool = val)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup @click="permissionsDialog = false" />
          <q-btn
            :loading="savingPermissions"
            label="Guardar Permisos"
            color="primary"
            @click="savePermissionsForUser"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { useUserStore } from 'stores/user'

// Props: roles y allPermissions deben venir del padre (o fetchéalos aquí si prefieres)
const props = defineProps({
  roles: { type: Array, required: true },
  allPermissions: { type: Array, required: true },
})

// Quasar + store
const $q = useQuasar()
const userStore = useUserStore()

// Estado local
const filter = ref('')
const users = ref([])
const loadingTable = ref(false)

// Dialogs y formularios
const userDialog = ref(false)
const userAddDialog = ref(false)
const permissionsDialog = ref(false)

const userEditFormRef = ref(null)
const userAddFormRef = ref(null)

// New user form
const userAddForm = ref({
  nombre: '',
  apellidos: '',
  email: '',
  telefono: '',
  password: '',
  rol_id: null,
  hospital_id: userStore.hospital?.id || null,
})

// Editing user temporary object
const editingUser = ref(null)
const permissionsUser = ref(null)

// Local permission list (for dialog)
const permissionsLocal = ref([])

// Loading states
const savingNewUser = ref(false)
const savingUser = ref(false)
const savingPermissions = ref(false)

// Computed rol options
const rolOptions = computed(() => props.roles.map((r) => ({ label: r.nombre, value: r.id })))

// Columns
const userColumns = [
  { name: 'nombre', label: 'Nombre', field: (row) => row.nombre || '', sortable: true },
  { name: 'apellidos', label: 'Apellidos', field: (row) => row.apellidos || '', sortable: true },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', sortable: true, align: 'center' },
  { name: 'email', label: 'Email', field: 'email', sortable: true },
  { name: 'rol', label: 'Rol', field: (row) => row.rol?.nombre || '', align: 'center' },
  { name: 'permisos', label: 'Permisos', field: 'permisos', align: 'center' },
  { name: 'acciones', label: 'Editar', field: 'acciones', align: 'center' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
]

// Fetch users
const fetchUsers = async () => {
  loadingTable.value = true
  try {
    const response = await api.get('/users')
    // Asumimos que el backend devuelve paginación en response.data.data
    users.value = Array.isArray(response.data.data) ? response.data.data : response.data
  } catch (error) {
    console.error('fetchUsers error', error)
    $q.notify({ type: 'negative', message: 'Error al cargar usuarios' })
  } finally {
    loadingTable.value = false
  }
}

// Filtered users (buscar en nombre, apellidos, telefono y email)
const filteredUsers = computed(() => {
  const q = (filter.value || '').trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter((u) => {
    return (
      (u.nombre || '').toString().toLowerCase().includes(q) ||
      (u.apellidos || '').toString().toLowerCase().includes(q) ||
      (u.telefono || '').toString().toLowerCase().includes(q) ||
      (u.email || '').toString().toLowerCase().includes(q)
    )
  })
})

// Abrir diálogo para crear usuario
const openAddUserDialog = () => {
  userAddForm.value = {
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    rol_id: null,
    hospital_id: userStore.hospital?.id || null,
  }
  userAddDialog.value = true
}

// Guardar nuevo usuario
const saveNewUser = async () => {
  const valid = await userAddFormRef.value.validate()
  if (!valid) return

  savingNewUser.value = true
  try {
    await api.post('/users', userAddForm.value)
    $q.notify({ type: 'positive', message: 'Usuario creado' })
    userAddDialog.value = false
    await fetchUsers()
  } catch (error) {
    console.error('saveNewUser', error)
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'Error al crear usuario',
    })
  } finally {
    savingNewUser.value = false
  }
}

// Abrir diálogo de edición (usuario completo)
const openEditUserDialog = async (user) => {
  try {
    const { data } = await api.get(`/users/${user.id}`)
    // clonamos y añadimos campo password vacío para permitir cambio opcional
    editingUser.value = { ...data, password: '' }
    userDialog.value = true
  } catch (error) {
    console.error('openEditUserDialog', error)
    $q.notify({ type: 'negative', message: 'No se pudo cargar datos del usuario' })
  }
}

// Guardar cambios generales del usuario (nombre, apellidos, email, telefono, rol y password opcional)
const saveUserAndPermissions = async () => {
  // si hay ref de formulario, validarlo
  if (userEditFormRef.value) {
    const valid = await userEditFormRef.value.validate()
    if (!valid) return
  }

  savingUser.value = true
  try {
    // Preparar payload (omitir password si vacío)
    const payload = {
      nombre: editingUser.value.nombre,
      apellidos: editingUser.value.apellidos,
      email: editingUser.value.email,
      telefono: editingUser.value.telefono,
      rol_id: editingUser.value.rol_id,
    }
    if (editingUser.value.password) {
      payload.password = editingUser.value.password
    }

    await api.put(`/users/${editingUser.value.id}`, payload)
    $q.notify({ type: 'positive', message: 'Usuario actualizado' })
    userDialog.value = false
    await fetchUsers()
  } catch (error) {
    console.error('saveUserAndPermissions', error)
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'Error al actualizar usuario',
    })
  } finally {
    savingUser.value = false
  }
}

// Abrir diálogo de permisos individuales para un usuario
const openPermissionsDialog = async (user) => {
  try {
    const { data } = await api.get(`/users/${user.id}`)
    permissionsUser.value = data
    // Construir lista local de permisos basada en allPermissions (prop) y estado actual del usuario
    const userPermIds = (data.permissions || []).reduce((acc, p) => {
      acc[p.id] = p.pivot?.estado === 'permitido'
      return acc
    }, {})

    permissionsLocal.value = props.allPermissions.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      estadoBool: !!userPermIds[p.id] || false,
    }))

    permissionsDialog.value = true
  } catch (error) {
    console.error('openPermissionsDialog', error)
    $q.notify({ type: 'negative', message: 'Error al cargar permisos del usuario' })
  }
}

// Guardar permisos individuales del usuario
const savePermissionsForUser = async () => {
  if (!permissionsUser.value) return
  savingPermissions.value = true
  try {
    const permissionsToSync = permissionsLocal.value.map((p) => ({
      id: p.id,
      estado: p.estadoBool ? 'permitido' : 'denegado',
    }))

    await api.put(`/users/${permissionsUser.value.id}/permissions`, {
      permissions: permissionsToSync,
    })
    $q.notify({ type: 'positive', message: 'Permisos sincronizados' })
    permissionsDialog.value = false
    await fetchUsers()
  } catch (error) {
    console.error('savePermissionsForUser', error)
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'Error al guardar permisos',
    })
  } finally {
    savingPermissions.value = false
  }
}

// Cambiar el estado activo/desactivado del usuario
const toggleUserEstado = async (user, val) => {
  const newEstado = val ? 1 : 0
  try {
    await api.patch(`/users/${user.id}/estado`, { estado: newEstado }) // 👈 nueva ruta
    const idx = users.value.findIndex((u) => u.id === user.id)
    if (idx > -1) users.value[idx].estado = newEstado
    $q.notify({ type: 'positive', message: `Usuario ${newEstado ? 'activado' : 'desactivado'}` })
  } catch (error) {
    console.error('toggleUserEstado', error)
    $q.notify({ type: 'negative', message: 'No se pudo cambiar estado' })
    const idx = users.value.findIndex((u) => u.id === user.id)
    if (idx > -1) users.value[idx].estado = user.estado
  }
}

// Inicializar
onMounted(async () => {
  await fetchUsers()
})
</script>

<style scoped>
/* Estilos para QTable */
.table-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.styled-table {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background-color: white;
}
.styled-table :deep(.q-table__title) {
  font-size: 1.25rem;
  font-weight: 600;
  color: #334155;
  padding: 16px;
}
.styled-table :deep(thead tr) {
  background-color: #f8fafc;
}
.styled-table :deep(th) {
  font-weight: 600;
  color: #475569;
  border-bottom-width: 2px !important;
  border-color: #e2e8f0 !important;
}
.styled-table :deep(tbody td) {
  padding-top: 12px;
  padding-bottom: 12px;
  font-size: 0.95rem;
  color: #334155;
}
.styled-table :deep(tbody tr:not(:last-child) td) {
  border-bottom: 1px solid #f1f5f9;
}
.table-search :deep(.q-field__control) {
  border-radius: 99px;
}

/* Badges / Buttons */
.rol-badge {
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  background-color: #ccfbf1;
  color: #0f766e;
  text-transform: uppercase;
  font-size: 0.7rem;
}
.action-btn-edit {
  color: #0d9488;
  background-color: rgba(13, 148, 136, 0.06);
}
.action-btn-edit:hover {
  background-color: rgba(13, 148, 136, 0.12);
}

/* Crear botón */
.btn-agregar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  font-weight: 700;
  padding: 10px 18px;
}

/* Dialogs */
.dialog-card {
  width: 92vw;
  max-width: 720px;
  border-radius: 12px;
  overflow: hidden;
}
.dialog-header {
  background: linear-gradient(135deg, #ffffff 20%, #f8fafc 100%); /* header claro (blanco) */
  color: #111827;
  padding: 16px 18px;
  border-bottom: 1px solid #e6eef0;
}
.dialog-title {
  font-size: 1.1rem;
  font-weight: 700;
}
.dialog-subtitle {
  font-size: 0.85rem;
  color: #475569;
}
.dialog-content {
  padding: 18px;
}
.input-field {
  margin-bottom: 12px;
}
.dialog-actions {
  padding: 12px 18px;
  background-color: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

/* Permisos list */
.permission-list {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  max-height: 360px;
  overflow-y: auto;
}
</style>
