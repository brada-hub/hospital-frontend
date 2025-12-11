<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    :persistent="persistent"
  >
    <q-card class="styled-modal-card">
      <q-card-section class="modal-header text-white">
        <div class="text-h6">Configuración de la Cuenta</div>
        <div class="text-subtitle2">Gestiona tu perfil y seguridad</div>
        <q-btn v-if="!persistent" icon="close" flat round dense v-close-popup class="close-btn" />
      </q-card-section>

      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="teal-6"
        indicator-color="teal-6"
        align="justify"
        no-caps
      >
        <q-tab name="profile" icon="person" label="Mis Datos" :disable="persistent" />
        <q-tab name="password" icon="lock" label="Cambiar Contraseña" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="profile" class="q-pa-md">
          <q-form @submit.prevent="updateProfile" class="q-gutter-md">
            <q-input
              filled
              v-model="profileForm.nombre"
              label="Nombre"
              :rules="[(val) => !!val || 'El nombre es requerido']"
            />
            <q-input
              filled
              v-model="profileForm.apellidos"
              label="Apellidos"
              :rules="[(val) => !!val || 'El apellido es requerido']"
            />
            <q-input filled v-model="profileForm.telefono" label="Teléfono" type="tel" />
            <q-input filled v-model="profileForm.email" label="Correo Electrónico" readonly />
            <div class="q-pt-sm">
              <q-btn
                label="Guardar Cambios"
                type="submit"
                :loading="profileLoading"
                class="full-width elegant-btn"
                unelevated
                no-caps
              />
            </div>
          </q-form>
        </q-tab-panel>

        <q-tab-panel name="password" class="q-pa-md">
          <q-form @submit.prevent="changePassword" class="q-gutter-md">
            <q-input
              filled
              v-model="passwordForm.current_password"
              label="Contraseña Actual"
              type="password"
              :rules="[(val) => !!val || 'Campo requerido']"
            />
            <q-input
              filled
              v-model="passwordForm.password"
              label="Nueva Contraseña"
              type="password"
              :rules="[
                (val) => !!val || 'Campo requerido',
                (val) => val.length >= 8 || 'Mínimo 8 caracteres',
              ]"
            />
            <q-input
              filled
              v-model="passwordForm.password_confirmation"
              label="Confirmar Nueva Contraseña"
              type="password"
              :rules="[
                (val) => !!val || 'Campo requerido',
                (val) => val === passwordForm.password || 'Las contraseñas no coinciden',
              ]"
            />
            <div class="q-pt-sm">
              <q-btn
                label="Actualizar Contraseña"
                type="submit"
                :loading="passwordLoading"
                class="full-width elegant-btn"
                unelevated
                no-caps
              />
            </div>
          </q-form>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useUserStore } from 'stores/user'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const props = defineProps({
  modelValue: Boolean, // Controla si el modal es visible
  initialTab: {
    // Determina qué pestaña se abre
    type: String,
    default: 'profile',
  },
  persistent: Boolean, // ✅ Nueva prop
})
const emit = defineEmits(['update:modelValue'])

const userStore = useUserStore()
const $q = useQuasar()

const tab = ref('profile')
const profileLoading = ref(false)
const passwordLoading = ref(false)

const profileForm = ref({ nombre: '', apellidos: '', telefono: '', email: '' })
const passwordForm = ref({ current_password: '', password: '', password_confirmation: '' })

// Carga los datos del usuario del store al formulario
const loadUserData = () => {
  if (userStore.user) {
    profileForm.value = {
      nombre: userStore.user.nombre,
      apellidos: userStore.user.apellidos,
      telefono: userStore.user.telefono,
      email: userStore.user.email,
    }
  }
}

// Cuando se abre el modal...
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      loadUserData() // Carga los datos del perfil
      // Resetea el formulario de contraseña por seguridad
      passwordForm.value = { current_password: '', password: '', password_confirmation: '' }
      // Abre la pestaña correcta que nos indicaron
      tab.value = props.initialTab
    }
  },
)

// Lógica para llamar al endpoint /user/profile
// src/components/UserProfileModal.vue

const updateProfile = async () => {
  profileLoading.value = true
  try {
    const { data } = await api.put('/user/profile', profileForm.value)

    // Esta línea ya recibe el usuario COMPLETO gracias a tu arreglo en el backend
    userStore.user = data

    // await userStore.loadUser() // <-- PERFECTO, esta línea ya no es necesaria.

    localStorage.setItem('user', JSON.stringify(data))
    $q.notify({ type: 'positive', message: '¡Perfil actualizado con éxito!' })
    emit('update:modelValue', false)
  } catch (error) {
    // Y aquí usamos la variable 'error' para evitar el ESLint warning
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al actualizar el perfil.',
    })
  } finally {
    profileLoading.value = false
  }
}

// Lógica para llamar al endpoint /user/password
const changePassword = async () => {
  passwordLoading.value = true
  try {
    await api.put('/user/password', passwordForm.value)

    // ✅ Actualizar estado local para desbloquear la UI
    if (userStore.user) {
      userStore.user.must_change_password = false
      // También actualizar en localStorage
      localStorage.setItem('user', JSON.stringify(userStore.user))
    }

    $q.notify({ type: 'positive', message: '¡Contraseña cambiada con éxito!' })
    emit('update:modelValue', false) // Cierra el modal
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al cambiar la contraseña.',
    })
  } finally {
    passwordLoading.value = false
  }
}
</script>

<style scoped>
.styled-modal-card {
  width: 500px;
  max-width: 95vw;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}
.modal-header {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  position: relative;
}
.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  color: rgba(255, 255, 255, 0.8);
}
.close-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}
.elegant-btn {
  background: linear-gradient(135deg, #14b8a6, #06b6d4) !important;
  color: white !important;
  border-radius: 12px !important;
  padding: 12px 24px !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.25) !important;
  transition: all 0.2s ease !important;
}
.elegant-btn:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 16px rgba(20, 184, 166, 0.3) !important;
}
</style>
