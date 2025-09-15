<template>
  <div class="fullscreen bg-grey-2 text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 15vh; opacity: 0.5" class="text-red-5">
        <q-icon name="do_not_disturb" />
      </div>

      <div class="text-h3 text-grey-8 q-mt-sm q-mb-xs" style="opacity: 0.8">Acceso Denegado</div>

      <div class="text-body1 text-grey-6">
        No tienes los permisos necesarios para acceder a este contenido.
      </div>

      <q-btn
        class="q-mt-xl"
        color="teal"
        unelevated
        @click="handleLogout"
        label="Cerrar Sesión e Ir al Login"
        no-caps
        icon="logout"
      />
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from 'stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const handleLogout = async () => {
  await userStore.logout()
  // El 'logout' del store ya redirige a /login, pero lo dejamos por si acaso.
  router.push('/login')
}
</script>

<style scoped>
.text-h3 {
  font-weight: 600;
}
</style>
