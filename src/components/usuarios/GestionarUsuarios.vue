<template>
  <div>
    <q-table
      :rows="users"
      :columns="userColumns"
      row-key="id"
      flat
      class="styled-table"
      :filter="filter"
      title="Usuarios del Sistema"
    >
      <template v-slot:top-right>
        <q-input
          dense
          debounce="300"
          v-model="filter"
          placeholder="Buscar..."
          outlined
          class="table-search"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          class="btn-agregar q-ml-md"
          label="Crear Usuario"
          icon="add"
          @click="openAddUserDialog"
          no-caps
          rounded
        />
      </template>

      <template v-slot:body-cell-rol="props">
        <q-td :props="props">
          <q-badge :label="props.row.rol.nombre" class="rol-badge" />
        </q-td>
      </template>
      <template v-slot:body-cell-acciones="props">
        <q-td :props="props" class="text-center">
          <q-btn
            flat
            round
            icon="edit"
            class="action-btn-edit"
            @click="openEditUserDialog(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="userAddDialog" persistent>
      <q-card class="dialog-card">
        <q-form ref="userAddFormRef" @submit.prevent="saveNewUser">
          <q-card-section class="dialog-header">
            <div class="dialog-title">Crear Nuevo Usuario</div>
          </q-card-section>
          <q-card-section class="dialog-content">
            <q-input
              v-model="userAddForm.nombre"
              label="Nombre *"
              outlined
              dense
              class="input-field"
              :rules="[(val) => !!val || 'El nombre es obligatorio']"
            />
            <q-input
              v-model="userAddForm.apellidos"
              label="Apellidos *"
              outlined
              dense
              class="input-field"
              :rules="[(val) => !!val || 'El apellido es obligatorio']"
            />
            <q-input
              v-model="userAddForm.email"
              label="Correo Electrónico *"
              outlined
              dense
              type="email"
              class="input-field"
              :rules="[
                (val) => !!val || 'El email es obligatorio',
                (val) => /.+@.+\..+/.test(val) || 'Email inválido',
              ]"
            />
            <q-input
              v-model="userAddForm.telefono"
              label="Teléfono *"
              outlined
              dense
              type="tel"
              class="input-field"
              mask="########"
              :rules="[
                (val) => !!val || 'El teléfono es obligatorio',
                (val) => val.length === 8 || 'Debe tener 8 dígitos',
              ]"
            />
            <q-input
              v-model="userAddForm.password"
              label="Contraseña *"
              type="password"
              outlined
              dense
              class="input-field"
              :rules="[
                (val) => !!val || 'La contraseña es obligatoria',
                (val) => val.length >= 8 || 'Mínimo 8 caracteres',
              ]"
            />
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
              class="input-field"
              :rules="[(val) => !!val || 'El rol es obligatorio']"
            />
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancelar" v-close-popup class="btn-cancelar" />
            <q-btn label="Crear" type="submit" class="btn-guardar" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="userDialog" persistent>
      <q-card class="dialog-card" style="max-width: 700px">
        <q-form ref="userEditFormRef" @submit.prevent="saveUserAndPermissions">
          <q-card-section class="dialog-header">
            <div class="dialog-title">Editar Usuario y Permisos</div>
          </q-card-section>
          <q-card-section class="dialog-content">
            <q-input
              v-model="userForm.nombre"
              label="Nombre *"
              outlined
              dense
              class="input-field"
              :rules="[(val) => !!val || 'El nombre es obligatorio']"
            />
            <q-select
              v-model="userForm.rol_id"
              :options="rolOptions"
              emit-value
              map-options
              option-label="label"
              option-value="value"
              label="Rol *"
              outlined
              dense
              class="input-field"
            />
            <div class="text-subtitle1 q-mt-lg">Permisos Individuales</div>
            <q-list bordered separator class="q-mt-sm permission-list">
              <q-item v-for="permiso in allPermissions" :key="permiso.id">
                <q-item-section>
                  <q-item-label>{{ permiso.nombre }}</q-item-label>
                  <q-item-label caption>{{ permiso.descripcion }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle
                    :model-value="getPermissionState(permiso.id)"
                    @update:model-value="togglePermission(permiso.id, $event)"
                    color="teal"
                  />
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
import { ref, onMounted, computed } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/user'

// Recibimos los datos del padre
const props = defineProps({
  roles: { type: Array, required: true },
  allPermissions: { type: Array, required: true },
})

const $q = useQuasar()
const userStore = useUserStore()
const filter = ref('')
const users = ref([])
const userDialog = ref(false)
const userAddDialog = ref(false)
const userForm = ref({})
const userEditFormRef = ref(null)
const userAddFormRef = ref(null)
const userAddForm = ref({
  nombre: '',
  apellidos: '',
  email: '',
  telefono: '',
  password: '',
  rol_id: null,
  hospital_id: null,
})

// Usamos una propiedad computada para las opciones del select, basada en el prop
const rolOptions = computed(() => {
  return props.roles.map((r) => ({ label: r.nombre, value: r.id }))
})

const userColumns = [
  {
    name: 'nombre',
    label: 'Nombre Completo',
    field: (row) => `${row.nombre} ${row.apellidos}`,
    align: 'left',
    sortable: true,
  },
  { name: 'email', label: 'Correo Electrónico', field: 'email', align: 'left', sortable: true },
  { name: 'rol', label: 'Rol', field: 'rol', align: 'center' },
  { name: 'acciones', label: 'Acciones', align: 'center' },
]

const fetchUsers = async () => {
  try {
    const response = await api.get('/users')
    users.value = response.data.data
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error al cargar usuarios' })
  }
}

const openEditUserDialog = (user) => {
  userForm.value = JSON.parse(JSON.stringify(user))
  userDialog.value = true
}

const openAddUserDialog = () => {
  userAddForm.value = {
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    rol_id: null,
    hospital_id: userStore.hospital?.id,
  }
  userAddDialog.value = true
}

const saveNewUser = async () => {
  const isValid = await userAddFormRef.value.validate()
  if (!isValid) return
  try {
    await api.post('/users', userAddForm.value)
    await fetchUsers()
    $q.notify({ type: 'positive', message: 'Usuario creado' })
    userAddDialog.value = false
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error al crear usuario' })
  }
}

const getPermissionState = (permissionId) => {
  const userPermission = userForm.value.permissions.find((p) => p.id === permissionId)
  if (userPermission) return userPermission.pivot.estado === 'permitido'
  const rolePermissions = userForm.value.rol.permissions || []
  return rolePermissions.some((p) => p.id === permissionId)
}

const togglePermission = (permissionId, state) => {
  const permissionIndex = userForm.value.permissions.findIndex((p) => p.id === permissionId)
  const newEstado = state ? 'permitido' : 'denegado'
  if (permissionIndex > -1) {
    userForm.value.permissions[permissionIndex].pivot.estado = newEstado
  } else {
    userForm.value.permissions.push({ id: permissionId, pivot: { estado: newEstado } })
  }
}

const saveUserAndPermissions = async () => {
  const isValid = await userEditFormRef.value.validate()
  if (!isValid) return
  try {
    // DESPUÉS (Correcto)
    await api.put(`/users/${userForm.value.id}`, {
      nombre: userForm.value.nombre,
      apellidos: userForm.value.apellidos, // <-- AÑADIR ESTE
      email: userForm.value.email, // <-- AÑADIR ESTE
      rol_id: userForm.value.rol_id,
    })
    const permissionsToSync = userForm.value.permissions.map((p) => ({
      id: p.id,
      estado: p.pivot.estado,
    }))
    await api.put(`/users/${userForm.value.id}/permissions`, { permissions: permissionsToSync })
    await fetchUsers()
    $q.notify({ type: 'positive', message: 'Permisos actualizados' })
    userDialog.value = false
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error al actualizar' })
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
/* Estilos para QTable */
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
  padding-top: 16px;
  padding-bottom: 16px;
  font-size: 0.9rem;
  color: #334155;
}
.styled-table :deep(tbody tr:not(:last-child) td) {
  border-bottom: 1px solid #f1f5f9;
}
.table-search :deep(.q-field__control) {
  border-radius: 99px;
}
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
  background-color: rgba(13, 148, 136, 0.1);
}
.action-btn-edit:hover {
  background-color: rgba(13, 148, 136, 0.2);
}

.btn-agregar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  font-weight: 700;
  padding: 10px 20px;
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
