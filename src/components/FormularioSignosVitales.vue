<template>
  <div class="signos-vitales-form">
    <q-form ref="formRef" class="form-content">
      <!-- LOADING STATE -->
      <div v-if="loading" class="text-center q-py-lg">
        <q-spinner color="teal" size="3em" />
        <div class="text-grey-7 q-mt-md">Cargando signos vitales...</div>
      </div>

      <!-- NO DATA STATE -->
      <div v-else-if="signos.length === 0" class="form-section text-center">
        <q-icon name="sentiment_dissatisfied" size="48px" color="grey-5" />
        <div class="text-grey-8 q-mt-md">No se encontraron signos vitales para registrar.</div>
      </div>

      <!-- SIGNOS VITALES INPUTS -->
      <div v-else>
        <div v-for="signo in signos" :key="signo.id" class="form-section">
          <div class="signo-container">
            <div class="signo-label">
              <q-icon name="monitor_heart" size="18px" color="teal" class="q-mr-sm" />
              <span class="text-weight-600 text-teal-9">{{ signo.nombre }}</span>
              <span class="text-grey-7 q-ml-xs">({{ signo.unidad }})</span>
            </div>

            <q-input
              outlined
              v-model.number="signo.medida"
              type="number"
              dense
              :label="`Ingrese ${signo.nombre.toLowerCase()} *`"
              :rules="[
                (val) => (val !== null && val !== '') || 'Este campo es requerido',
                (val) => val > 0 || 'El valor debe ser mayor a 0',
                (val) => val <= 300 || 'Valor muy alto, verifique',
              ]"
              reactive-rules
              class="input-field q-mt-md"
              @update:model-value="validarSigno(signo)"
              :error="errorSignos[signo.id] !== ''"
              :error-message="errorSignos[signo.id]"
            >
              <template v-slot:prepend>
                <q-icon name="edit" color="teal" />
              </template>
              <template v-slot:hint>
                <div class="flex items-center q-mt-xs">
                  <q-icon name="info" size="12px" class="q-mr-xs" />
                  <span class="text-teal-8"
                    >Rango recomendado: {{ getRangoRecomendado(signo) }}</span
                  >
                </div>
              </template>
            </q-input>

            <!-- Indicador visual mejorado -->
            <div v-if="signo.medida" class="validacion-indicator q-mt-sm">
              <q-icon
                :name="esSignoValido(signo) ? 'check_circle' : 'warning'"
                :color="esSignoValido(signo) ? 'positive' : 'warning'"
                size="16px"
              />
              <span
                :class="esSignoValido(signo) ? 'text-positive' : 'text-warning'"
                class="q-ml-xs text-caption"
              >
                {{ esSignoValido(signo) ? 'Validado' : getMensajeValidacion(signo) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </q-form>
  </div>
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
  signosIniciales: {
    type: Array,
    default: null,
  },
})

defineExpose({
  validarYObtenerDatos,
})

const formRef = ref(null)
const signos = ref([])
const loading = ref(true)
const errorSignos = ref({})

async function fetchSignos() {
  loading.value = true
  errorSignos.value = {}
  try {
    let url = '/signos'
    if (props.tipo === 'rutinario') {
      url += '?tipo=rutinario'
    }
    const response = await api.get(url)
    signos.value = response.data.map((s) => ({ ...s, medida: null }))

    // ✅ Cargar valores guardados si existen
    if (props.signosIniciales && props.signosIniciales.length > 0) {
      console.log('📥 Restaurando signos vitales guardados:', props.signosIniciales)
      props.signosIniciales.forEach((signoGuardado) => {
        const signo = signos.value.find((s) => s.id === signoGuardado.signo_id)
        if (signo) {
          // Convertir de string a número si es necesario
          signo.medida =
            typeof signoGuardado.medida === 'string'
              ? parseFloat(signoGuardado.medida)
              : signoGuardado.medida
        }
      })
    }
  } catch (error) {
    console.error(`Error al cargar signos (${props.tipo}):`, error)
    Notify.create({
      color: 'negative',
      message: 'No se pudo cargar la lista de signos vitales.',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

// ✅ WATCH para recargar cuando cambien los datos iniciales
watch(
  () => props.signosIniciales,
  (newSignos) => {
    if (newSignos && newSignos.length > 0 && signos.value.length > 0) {
      console.log('📥 Actualizando signos vitales:', newSignos)
      newSignos.forEach((signoGuardado) => {
        const signo = signos.value.find((s) => s.id === signoGuardado.signo_id)
        if (signo) {
          signo.medida =
            typeof signoGuardado.medida === 'string'
              ? parseFloat(signoGuardado.medida)
              : signoGuardado.medida
          errorSignos.value[signo.id] = ''
        }
      })
    }
  },
  { deep: true },
)

watch(
  () => props.tipo,
  () => {
    signos.value = []
    errorSignos.value = {}
    fetchSignos()
  },
  { immediate: true },
)

function validarSigno(signo) {
  if (!signo.medida || signo.medida === '') {
    errorSignos.value[signo.id] = 'Este campo es requerido'
    return
  }

  if (signo.medida <= 0) {
    errorSignos.value[signo.id] = 'El valor debe ser mayor a 0'
    return
  }

  if (signo.medida > 300) {
    errorSignos.value[signo.id] = 'Valor muy alto, verifique'
    return
  }

  errorSignos.value[signo.id] = ''
}

function esSignoValido(signo) {
  if (!signo.medida || signo.medida === '') return false
  if (signo.medida <= 0) return false
  if (signo.rango_minimo && signo.medida < signo.rango_minimo) return false
  if (signo.rango_maximo && signo.medida > signo.rango_maximo) return false
  return true
}

function getRangoRecomendado(signo) {
  const min = signo.rango_minimo ?? 'N/A'
  const max = signo.rango_maximo ?? 'N/A'
  return `${min} - ${max}`
}

function getMensajeValidacion(signo) {
  if (!signo.medida || signo.medida === '') return 'Ingrese un valor'
  if (signo.medida <= 0) return 'El valor debe ser mayor a 0'
  if (signo.rango_minimo && signo.medida < signo.rango_minimo) {
    return `Valor bajo - por debajo del rango (${signo.rango_minimo})`
  }
  if (signo.rango_maximo && signo.medida > signo.rango_maximo) {
    return `Valor alto - por encima del rango (${signo.rango_maximo})`
  }
  return 'Validado'
}

async function validarYObtenerDatos() {
  if (!formRef.value) return { datos: [], esValido: false }

  const esValidoDelForm = await formRef.value.validate()
  if (!esValidoDelForm) return { datos: [], esValido: false }

  const datos = signos.value
    .filter((s) => s.medida !== null && s.medida !== '')
    .map((s) => ({ signo_id: s.id, medida: s.medida }))

  const esValidoFinal = props.tipo === 'todos' ? esValidoDelForm : datos.length > 0

  return { datos, esValido: esValidoFinal }
}
</script>

<style scoped>
.signos-vitales-form {
  padding: 0;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.form-section:hover {
  border-color: #14b8a6;
  box-shadow: 0 2px 8px rgba(20, 184, 166, 0.1);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0d9488;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #ccfbf1;
  display: flex;
  align-items: center;
}

.signo-container {
  display: flex;
  flex-direction: column;
}

.signo-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #0d9488;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.input-field {
  transition: all 0.3s ease;
}

.input-field :deep(.q-field__control) {
  background: white;
  border-radius: 8px;
}

.input-field :deep(.q-field__native) {
  font-weight: 500;
}

.input-field.q-field--error :deep(.q-field__control) {
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.input-field :deep(.q-field__messages) {
  font-weight: 500;
  font-size: 0.85rem;
}

.input-field :deep(.q-field__hint) {
  font-size: 0.8rem;
  font-weight: 500;
}

.validacion-indicator {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .form-section {
    padding: 16px;
  }

  .section-title {
    font-size: 1rem;
  }

  .signo-label {
    font-size: 0.9rem;
  }
}
</style>
