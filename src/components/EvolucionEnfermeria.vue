<template>
  <div class="text-subtitle1 text-weight-medium q-mt-lg">Evolución y Novedades de Enfermería</div>

  <q-list v-if="!evoluciones || !evoluciones.length" class="text-grey q-pa-sm">
    Sin novedades registradas.
  </q-list>

  <q-list v-else bordered separator dense class="q-mt-sm rounded-borders">
    <q-item v-for="evento in evoluciones" :key="evento.id">
      <q-item-section>
        <q-item-label caption>
          <q-icon name="event_note" size="16px" class="q-mr-xs" />
          <span v-if="evento.cuidados_aplicados && evento.cuidados_aplicados.length">
            {{ formatDateTime(evento.cuidados_aplicados[0].fecha_aplicacion) }} -
            <strong class="text-primary">{{ evento.cuidados_aplicados[0].user.nombre }}</strong>
          </span>
        </q-item-label>
        <q-item-label class="text-body2 q-mt-xs">{{ evento.descripcion }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { defineProps } from 'vue'
import { format } from 'date-fns'

const { evoluciones } = defineProps({
  evoluciones: {
    type: Array,
    default: () => [],
  },
})

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
