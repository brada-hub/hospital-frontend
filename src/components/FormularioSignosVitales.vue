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

      <!-- Grid responsivo para signos vitales -->
      <div v-else class="signos-grid">
        <div v-for="signo in signos" :key="signo.id" class="form-section">
          <div class="signo-container">
            <div class="signo-label">
              <q-icon name="monitor_heart" size="18px" color="teal" class="q-mr-sm" />
              <span class="text-weight-600 text-teal-9">{{ signo.nombre }}</span>
              <span class="text-grey-7 q-ml-xs">({{ signo.unidad }})</span>
            </div>

            <!-- DUAL INPUTS para signos que requieren valores duales -->
            <div v-if="signo.requiere_valores_duales" class="dual-inputs-container">
              <q-input
                outlined
                v-model.number="signo.medida"
                type="number"
                step="0.1"
                dense
                label="Valor Alto *"
                :rules="validationRules"
                reactive-rules
                lazy-rules="ondemand"
                class="input-field dual-input"
                @update:model-value="onInputChange(signo, 'medida')"
                :error="getError(signo.id, 'medida') !== ''"
                :error-message="getError(signo.id, 'medida')"
              >
                <template v-slot:prepend>
                  <q-icon name="arrow_upward" color="red" />
                </template>
              </q-input>

              <q-input
                outlined
                v-model.number="signo.medida_baja"
                type="number"
                step="0.1"
                dense
                label="Valor Bajo *"
                :rules="validationRules"
                reactive-rules
                lazy-rules="ondemand"
                class="input-field dual-input"
                @update:model-value="onInputChange(signo, 'medida_baja')"
                :error="getError(signo.id, 'medida_baja') !== ''"
                :error-message="getError(signo.id, 'medida_baja')"
              >
                <template v-slot:prepend>
                  <q-icon name="arrow_downward" color="blue" />
                </template>
              </q-input>
            </div>

            <!-- SINGLE INPUT para signos normales -->
            <q-input
              v-else
              outlined
              v-model.number="signo.medida"
              type="number"
              step="0.1"
              dense
              :label="`Ingrese ${signo.nombre.toLowerCase()} *`"
              :rules="validationRules"
              reactive-rules
              lazy-rules="ondemand"
              class="input-field q-mt-md"
              @update:model-value="onInputChange(signo, 'medida')"
              :error="getError(signo.id, 'medida') !== ''"
              :error-message="getError(signo.id, 'medida')"
            >
              <template v-slot:prepend>
                <q-icon name="edit" color="teal" />
              </template>
              <template v-slot:hint>
                <div class="flex items-center q-mt-xs">
                  <q-icon name="info" size="12px" class="q-mr-xs" />
                  <span class="text-teal-8">Rango: {{ getRangoRecomendado(signo) }}</span>
                </div>
              </template>
            </q-input>

            <!-- INDICADOR DE VALIDACIÓN -->
            <div v-if="hasAnyValue(signo)" class="validacion-indicator q-mt-sm">
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
const errorMessages = ref({})

const validationRules = [
  (val) => (val !== null && val !== '' && val !== undefined) || 'Este campo es requerido',
  (val) => val > 0 || 'El valor debe ser mayor a 0',
  (val) => val <= 300 || 'Valor muy alto, verifique',
]

async function fetchSignos() {
  loading.value = true
  errorMessages.value = {}

  try {
    let url = '/signos'
    if (props.tipo === 'rutinario') {
      url += '?tipo=rutinario'
    }

    const response = await api.get(url)
    signos.value = response.data.map((s) => ({
      ...s,
      medida: null,
      medida_baja: null,
    }))

    if (props.signosIniciales && props.signosIniciales.length > 0) {
      restaurarSignosGuardados()
    }
  } catch  {
    Notify.create({
      color: 'negative',
      message: 'No se pudo cargar la lista de signos vitales.',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

function restaurarSignosGuardados() {
  if (!props.signosIniciales || props.signosIniciales.length === 0) return

  props.signosIniciales.forEach((signoGuardado) => {
    const signo = signos.value.find((s) => s.id === signoGuardado.signo_id)
    if (signo) {
      signo.medida = typeof signoGuardado.medida === 'string'
        ? parseFloat(signoGuardado.medida)
        : signoGuardado.medida

      if (signoGuardado.medida_baja) {
        signo.medida_baja = typeof signoGuardado.medida_baja === 'string'
          ? parseFloat(signoGuardado.medida_baja)
          : signoGuardado.medida_baja
      }

      if (errorMessages.value[signo.id]) {
        delete errorMessages.value[signo.id]
      }
    }
  })
}

watch(
  () => props.signosIniciales,
  (newSignos) => {
    if (newSignos && newSignos.length > 0 && signos.value.length > 0) {
      restaurarSignosGuardados()
    }
  },
  { deep: true }
)

watch(
  () => props.tipo,
  () => {
    signos.value = []
    errorMessages.value = {}
    fetchSignos()
  },
  { immediate: true }
)

function onInputChange(signo, campo) {
  const valor = signo[campo]

  if (!errorMessages.value[signo.id]) {
    errorMessages.value[signo.id] = {}
  }

  if (valor === null || valor === '' || valor === undefined) {
    errorMessages.value[signo.id][campo] = 'Este campo es requerido'
  } else if (valor <= 0) {
    errorMessages.value[signo.id][campo] = 'El valor debe ser mayor a 0'
  } else if (valor > 300) {
    errorMessages.value[signo.id][campo] = 'Valor muy alto, verifique'
  } else {
    errorMessages.value[signo.id][campo] = ''
  }

  errorMessages.value = { ...errorMessages.value }
}

function getError(signoId, campo) {
  return errorMessages.value[signoId]?.[campo] || ''
}

function hasAnyValue(signo) {
  return (signo.medida !== null && signo.medida !== '') ||
         (signo.medida_baja !== null && signo.medida_baja !== '')
}

function esSignoValido(signo) {
  if (signo.requiere_valores_duales) {
    const medidaValida = signo.medida !== null && signo.medida !== '' &&
                         signo.medida > 0 && signo.medida <= 300
    const medidaBajaValida = signo.medida_baja !== null && signo.medida_baja !== '' &&
                             signo.medida_baja > 0 && signo.medida_baja <= 300
    return medidaValida && medidaBajaValida
  } else {
    return signo.medida !== null && signo.medida !== '' &&
           signo.medida > 0 && signo.medida <= 300
  }
}

function getRangoRecomendado(signo) {
  const min = signo.rango_minimo ?? 'N/A'
  const max = signo.rango_maximo ?? 'N/A'
  return `${min} - ${max}`
}

function getMensajeValidacion(signo) {
  if (signo.requiere_valores_duales) {
    if (!signo.medida || signo.medida === '' || !signo.medida_baja || signo.medida_baja === '') {
      return 'Complete ambos valores'
    }
    if (signo.medida <= 0 || signo.medida_baja <= 0) {
      return 'Los valores deben ser mayores a 0'
    }
    if (signo.medida > 300 || signo.medida_baja > 300) {
      return 'Valores muy altos, verifique'
    }
  } else {
    if (!signo.medida || signo.medida === '') return 'Ingrese un valor'
    if (signo.medida <= 0) return 'El valor debe ser mayor a 0'
    if (signo.medida > 300) return 'Valor muy alto, verifique'
  }

  return 'Validado'
}

async function validarYObtenerDatos() {
  if (!formRef.value) return { datos: [], esValido: false }

  const esValidoDelForm = await formRef.value.validate()

  const datos = signos.value
    .filter((s) => {
      if (s.requiere_valores_duales) {
        return (s.medida !== null && s.medida !== '') &&
               (s.medida_baja !== null && s.medida_baja !== '')
      } else {
        return s.medida !== null && s.medida !== ''
      }
    })
    .map((s) => {
      const dato = {
        signo_id: s.id,
        medida: s.medida,
      }

      if (s.requiere_valores_duales && s.medida_baja !== null && s.medida_baja !== '') {
        dato.medida_baja = s.medida_baja
      }

      return dato
    })

  const esValidoFinal = esValidoDelForm && datos.length > 0

  return { datos, esValido: esValidoFinal }
}
</script>

<style scoped>
.signos-vitales-form {
  padding: 0;
  width: 100%;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 3vw, 24px);
}

/* Grid responsivo - 3 columnas en desktop, 2 en tablet, 1 en mobile */
.signos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(12px, 2vw, 20px);
}

.form-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: clamp(14px, 2vw, 20px);
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.form-section:hover {
  border-color: #14b8a6;
  box-shadow: 0 2px 8px rgba(20, 184, 166, 0.1);
}

.signo-container {
  display: flex;
  flex-direction: column;
}

.signo-label {
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  font-weight: 500;
  color: #0d9488;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.dual-inputs-container {
  display: flex;
  gap: clamp(8px, 2vw, 16px);
  margin-top: 12px;
  flex-wrap: wrap;
}

.dual-input {
  flex: 1;
  min-width: 100px;
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
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
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
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

/* Responsive breakpoints */
@media (max-width: 1200px) {
  .signos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .signos-grid {
    grid-template-columns: 1fr;
  }

  .dual-inputs-container {
    flex-direction: column;
  }

  .dual-input {
    min-width: 100%;
  }

  .signo-label {
    font-size: 0.9rem;
  }
}
</style>
