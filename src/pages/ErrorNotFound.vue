<template>
  <div class="fullscreen bg-grey-2 text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 20vh; line-height: 1" class="text-teal-4">404</div>

      <div class="text-h4 text-grey-8" style="opacity: 0.6">Oops. La página no existe...</div>

      <q-btn
        class="q-mt-xl"
        color="teal"
        unelevated
        to="/"
        label="Volver a la página principal"
        no-caps
        icon="home"
      />
    </div>
  </div>
</template>

<script setup>
// No se necesita lógica aquí
</script>

<style scoped>
.text-h4 {
  font-weight: 500;
}
</style>
