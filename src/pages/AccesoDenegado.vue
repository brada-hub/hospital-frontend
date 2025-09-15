<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <div class="full-width row wrap justify-center items-center content-center">
        <div class="text-center q-pa-md">
          <q-icon name="do_not_disturb" size="100px" color="red" />
          <div class="text-h4 text-bold text-red q-mt-md">Acceso Denegado</div>
          <div class="text-subtitle1 text-grey-6 q-mt-sm">
            No tienes los permisos necesarios para acceder a este contenido.
          </div>
          <q-btn
            color="primary"
            class="q-mt-xl"
            unelevated
            label="Cerrar sesión"
            to="/login"
            @click="userStore.logout()"
          />
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useUserStore } from 'stores/user'

const userStore = useUserStore()
</script>
