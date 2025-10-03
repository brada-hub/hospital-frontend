<template>
  <q-page padding>
    <div class="header-section">
      <h2 class="titulo-principal">Mis Pacientes Internados</h2>
      <p class="text-grey-7">Lista de pacientes actualmente bajo tu responsabilidad.</p>
    </div>

    <div v-if="isLoading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
      <div class="text-subtitle1 q-mt-md">Cargando pacientes...</div>
    </div>

    <div v-else-if="!internaciones.length" class="text-center q-pa-xl">
      <q-icon name="personal_injury" size="80px" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">No tienes pacientes asignados actualmente.</div>
    </div>

    <div v-else class="q-gutter-md">
      <q-card
        v-for="internacion in internaciones"
        :key="internacion.id"
        flat
        bordered
        class="paciente-card"
      >
        <q-card-section>
          <div class="row items-center no-wrap">
            <div class="col">
              <div class="text-h6">
                {{ internacion.paciente.nombre }} {{ internacion.paciente.apellidos }}
              </div>
              <div class="text-subtitle2 text-grey-8">CI: {{ internacion.paciente.ci }}</div>
            </div>
            <div class="col-auto">
              <q-btn
                color="primary"
                flat
                label="Ver Panel Clínico"
                icon-right="arrow_forward"
                :to="`/pacientes/internacion/${internacion.id}`"
              />
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="info-grid">
          <div v-if="internacion.ocupacion_activa">
            <strong>Cama:</strong> {{ internacion.ocupacion_activa.cama.sala.nombre }} -
            {{ internacion.ocupacion_activa.cama.nombre }}
          </div>
          <div><strong>Fecha Ingreso:</strong> {{ formatDateTime(internacion.fecha_ingreso) }}</div>
          <div><strong>Diagnóstico:</strong> {{ internacion.diagnostico }}</div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { Notify } from 'quasar'
import { format } from 'date-fns'

const internaciones = ref([])
const isLoading = ref(true)

async function fetchMisPacientes() {
  isLoading.value = true
  try {
    const response = await api.get('/mis-pacientes')
    internaciones.value = response.data
  } catch (error) {
    // ✅ CORREGIDO: Usamos la variable 'error' para que el linter no se queje.
    console.error('Error al cargar mis pacientes:', error)
    Notify.create({ color: 'negative', message: 'No se pudo cargar la lista de pacientes.' })
  } finally {
    isLoading.value = false
  }
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A'
  return format(new Date(dateTimeString), 'dd/MM/yyyy HH:mm')
}

onMounted(fetchMisPacientes)
</script>

<style scoped>
.header-section {
  margin-bottom: 24px;
}
.titulo-principal {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}
.paciente-card {
  transition: box-shadow 0.3s;
}
.paciente-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}
</style>
