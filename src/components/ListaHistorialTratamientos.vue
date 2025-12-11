<template>
  <div class="historial-tratamientos-container q-mt-xl">
    <div class="row items-center q-mb-md">
      <q-icon name="history" size="24px" class="q-mr-sm text-grey-8" />
      <div class="text-h6 text-grey-9">Historial de Tratamientos Anteriores</div>
    </div>

    <div v-if="!tratamientos || tratamientos.length === 0" class="text-center q-py-md text-grey-6">
      No hay tratamientos anteriores registrados.
    </div>

    <div v-else class="column q-gutter-md">
      <q-card
        v-for="tratamiento in tratamientos"
        :key="tratamiento.id"
        flat
        bordered
        class="history-card"
        :class="{ 'bg-red-1': tratamiento.estado === 1, 'bg-grey-1': tratamiento.estado !== 1 }"
      >
        <q-card-section>
          <div class="row justify-between items-start">
            <div>
              <div class="text-subtitle1 text-weight-bold text-blue-grey-9">
                {{ tratamiento.tipo }}
              </div>
              <div class="text-caption text-grey-7">
                Prescrito por: {{ tratamiento.medico ? `${tratamiento.medico.nombre} ${tratamiento.medico.apellidos}` : 'Desconocido' }}
              </div>
              <div class="text-caption text-grey-7">
                Fecha Inicio: {{ formatDate(tratamiento.fecha_inicio) }}
              </div>
               <div class="text-caption text-grey-7" v-if="tratamiento.updated_at">
                Finalizado/Suspendido el: {{ formatDate(tratamiento.updated_at) }}
              </div>
            </div>
            <q-badge
              :color="getColorEstado(tratamiento.estado)"
              :label="getTextoEstado(tratamiento.estado)"
              class="q-px-sm q-py-xs"
            />
          </div>

          <!-- Motivo de suspensión si existe -->
           <div v-if="tratamiento.estado === 1 && tratamiento.observaciones" class="q-mt-sm bg-white q-pa-sm rounded-borders text-grey-8 text-caption">
            <strong>Motivo de suspensión:</strong> {{ tratamiento.observaciones }}
          </div>

           <!-- Descripción básica -->
           <div class="q-mt-sm text-grey-8 text-body2">
            {{ tratamiento.descripcion }}
           </div>

          <!-- Lista de medicamentos resumida -->
          <div v-if="tratamiento.recetas && tratamiento.recetas.length > 0" class="q-mt-md">
            <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Medicamentos incluidos:</div>
             <q-chip
                v-for="receta in tratamiento.recetas"
                :key="receta.id"
                dense
                color="white"
                text-color="grey-8"
                icon="medication"
                class="q-mr-sm q-mb-sm"
             >
                {{ receta.medicamento.nombre }} ({{ receta.dosis }})
             </q-chip>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import { format } from 'date-fns'

defineProps({
  tratamientos: {
    type: Array,
    default: () => []
  }
})

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm')
}

function getColorEstado(estado) {
  const map = {
    1: 'negative',  // Suspendido
    2: 'grey',      // Finalizado (Alta)
    3: 'deep-orange' // Cancelado
  }
  return map[estado] || 'grey'
}

function getTextoEstado(estado) {
  const map = {
    1: 'SUSPENDIDO',
    2: 'FINALIZADO',
    3: 'CANCELADO'
  }
  return map[estado] || 'INACTIVO'
}
</script>

<style scoped>
.history-card {
  transition: all 0.3s ease;
  border-radius: 8px;
}
.history-card:hover {
  border-color: #b0bec5;
}
</style>
