<template>
  <q-page class="q-pa-md">
    <div class="roles-permisos-container">
      <div class="row items-center justify-between q-mb-lg">
        <div class="col-auto">
          <div class="text-h4 text-weight-bold">Gestión de Usuarios y Roles</div>
          <div class="text-subtitle1 text-grey-7">Configura los roles y permisos del sistema</div>
        </div>
      </div>

      <q-card flat bordered class="roles-permisos-card q-mt-md">
        <q-tabs
          v-model="activeTab"
          dense
          active-color="teal"
          indicator-color="teal"
          align="justify"
          narrow-indicator
        >
          <q-tab name="gestionar-usuarios" icon="group" label="Gestionar Usuarios" />
          <q-tab name="roles-permisos" icon="lock" label="Roles y Permisos" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <q-tab-panel name="gestionar-usuarios" class="q-pa-none">
            <div class="q-pa-md">
              <q-table
                title="Usuarios del Sistema"
                :rows="users"
                :columns="userColumns"
                row-key="id"
                flat
                bordered
              >
                <template v-slot:top-right>
                  <q-input dense debounce="300" v-model="filter" placeholder="Buscar usuario..." />
                  <q-btn
                    color="teal"
                    label="Crear Usuario"
                    icon="add"
                    class="q-ml-md"
                    @click="openAddUserDialog"
                  />
                </template>
                <template v-slot:body-cell-rol="props">
                  <q-td>
                    <q-badge color="teal-6">{{ props.row.rol.nombre }}</q-badge>
                  </q-td>
                </template>
                <template v-slot:body-cell-acciones="props">
                  <q-td>
                    <q-btn
                      dense
                      round
                      flat
                      icon="edit"
                      color="primary"
                      @click="openEditUserDialog(props.row)"
                    />
                  </q-td>
                </template>
              </q-table>
            </div>
          </q-tab-panel>

          <q-tab-panel name="roles-permisos" class="q-pa-none">
            <div class="q-pa-md">
              <q-btn
                label="Crear Rol"
                color="teal"
                icon="add"
                @click="openAddRolDialog"
                class="q-mb-md"
              />
              <div class="row q-col-gutter-md">
                <div v-for="rol in rols" :key="rol.id" class="col-12 col-md-4">
                  <q-card flat bordered>
                    <q-card-section class="bg-teal text-white">
                      <div class="text-h6">{{ rol.nombre }}</div>
                      <div class="text-subtitle2">{{ rol.descripcion }}</div>
                    </q-card-section>
                    <q-card-section>
                      <q-list dense>
                        <q-item v-for="permiso in rol.permissions" :key="permiso.id">
                          <q-item-section avatar>
                            <q-icon name="check_circle" color="positive" />
                          </q-item-section>
                          <q-item-section>{{ permiso.descripcion }}</q-item-section>
                        </q-item>
                      </q-list>
                      <div
                        v-if="rol.permissions.length === 0"
                        class="text-center text-grey-6 q-mt-md"
                      >
                        No tiene permisos asignados.
                      </div>
                    </q-card-section>
                    <q-card-actions align="right" class="bg-grey-2">
                      <q-btn
                        dense
                        flat
                        icon="edit"
                        color="warning"
                        @click="openEditRolDialog(rol)"
                      />
                      <q-btn dense flat icon="delete" color="negative" @click="deleteRol(rol)" />
                    </q-card-actions>
                  </q-card>
                </div>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>

    <q-dialog v-model="userAddDialog" persistent>
      <q-card style="min-width: 500px">
        <q-form ref="userAddFormRef" @submit.prevent="saveNewUser">
          <q-card-section>
            <div class="text-h6">Crear Usuario</div>
          </q-card-section>
          <q-card-section>
            <q-input
              v-model="userAddForm.nombre"
              label="Nombre"
              outlined
              dense
              class="q-mb-md"
              :rules="[(val) => !!val || 'El nombre es obligatorio']"
            />
            <q-input
              v-model="userAddForm.apellidos"
              label="Apellidos"
              outlined
              dense
              class="q-mb-md"
              :rules="[(val) => !!val || 'El apellido es obligatorio']"
            />
            <q-input
              v-model="userAddForm.email"
              label="Correo Electrónico"
              outlined
              dense
              class="q-mb-md"
              type="email"
              :rules="[
                (val) => !!val || 'El email es obligatorio',
                (val) => /.+@.+\..+/.test(val) || 'Ingresa un email válido',
              ]"
            />
            <q-input
              v-model="userAddForm.telefono"
              label="Teléfono"
              outlined
              dense
              type="tel"
              class="q-mb-md"
              mask="########"
              hint="8 dígitos"
              :rules="[
                (val) => !!val || 'El teléfono es obligatorio',
                (val) => val.length === 8 || 'Debe tener 8 dígitos',
              ]"
            />
            <q-input
              v-model="userAddForm.password"
              label="Contraseña"
              type="password"
              outlined
              dense
              class="q-mb-md"
              :rules="[
                (val) => !!val || 'La contraseña es obligatoria',
                (val) => val.length >= 8 || 'Mínimo 8 caracteres',
              ]"
            />
            <q-select
              v-model="userAddForm.rol_id"
              :options="rolOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              label="Rol"
              outlined
              dense
              class="q-mb-md"
              :rules="[(val) => !!val || 'El rol es obligatorio']"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancelar" color="negative" v-close-popup />
            <q-btn flat label="Crear" color="teal" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="userDialog" persistent>
      <q-card style="min-width: 600px">
        <q-form ref="userEditFormRef" @submit.prevent="saveUserAndPermissions">
          <q-card-section>
            <div class="text-h6">Editar Usuario</div>
          </q-card-section>
          <q-card-section>
            <q-input
              v-model="userForm.nombre"
              label="Nombre"
              outlined
              dense
              class="q-mb-md"
              :rules="[(val) => !!val || 'El nombre es obligatorio']"
            />
            <q-select
              v-model="userForm.rol_id"
              :options="rolOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              label="Rol"
              outlined
              dense
              class="q-mb-md"
            />

            <div class="text-subtitle1 q-mt-md">Permisos Individuales</div>
            <q-list bordered separator class="q-mt-sm">
              <q-item v-for="permiso in allPermissions" :key="permiso.id">
                <q-item-section>
                  <q-item-label>{{ permiso.nombre }}</q-item-label>
                  <q-item-label caption>{{ permiso.descripcion }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle
                    :model-value="getPermissionState(permiso.id)"
                    @update:model-value="togglePermission(permiso.id, $event)"
                    checked-icon="check"
                    color="teal"
                    unchecked-icon="clear"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancelar" color="negative" v-close-popup />
            <q-btn flat label="Guardar" color="teal" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="rolDialog" persistent>
      <q-card style="min-width: 500px">
        <q-form @submit.prevent="saveRolAndPermissions">
          <q-card-section>
            <div class="text-h6">{{ rolForm.id ? 'Editar Rol' : 'Añadir Rol' }}</div>
          </q-card-section>
          <q-card-section>
            <q-input
              v-model="rolForm.nombre"
              label="Nombre del Rol"
              outlined
              dense
              class="q-mb-md"
            />
            <q-input v-model="rolForm.descripcion" label="Descripción" outlined dense />

            <div class="text-subtitle1 q-mt-md">Permisos del Rol</div>
            <q-list bordered separator class="q-mt-sm">
              <q-item v-for="permiso in allPermissions" :key="permiso.id" tag="label" v-ripple>
                <q-item-section side>
                  <q-checkbox v-model="rolPermissions" :val="permiso.id" color="teal" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ permiso.nombre }}</q-item-label>
                  <q-item-label caption>{{ permiso.descripcion }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancelar" color="negative" v-close-popup />
            <q-btn flat label="Guardar" color="teal" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/user'

const $q = useQuasar()
const userStore = useUserStore()

const activeTab = ref('gestionar-usuarios')
const filter = ref('')
const users = ref([])
const rols = ref([])
const allPermissions = ref([])
const userDialog = ref(false)
const rolDialog = ref(false)
const userAddDialog = ref(false)

const userForm = ref({})
const userEditFormRef = ref(null)
const userAddForm = ref({
  nombre: '',
  apellidos: '',
  email: '',
  telefono: '',
  password: '',
  rol_id: null,
  hospital_id: null,
})
const userAddFormRef = ref(null)
const rolForm = ref({})
const rolPermissions = ref([])
const rolOptions = ref([])

const userColumns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'email', label: 'Correo Electrónico', field: 'email', align: 'left' },
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
  userForm.value = { ...user }
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
  if (!isValid) {
    $q.notify({
      type: 'negative',
      message: 'Por favor, completa los campos obligatorios.',
    })
    return
  }

  try {
    await api.post('/users', userAddForm.value)
    await fetchUsers()
    $q.notify({ type: 'positive', message: 'Usuario creado correctamente' })
    userAddDialog.value = false
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error al crear usuario' })
  }
}

const getPermissionState = (permissionId) => {
  const userPermission = userForm.value.permissions.find((p) => p.id === permissionId)
  if (userPermission) {
    return userPermission.pivot.estado === 'permitido'
  }

  const rolePermissions = userForm.value.rol.permissions || []
  return rolePermissions.some((p) => p.id === permissionId)
}

const togglePermission = (permissionId, state) => {
  const permissionIndex = userForm.value.permissions.findIndex((p) => p.id === permissionId)
  const newEstado = state ? 'permitido' : 'denegado'
  if (permissionIndex > -1) {
    userForm.value.permissions[permissionIndex].pivot.estado = newEstado
  } else {
    userForm.value.permissions.push({
      id: permissionId,
      pivot: { estado: newEstado },
    })
  }
}

const saveUserAndPermissions = async () => {
  const isValid = await userEditFormRef.value.validate()
  if (!isValid) {
    $q.notify({
      type: 'negative',
      message: 'Por favor, completa los campos obligatorios.',
    })
    return
  }

  try {
    await api.put(`/users/${userForm.value.id}`, {
      nombre: userForm.value.nombre,
      apellidos: userForm.value.apellidos,
      email: userForm.value.email,
      telefono: userForm.value.telefono,
      rol_id: userForm.value.rol_id,
    })

    const permissionsToSync = userForm.value.permissions.map((p) => ({
      id: p.id,
      estado: p.pivot.estado,
    }))
    await api.put(`/users/${userForm.value.id}/permissions`, { permissions: permissionsToSync })

    await fetchUsers()
    $q.notify({ type: 'positive', message: 'Permisos de usuario actualizados' })
    userDialog.value = false
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error al actualizar permisos' })
  }
}

const fetchRols = async () => {
  try {
    const response = await api.get('/rols')
    rols.value = response.data
    rolOptions.value = rols.value.map((r) => ({ label: r.nombre, value: r.id }))
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
    await fetchRols()
    $q.notify({ type: 'positive', message: 'Rol y permisos actualizados' })
    rolDialog.value = false
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error al guardar rol y permisos' })
  }
}

const deleteRol = async (rol) => {
  $q.dialog({
    title: 'Confirmar',
    message: `¿Estás seguro de que quieres eliminar el rol "${rol.nombre}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/rols/${rol.id}`)
      await fetchRols()
      $q.notify({ type: 'positive', message: 'Rol eliminado correctamente' })
    } catch (e) {
      console.error(e)
      $q.notify({ type: 'negative', message: 'Error al eliminar el rol' })
    }
  })
}

onMounted(() => {
  fetchUsers()
  fetchRols()
  fetchAllPermissions()
})
</script>

<style scoped>
.roles-permisos-page {
  background: #f0f4f8;
}
.roles-permisos-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}
.page-header {
  margin-bottom: 24px;
}
.page-title {
  font-size: 2.2rem;
  font-weight: 600;
  color: #1e293b;
}
.page-subtitle {
  color: #64748b;
}
.roles-permisos-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
</style>
