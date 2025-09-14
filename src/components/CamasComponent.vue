<template>
  <div class="camas-content">
    <div class="row q-col-gutter-sm">
      <div v-for="cama in camas" :key="cama.id" class="col-6 col-md-4">
        <q-card :class="getCamaCardClass(cama.estado)" flat bordered>
          <q-card-section class="flex items-center justify-between">
            <div>{{ cama.nombre }} ({{ cama.tipo }})</div>
            <q-icon name="bed" :color="getCamaIconColor(cama.estado)" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat icon="edit" @click="abrirModalCama(cama)" />
            <q-btn flat icon="delete" color="negative" @click="eliminarCama(cama.id)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
    <q-card-actions align="right">
      <q-btn flat label="Añadir cama" color="secondary" @click="abrirModalCama()" />
    </q-card-actions>

    <!-- Modal Cama -->
    <q-dialog v-model="showAddCamaModal" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingCama ? 'Editar Cama' : 'Añadir Cama' }}</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="camaForm.nombre"
            label="Nombre de cama"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-select
            v-model="camaForm.tipo"
            :options="tiposCama"
            label="Tipo de cama"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-select
            v-model="camaForm.estado"
            :options="estadosCama"
            label="Estado"
            outlined
            dense
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" @click="closeAddCamaModal" />
          <q-btn
            flat
            label="Guardar"
            color="positive"
            :loading="saving"
            @click="editingCama ? updateCama() : saveCama()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const props = defineProps({
  camas: {
    type: Array,
    default: () => [],
  },
  salaId: {
    type: [Number, String],
    required: true,
  },
})
const emit = defineEmits(['camas-updated'])

const $q = useQuasar()
const showAddCamaModal = ref(false)
const editingCama = ref(false)
const saving = ref(false)
const camaForm = reactive({ id: null, nombre: '', tipo: 'Rígida', estado: 'Disponible' })
const tiposCama = [
  'Rígida',
  'Articulada manual',
  'Articulada eléctrica',
  'Bariátrica',
  'Levitación',
]
const estadosCama = ['Disponible', 'Ocupado', 'Mantenimiento']

const abrirModalCama = (cama = null) => {
  if (cama) {
    editingCama.value = true
    Object.assign(camaForm, cama)
  } else {
    editingCama.value = false
    Object.assign(camaForm, { id: null, nombre: '', tipo: 'Rígida', estado: 'Disponible' })
  }
  showAddCamaModal.value = true
}
const closeAddCamaModal = () => (showAddCamaModal.value = false)

const saveCama = async () => {
  saving.value = true
  try {
    await api.post('/camas', { ...camaForm, sala_id: props.salaId })
    $q.notify({ type: 'positive', message: 'Cama añadida' })
    emit('camas-updated')
    closeAddCamaModal()
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Error al añadir cama' })
  } finally {
    saving.value = false
  }
}
const updateCama = async () => {
  saving.value = true
  try {
    await api.put(`/camas/${camaForm.id}`, { ...camaForm })
    $q.notify({ type: 'positive', message: 'Cama actualizada' })
    emit('camas-updated')
    closeAddCamaModal()
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Error al actualizar cama' })
  } finally {
    saving.value = false
  }
}
const eliminarCama = async (id) => {
  if (!confirm('Eliminar cama?')) return
  try {
    await api.delete(`/camas/${id}`)
    $q.notify({ type: 'positive', message: 'Cama eliminada' })
    emit('camas-updated')
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Error al eliminar cama' })
  }
}

const getCamaStatusColor = (estado) =>
  ({ Disponible: 'positive', Ocupado: 'negative', Mantenimiento: 'warning' })[estado] || 'grey'
const getCamaIconColor = getCamaStatusColor
const getCamaCardClass = (estado) =>
  ({ Disponible: 'cama-disponible', Ocupado: 'cama-ocupada', Mantenimiento: 'cama-mantenimiento' })[
    estado
  ] || ''
</script>

<style scoped>
.cama-disponible {
  border-left: 5px solid #21ba45;
}
.cama-ocupada {
  border-left: 5px solid #c10015;
}
.cama-mantenimiento {
  border-left: 5px solid #f2c037;
}
</style>
