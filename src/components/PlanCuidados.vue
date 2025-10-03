<template>
  <div class="text-subtitle1 text-weight-medium q-mt-lg">Plan de Cuidados Activos</div>

  <q-list v-if="!plan || !plan.length" class="text-grey q-pa-sm">
    Sin plan de cuidados activo.
  </q-list>

  <q-list v-else bordered separator dense class="q-mt-sm rounded-borders">
    <q-item v-for="cuidado in plan" :key="cuidado.id">
      <q-item-section>
        <q-item-label class="text-weight-bold text-blue-grey-8">{{ cuidado.tipo }}</q-item-label>
        <q-item-label caption>{{ cuidado.descripcion }}</q-item-label>

        <div v-if="cuidado.cuidados_aplicados && cuidado.cuidados_aplicados.length" class="q-mt-sm">
          <q-item-label caption class="text-grey-8 text-weight-medium">
            <q-icon name="history" class="q-mr-xs" />
            Historial de Aplicaciones:
          </q-item-label>
          <q-list dense separator class="q-ml-md q-mt-xs bg-grey-1" bordered>
            <q-item
              v-for="aplicado in cuidado.cuidados_aplicados"
              :key="aplicado.id"
              class="q-py-xs"
            >
              <q-item-section avatar style="min-width: 38px">
                <q-icon name="check_circle_outline" color="positive" size="18px" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>
                  {{ formatDateTime(aplicado.fecha_aplicacion) }} por
                  <strong class="text-primary">{{ aplicado.user.nombre }}</strong>
                </q-item-label>
                <q-item-label v-if="aplicado.observaciones" class="text-caption text-grey-9">
                  Obs: "{{ aplicado.observaciones }}"
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-item-label v-else caption class="text-negative q-pt-xs">
          <q-icon name="warning" color="negative" size="16px" class="q-mr-xs" />
          ¡PENDIENTE! No se ha registrado cumplimiento.
        </q-item-label>
      </q-item-section>

      <q-item-section side>
        <q-btn
          unelevated
          size="sm"
          color="secondary"
          icon="done"
          label="Registrar Cuidado"
          @click="abrirDialogoRegistrarCuidado(cuidado)"
        />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { api } from 'boot/axios'
import { Notify, Dialog } from 'quasar'
import { format } from 'date-fns'
import { useUserStore } from 'stores/user'

// ✅ CORRECCIÓN: Ahora recibimos un prop llamado 'plan'
const { plan } = defineProps({
  plan: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['recargar-pacientes'])
const userStore = useUserStore()

function abrirDialogoRegistrarCuidado(cuidado) {
  const idUsuario = userStore.user?.id
  if (!idUsuario) {
    Notify.create({ color: 'negative', message: 'Error de sesión. Usuario no identificado.' })
    return
  }
  Dialog.create({
    title: `Registrar Cuidado: ${cuidado.tipo}`,
    message: 'Añada observaciones sobre el cuidado realizado.',
    prompt: { model: '', type: 'textarea', label: 'Observaciones (opcional)' },
    cancel: true,
    persistent: true,
  }).onOk(async (observaciones) => {
    try {
      await api.post('/cuidados-aplicados', {
        cuidado_id: cuidado.id,
        observaciones: observaciones,
      })
      Notify.create({
        color: 'positive',
        message: `Cuidado "${cuidado.tipo}" registrado correctamente.`,
      })
      emit('recargar-pacientes')
    } catch {
      Notify.create({ color: 'negative', message: 'Hubo un error al registrar el cuidado.' })
    }
  })
}

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
