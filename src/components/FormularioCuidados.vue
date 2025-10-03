<template>
  <div>
    <div class="row items-start q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6">
        <q-input
          outlined
          v-model="nuevoCuidado.tipo"
          label="Tipo de Cuidado (ej. General, Postoperatorio)"
          dense
        />
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          outlined
          v-model="nuevoCuidado.frecuencia"
          label="Frecuencia (ej. Cada 8h, Diario)"
          dense
        />
      </div>
      <div class="col-12">
        <q-input
          type="textarea"
          outlined
          v-model="nuevoCuidado.descripcion"
          label="Descripción del Cuidado *"
          :rules="[(val) => !!val || 'La descripción es requerida']"
          autogrow
          dense
        />
      </div>
      <div class="col-12">
        <q-btn
          unelevated
          color="primary"
          label="Añadir al Plan"
          icon="add"
          @click="agregarCuidado"
          :disable="!nuevoCuidado.descripcion"
          class="full-width"
        />
      </div>
    </div>

    <q-list bordered separator v-if="cuidados.length > 0" class="rounded-borders">
      <q-item-label header class="bg-grey-2"
        >Cuidados Planificados ({{ cuidados.length }})</q-item-label
      >
      <q-item v-for="(cuidado, index) in cuidados" :key="index">
        <q-item-section>
          <q-item-label class="text-weight-medium">{{ cuidado.tipo }}</q-item-label>
          <q-item-label caption
            >{{ cuidado.descripcion }} - (Frecuencia: {{ cuidado.frecuencia }})</q-item-label
          >
        </q-item-section>
        <q-item-section side>
          <q-btn flat dense round icon="delete" color="negative" @click="quitarCuidado(index)" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

// ✅ PASO 1: Definir el evento que vamos a emitir
const emit = defineEmits(['update:cuidados'])

const cuidados = ref([])
const nuevoCuidado = reactive({
  tipo: 'Cuidado General',
  descripcion: '',
  frecuencia: 'Según necesidad',
})

function agregarCuidado() {
  if (!nuevoCuidado.descripcion) return
  cuidados.value.push({ ...nuevoCuidado })
  nuevoCuidado.descripcion = ''
}

function quitarCuidado(index) {
  cuidados.value.splice(index, 1)
}

// ✅ PASO 2: Observar la lista de cuidados. Si cambia, emitimos el evento con los nuevos datos.
watch(
  cuidados,
  (newValue) => {
    emit('update:cuidados', newValue)
  },
  { deep: true },
)

// ❌ Ya no necesitamos defineExpose
</script>
