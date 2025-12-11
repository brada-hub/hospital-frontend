<template>
  <div class="users-container">
    <div class="header-section">
      <h2 class="titulo-principal">Gestión de Usuarios</h2>
    </div>

    <div class="table-container-card">
      <div class="table-header-row">
        <q-input
          dense
          debounce="300"
          v-model="filter"
          placeholder="Buscar por nombre, apellidos o email..."
          outlined
          class="table-search"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

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
              no-caps
              label="Permisos"
              icon="vpn_key"
              @click="openPermissionsDialog(props.row)"
              class="btn-permisos"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-editar="props">
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
              :model-value="props.row.estado === 1 || props.row.estado === true"
              @update:model-value="(val) => toggleUserEstado(props.row, val)"
              class="styled-toggle"
              checked-icon="check"
              unchecked-icon="close"
              color="positive"
            />
          </q-td>
        </template>
      </q-table>
    </div>

    <q-dialog v-model="userAddDialog" persistent @hide="resetForm('add')">
      <q-card class="dialog-card scrollable-dialog">
        <q-form ref="userAddFormRef" @submit.prevent="saveNewUser">
          <q-card-section class="dialog-header">
            <div class="dialog-title">Crear Nuevo Usuario</div>
          </q-card-section>
          <q-card-section class="dialog-content">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="userAddForm.nombre"
                  label="Nombre *"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[
                    (v) => !!v || 'El nombre es requerido',
                    (v) =>
                      /^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ]+$/.test(v) || 'Solo se permiten letras y espacios',
                  ]"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="userAddForm.apellidos"
                  label="Apellidos *"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[
                    (v) => !!v || 'Los apellidos son requeridos',
                    (v) =>
                      /^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ]+$/.test(v) || 'Solo se permiten letras y espacios',
                  ]"
                />
              </div>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="userAddForm.email"
                  label="Email *"
                  outlined
                  dense
                  type="email"
                  class="input-field"
                  lazy-rules
                  :rules="[
                    (v) => !!v || 'El email es requerido',
                    (v) => /.+@.+\..+/.test(v) || 'Debe ser un email válido',
                  ]"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="userAddForm.telefono"
                  label="Celular"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  mask="########"
                  :rules="[
                    (v) => !v || /^[67]\d{7}$/.test(v) || 'Celular de Bolivia (empieza con 6 o 7)',
                  ]"
                />
              </div>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="userAddForm.password"
                  label="Contraseña *"
                  type="password"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[
                    (v) => !!v || 'La contraseña es requerida',
                    (v) => v.length >= 8 || 'Mínimo 8 caracteres',
                  ]"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="userAddForm.rol_id"
                  :options="rolOptions"
                  emit-value
                  map-options
                  label="Rol *"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[(v) => !!v || 'Debe seleccionar un rol']"
                />
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancelar" v-close-popup class="btn-cancelar" />
            <q-btn :loading="savingNewUser" label="Crear" type="submit" class="btn-guardar" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="userDialog" persistent @hide="resetForm('edit')">
      <q-card class="dialog-card scrollable-dialog">
        <q-form ref="userEditFormRef" @submit.prevent="saveUserChanges">
          <q-card-section class="dialog-header">
            <div class="dialog-title">Editar Usuario</div>
            <div class="dialog-subtitle">{{ editingUser?.email || '' }}</div>
          </q-card-section>
          <q-card-section class="dialog-content">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="editingUser.nombre"
                  label="Nombre *"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[
                    (v) => !!v || 'El nombre es requerido',
                    (v) =>
                      /^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ]+$/.test(v) || 'Solo se permiten letras y espacios',
                  ]"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="editingUser.apellidos"
                  label="Apellidos *"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[
                    (v) => !!v || 'Los apellidos son requeridos',
                    (v) =>
                      /^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ]+$/.test(v) || 'Solo se permiten letras y espacios',
                  ]"
                />
              </div>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="editingUser.email"
                  label="Email *"
                  outlined
                  dense
                  type="email"
                  class="input-field"
                  lazy-rules
                  :rules="[
                    (v) => !!v || 'El email es requerido',
                    (v) => /.+@.+\..+/.test(v) || 'Debe ser un email válido',
                  ]"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="editingUser.telefono"
                  label="Celular"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  mask="########"
                  :rules="[
                    (v) => !v || /^[67]\d{7}$/.test(v) || 'Celular de Bolivia (empieza con 6 o 7)',
                  ]"
                />
              </div>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="editingUser.rol_id"
                  :options="rolOptions"
                  emit-value
                  map-options
                  label="Rol *"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[(v) => !!v || 'Debe seleccionar un rol']"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="editingUser.password"
                  label="Nueva Contraseña (opcional)"
                  type="password"
                  outlined
                  dense
                  class="input-field"
                  lazy-rules
                  :rules="[(v) => !v || v.length >= 8 || 'Mínimo 8 caracteres']"
                />
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancelar" v-close-popup class="btn-cancelar" />
            <q-btn
              :loading="savingUser"
              label="Guardar Cambios"
              type="submit"
              class="btn-guardar"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="permissionsDialog" persistent>
      <q-card class="dialog-card scrollable-dialog">
        <q-card-section class="dialog-header">
          <div class="dialog-title">Permisos Individuales</div>
          <div class="dialog-subtitle">{{ permissionsUser?.email || '' }}</div>
        </q-card-section>
        <q-card-section class="dialog-content">
          <div class="text-caption q-mb-sm">
            Modifica los permisos específicos para este usuario. Estos cambios anulan los permisos
            heredados del rol.
          </div>
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
                  color="positive"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="btn-cancelar" />
          <q-btn
            :loading="savingPermissions"
            label="Guardar Permisos"
            @click="savePermissionsForUser"
            class="btn-guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIÁLOGO DE CREDENCIALES NUEVO -->
    <q-dialog v-model="credencialesDialog" persistent>
      <q-card class="dialog-card">
        <q-card-section class="dialog-header bg-positive text-white">
          <div class="dialog-title">
            <q-icon name="check_circle" size="32px" class="q-mr-sm" />
            Usuario Creado Exitosamente
          </div>
        </q-card-section>

        <q-card-section class="dialog-content">
          <div class="text-subtitle1 q-mb-md">
            El usuario <strong>{{ usuarioCreadoNombre }}</strong> ha sido registrado.
          </div>

          <q-banner class="bg-grey-2 q-mb-md rounded-borders">
            <template v-slot:avatar>
              <q-icon name="vpn_key" color="primary" />
            </template>
            <div class="text-weight-bold q-mb-xs">Credenciales de Acceso:</div>
            <div class="row items-center q-mb-xs">
              <div class="col-3 text-grey-8">Usuario/Email:</div>
              <div class="col text-weight-bold">{{ credencialesGeneradas.email }}</div>
              <div class="col-auto">
                 <q-btn flat round dense icon="content_copy" size="sm" color="primary" @click="copiarAlPortapapeles(credencialesGeneradas.email)" />
              </div>
            </div>
            <div class="row items-center">
              <div class="col-3 text-grey-8">Contraseña:</div>
              <div class="col text-weight-bold">{{ credencialesGeneradas.password }}</div>
               <div class="col-auto">
                 <q-btn flat round dense icon="content_copy" size="sm" color="primary" @click="copiarAlPortapapeles(credencialesGeneradas.password)" />
              </div>
            </div>
          </q-banner>

          <div v-if="credencialesGeneradas.telefono" class="q-mt-lg">
             <div class="text-weight-medium q-mb-sm text-green-8">
               <q-icon name="whatsapp" size="24px" /> Enviar credenciales por WhatsApp:
             </div>
             <q-btn
                :loading="enviandoWhatsApp"
                color="green-6"
                icon="send"
                label="Enviar a WhatsApp"
                class="full-width"
                @click="enviarPorWhatsApp"
             />
             <div class="text-caption text-grey q-mt-xs text-center">
               Se enviará al número: {{ credencialesGeneradas.telefono }}
             </div>
          </div>
          <div v-else class="q-mt-md text-orange-8">
             <q-icon name="warning" /> No se registró número de celular, no se puede enviar por WhatsApp.
          </div>

        </q-card-section>

        <q-card-actions align="center" class="dialog-actions">
          <q-btn
            label="Cerrar y Finalizar"
            color="primary"
            @click="cerrarCredenciales"
            class="btn-guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue' // Added watch
import { api } from 'boot/axios'
import { useQuasar, copyToClipboard } from 'quasar' // Added copyToClipboard
import { useUserStore } from 'stores/user'

const props = defineProps({
  roles: { type: Array, required: true },
  allPermissions: { type: Array, required: true },
})

const $q = useQuasar()
const userStore = useUserStore()

const filter = ref('')
const users = ref([])
const loadingTable = ref(false)

const userDialog = ref(false)
const userAddDialog = ref(false)
const permissionsDialog = ref(false)

// Credenciales Dialog State
const credencialesDialog = ref(false)
const credencialesGeneradas = ref({ email: '', password: '' })
const enviandoWhatsApp = ref(false)
const usuarioCreadoNombre = ref('')

const userEditFormRef = ref(null)
const userAddFormRef = ref(null)

const initialUserAddForm = {
  nombre: '',
  apellidos: '',
  email: '',
  telefono: '',
  password: '',
  rol_id: null,
  hospital_id: userStore.hospital?.id || null,
}
const userAddForm = ref({ ...initialUserAddForm })
const editingUser = ref(null)
const permissionsUser = ref(null)
const permissionsLocal = ref([])

const savingNewUser = ref(false)
const savingUser = ref(false)
const savingPermissions = ref(false)

const rolOptions = computed(() => props.roles.map((r) => ({ label: r.nombre, value: r.id })))
const userColumns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', sortable: true, align: 'left' },
  { name: 'apellidos', label: 'Apellidos', field: 'apellidos', sortable: true, align: 'left' },
  { name: 'telefono', label: 'Celular', field: 'telefono', sortable: true, align: 'center' },
  { name: 'email', label: 'Email', field: 'email', sortable: true, align: 'left' },
  { name: 'rol', label: 'Rol', field: (row) => row.rol?.nombre || '', align: 'center' },
  { name: 'permisos', label: 'Permisos', field: 'permisos', align: 'center' },
  { name: 'editar', label: 'Editar', field: 'editar', align: 'center' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
]

// --- Auto-Generation Logic ---
watch(
  () => [userAddForm.value.nombre, userAddForm.value.apellidos],
  ([newNombre, newApellidos]) => {
    if (!userAddDialog.value) return // Solo si el diálogo está abierto

    const nombreClean = (newNombre || '').split(' ')[0].toLowerCase().trim()
    const apellidosClean = (newApellidos || '').split(' ')[0].toLowerCase().trim()

    if (nombreClean && apellidosClean) {
      const base = `${nombreClean}.${apellidosClean}`
      // Solo actualizamos si el usuario no ha modificado manualmente (opcional, aquí forzamos)
      userAddForm.value.email = `${base}@hospital.com`
      userAddForm.value.password = base
    }
  }
)

const fetchUsers = async () => {
  loadingTable.value = true
  try {
    const response = await api.get('/users')
    users.value = response.data.data || response.data
  } catch (error) {
    console.error('fetchUsers error', error)
    $q.notify({ type: 'negative', message: 'Error al cargar usuarios' })
  } finally {
    loadingTable.value = false
  }
}

const filteredUsers = computed(() => {
  const q = (filter.value || '').trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter((u) =>
    Object.values(u).some((val) => String(val).toLowerCase().includes(q)),
  )
})

const resetForm = (type) => {
  if (type === 'add') {
    userAddForm.value = { ...initialUserAddForm }
    userAddFormRef.value?.resetValidation()
  } else if (type === 'edit') {
    editingUser.value = null
    userEditFormRef.value?.resetValidation()
  }
}

const openAddUserDialog = () => {
  resetForm('add')
  userAddDialog.value = true
}

const saveNewUser = async () => {
  const valid = await userAddFormRef.value.validate()
  if (!valid) return
  savingNewUser.value = true
  try {
    // Guardamos las credenciales antes de enviar (porque el password se hashea en backend)
    const plainPassword = userAddForm.value.password
    const plainEmail = userAddForm.value.email
    const fullName = `${userAddForm.value.nombre} ${userAddForm.value.apellidos}`

    await api.post('/users', userAddForm.value)

    // Preparar dialog de credenciales
    credencialesGeneradas.value = {
      email: plainEmail,
      password: plainPassword,
      telefono: userAddForm.value.telefono // Para WhatsApp
    }
    usuarioCreadoNombre.value = fullName

    $q.notify({ type: 'positive', message: 'Usuario creado con éxito' })
    userAddDialog.value = false

    // Abrir dialogo de credenciales
    credencialesDialog.value = true

    await fetchUsers()
  } catch (error) {
    console.error('saveNewUser', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al crear el usuario',
    })
  } finally {
    savingNewUser.value = false
  }
}

const openEditUserDialog = async (user) => {
  try {
    const { data } = await api.get(`/users/${user.id}`)
    editingUser.value = { ...data, password: '' }
    userDialog.value = true
  } catch (error) {
    console.error('openEditUserDialog', error)
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los datos del usuario' })
  }
}

const saveUserChanges = async () => {
  const valid = await userEditFormRef.value.validate()
  if (!valid) return
  savingUser.value = true
  try {
    const payload = { ...editingUser.value }
    if (!payload.password) {
      delete payload.password
    }
    await api.put(`/users/${editingUser.value.id}`, payload)
    $q.notify({ type: 'positive', message: 'Usuario actualizado con éxito' })
    userDialog.value = false
    await fetchUsers()
  } catch (error) {
    console.error('saveUserChanges', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al actualizar el usuario',
    })
  } finally {
    savingUser.value = false
  }
}

// --- Logic for Credentials Dialog ---

const copiarAlPortapapeles = (texto) => {
  copyToClipboard(texto)
    .then(() => {
      $q.notify({
        type: 'positive',
        message: 'Copiado al portapapeles',
        icon: 'content_copy',
        position: 'top',
        timeout: 1000,
      })
    })
    .catch(() => {
      $q.notify({ type: 'negative', message: 'Error al copiar' })
    })
}

const cerrarCredenciales = () => {
  credencialesDialog.value = false
  credencialesGeneradas.value = { email: '', password: '' }
}

const enviarPorWhatsApp = () => {
  enviandoWhatsApp.value = true

  const telefono = credencialesGeneradas.value.telefono
  if (!telefono || telefono.length < 8) {
     $q.notify({ type: 'warning', message: 'El usuario no tiene un celular válido registrado.' })
     enviandoWhatsApp.value = false
     return
  }

  const numero = `591${telefono}` // Asumiendo Bolivia
  const nombre = usuarioCreadoNombre.value

  const mensaje =
    `Hola *${nombre}*,\n\n` +
    `Bienvenido al sistema del Hospital.\n\n` +
    `📋 *Tus Credenciales de Acceso:*\n` +
    `👤 Usuario: ${credencialesGeneradas.value.email}\n` +
    `🔒 Contraseña: ${credencialesGeneradas.value.password}\n\n` +
    `⚠️ Por favor, cambia tu contraseña al ingresar.\n\n` +
    `Saludos, Administración.`

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`

  window.open(url, '_blank')

  setTimeout(() => {
    enviandoWhatsApp.value = false
    $q.notify({
      type: 'positive',
      message: 'WhatsApp abierto.',
      icon: 'whatsapp',
    })
  }, 1000)
}

const openPermissionsDialog = async (user) => {
  try {
    const { data } = await api.get(`/users/${user.id}`)
    permissionsUser.value = data
    const userPerms = (data.permissions || []).reduce((acc, p) => {
      acc[p.id] = p.pivot?.estado === 'permitido'
      return acc
    }, {})
    permissionsLocal.value = props.allPermissions.map((p) => ({
      ...p,
      estadoBool: userPerms[p.id] === true,
    }))
    permissionsDialog.value = true
  } catch (error) {
    console.error('openPermissionsDialog', error)
    $q.notify({ type: 'negative', message: 'Error al cargar los permisos del usuario' })
  }
}

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
    $q.notify({ type: 'positive', message: 'Permisos del usuario sincronizados' })
    permissionsDialog.value = false
    await fetchUsers()
  } catch (error) {
    console.error('savePermissionsForUser', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al guardar los permisos',
    })
  } finally {
    savingPermissions.value = false
  }
}

const toggleUserEstado = async (user, val) => {
  const newEstado = val ? 1 : 0
  try {
    await api.patch(`/users/${user.id}/estado`, { estado: newEstado })
    const userInList = users.value.find((u) => u.id === user.id)
    if (userInList) userInList.estado = newEstado
    $q.notify({ type: 'positive', message: `Usuario ${newEstado ? 'activado' : 'desactivado'}` })
  } catch (error) {
    console.error('toggleUserEstado', error)
    $q.notify({ type: 'negative', message: 'No se pudo cambiar el estado del usuario' })
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.users-container {
  padding: 24px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
}

.header-section {
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

.table-container-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 24px;
}

.table-header-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.table-search {
  flex-grow: 1;
  min-width: 250px;
  max-width: 450px;
}

.btn-agregar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 12px;
}

.styled-table {
  border-radius: 12px;
  border: none;
}

.styled-table :deep(th) {
  font-weight: 600;
  color: #475569;
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

.btn-permisos {
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
  color: white;
  border: none;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 12px;
}

.action-btn-edit {
  color: white;
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
}

.dialog-card {
  width: 90vw;
  max-width: 700px;
  border-radius: 16px;
}

.scrollable-dialog {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.scrollable-dialog .dialog-content {
  flex-grow: 1;
  overflow-y: auto;
}

.dialog-header {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  padding: 20px 24px;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 700;
}

.dialog-subtitle {
  font-size: 0.9rem;
  opacity: 0.8;
}

.dialog-content {
  padding: 24px;
}

.dialog-actions {
  padding: 16px 24px;
  background-color: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.btn-cancelar {
  color: #ef4444;
}

.btn-guardar {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  border-radius: 12px;
  padding: 8px 24px;
}

.permission-list {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  max-height: 360px;
  overflow-y: auto;
}

/* ESTILOS PARA EL NUEVO INTERRUPTOR DE ESTADO */
.styled-toggle {
  padding: 0;
}
.styled-toggle :deep(.q-toggle__inner) {
  font-size: 28px;
}
.styled-toggle :deep(.q-toggle__track) {
  border-radius: 99px;
  opacity: 0.9;
}
.styled-toggle :deep(.q-toggle__thumb) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.styled-toggle :deep(.q-icon) {
  font-size: 0.7em;
  color: #14b8a6; /* Color de los iconos check/close */
}
</style>
