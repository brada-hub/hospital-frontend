<template>
  <q-page padding>
    <div class="header-section">
      <h2 class="titulo-principal">Estación de Enfermería</h2>
      <p class="text-grey-7">Pacientes internados actualmente.</p>
    </div>

    <div v-if="isLoading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
    </div>
    <div v-else-if="!internaciones.length" class="text-center q-pa-xl">
      <q-icon name="personal_injury" size="80px" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">No hay pacientes internados actualmente.</div>
    </div>

    <q-list v-else bordered separator>
      <q-expansion-item
        v-for="internacion in internaciones"
        :key="internacion.id"
        :model-value="internacion.id === internacionAbiertaId"
        @update:model-value="(val) => (internacionAbiertaId = val ? internacion.id : null)"
        group="pacientes"
        header-class="bg-grey-2"
      >
        <template v-slot:header>
          <q-item-section>
            <q-item-label class="text-h6">
              {{ internacion.paciente.nombre }} {{ internacion.paciente.apellidos }}
            </q-item-label>
            <q-item-label caption v-if="internacion.ocupacionActiva">
              Cama: {{ internacion.ocupacionActiva.cama.sala.nombre }} -
              {{ internacion.ocupacionActiva.cama.nombre }}
              <span class="q-ml-md"
                >| Ingreso: {{ formatDateTime(internacion.fecha_ingreso) }}</span
              >
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              dense
              color="primary"
              label="Ver Historial Completo"
              :to="`/pacientes/internacion/${internacion.id}`"
            />
          </q-item-section>
        </template>

        <q-card>
          <q-card-section>
            <PacienteDashboard
              :internacion="internacion"
              @reabrir-paciente="(id) => (internacionAbiertaId = id)"
              @recargar-pacientes="fetchPacientes"
            />
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { Notify } from 'quasar'
import { format } from 'date-fns'
import PacienteDashboard from 'src/components/PacienteDashboard.vue' // El componente hijo que contiene toda la lógica.

// --- Refs de Estado ---
const internaciones = ref([])
const isLoading = ref(true)
const internacionAbiertaId = ref(null)

// --- Lógica de Recarga ---
async function fetchPacientes() {
  isLoading.value = true
  const idParaReabrir = internacionAbiertaId.value

  try {
    const response = await api.get('/estacion-enfermeria/pacientes')
    internaciones.value = response.data
    // Vuelve a abrir la que estaba expandida, si existe.
    internacionAbiertaId.value = idParaReabrir
  } catch (error) {
    console.error('Error al cargar pacientes:', error)
    Notify.create({ color: 'negative', message: 'No se pudo cargar la lista de pacientes.' })
  } finally {
    isLoading.value = false
  }
}
onMounted(fetchPacientes)

// --- Utilidades ---
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A'
  try {
    const date = new Date(dateTimeString.replace(' ', 'T') + '.000Z')
    if (isNaN(date)) return 'N/A'
    return format(date, 'dd/MM/yyyy HH:mm')
  } catch {
    return 'N/A'
  }
}
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
.rounded-borders {
  border-radius: 8px;
}
</style>
