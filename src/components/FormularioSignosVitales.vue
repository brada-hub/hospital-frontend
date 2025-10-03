<template>
  <q-form ref="formRef" class="q-gutter-y-md q-pt-md">
    <div class="text-h6 q-mb-sm" v-if="props.tipo === 'todos'">
      Registro de Signos Vitales de Ingreso
    </div>
    <div v-if="loading" class="text-center">
      <q-spinner color="primary" size="3em" />
    </div>
    <div v-else-if="signos.length === 0" class="text-grey-8">
      No se encontraron signos vitales para registrar.
    </div>
    <div v-for="signo in signos" :key="signo.id" class="row items-center q-col-gutter-md">
      <div class="col-12 col-sm-4 text-grey-8 text-weight-medium">
        {{ signo.nombre }}
        <span class="text-grey-7"> ({{ signo.unidad }})</span>
      </div>
      <div class="col-12 col-sm-8">
        <q-input
          outlined
          dense
          v-model="signo.medida"
          :rules="props.tipo === 'todos' ? [(val) => !!val || 'Requerido'] : []"
          lazy-rules
          type="number"
        />
      </div>
    </div>
  </q-form>
</template>

<script setup>
import { ref, watch } from 'vue'
import { api } from 'boot/axios'
import { Notify } from 'quasar'

const props = defineProps({
  tipo: {
    type: String,
    default: 'todos',
    validator: (value) => ['todos', 'rutinario'].includes(value),
  },
})

defineExpose({
  validarYObtenerDatos,
})

const formRef = ref(null)
const signos = ref([])
const loading = ref(true)

async function fetchSignos() {
  loading.value = true
  try {
    let url = '/signos'
    if (props.tipo === 'rutinario') {
      // Filtra para obtener solo los rutinarios (excluye Peso/Altura)
      url += '?tipo=rutinario'
    }
    const response = await api.get(url)
    signos.value = response.data.map((s) => ({ ...s, medida: '' }))
  } catch (error) {
    console.error(`Error al cargar signos (${props.tipo}):`, error)
    Notify.create({ color: 'negative', message: 'No se pudo cargar la lista de signos vitales.' })
  } finally {
    loading.value = false
  }
}

watch(
  () => props.tipo,
  () => {
    // Reinicia la data y vuelve a cargar si el tipo cambia
    signos.value = []
    fetchSignos()
  },
  { immediate: true },
)

/**
 * Valida el formulario y devuelve los datos ingresados.
 * En 'todos', requiere que el formulario de Quasar pase.
 * En 'rutinario', requiere que se haya ingresado al menos un valor.
 */
async function validarYObtenerDatos() {
  if (!formRef.value) return { datos: [], esValido: false }

  // 1. Valida las reglas de Quasar (solo aplican si props.tipo === 'todos')
  const esValidoDelForm = await formRef.value.validate()
  if (!esValidoDelForm) return { datos: [], esValido: false }

  // 2. Filtra los datos que realmente se ingresaron
  const datos = signos.value
    .filter((s) => s.medida && s.medida.toString().trim() !== '')
    .map((s) => ({ signo_id: s.id, medida: s.medida }))

  // 3. Determina la validez final
  // En Admisión ('todos'), si Quasar pasó, es válido.
  // En Enfermería ('rutinario'), debe haber al menos un dato ingresado.
  const esValidoFinal = props.tipo === 'todos' ? esValidoDelForm : datos.length > 0

  return { datos, esValido: esValidoFinal }
}
</script>
