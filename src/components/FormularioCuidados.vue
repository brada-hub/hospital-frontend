<template>
  <div class="cuidados-form">
    <!-- HEADER SECTION -->
    <div class="form-section">
      <div class="section-title">
        <q-icon name="medical_services" size="20px" class="q-mr-xs" />
        Plan de Cuidados Inicial
      </div>
      <div class="text-grey-7 text-sm">
        Configura las tareas de enfermería que se realizarán de forma recurrente (Opcional)
      </div>
    </div>

    <!-- INFO ALERT -->
    <div class="alert-info q-mb-md">
      <q-icon name="info" size="18px" class="q-mr-md" />
      <span>Paso opcional: Puedes agregar planes de cuidado ahora o configurarlos más tarde.</span>
    </div>

    <!-- FORM INPUTS -->
    <div class="form-section">
      <q-form ref="formRef" @submit.prevent="agregarCuidado" :key="formKey">
        <!-- Grid responsivo para inputs -->
        <div class="cuidado-inputs-grid q-mb-md">
          <q-input
            outlined
            v-model="nuevoCuidado.tipo"
            label="Tipo de Cuidado"
            dense
            class="input-field"
            @update:model-value="onTipoChange"
          >
            <template v-slot:prepend>
              <q-icon name="category" color="teal" />
            </template>
            <template v-slot:hint>
              <span class="text-teal-8">Categoría del cuidado</span>
            </template>
          </q-input>

          <q-input
            outlined
            v-model="nuevoCuidado.frecuencia"
            label="Frecuencia"
            dense
            class="input-field"
            @update:model-value="onFrecuenciaChange"
          >
            <template v-slot:prepend>
              <q-icon name="schedule" color="teal" />
            </template>
            <template v-slot:hint>
              <span class="text-teal-8">Ej: Cada 8h, Diario</span>
            </template>
          </q-input>

          <q-input
            ref="descripcionRef"
            type="textarea"
            outlined
            v-model="nuevoCuidado.descripcion"
            label="Descripción del Cuidado *"
            :rules="descripcionRules"
            reactive-rules
            lazy-rules="ondemand"
            autogrow
            dense
            class="input-field descripcion-field"
            @update:model-value="onDescripcionChange"
            :error="errorDescripcion !== ''"
            :error-message="errorDescripcion"
          >
            <template v-slot:prepend>
              <q-icon name="description" color="teal" />
            </template>
            <template v-slot:hint>
              <div class="flex items-center q-mt-xs">
                <q-icon name="info" size="12px" class="q-mr-xs" />
                <span class="text-teal-8">Describe el cuidado a realizar</span>
              </div>
            </template>
          </q-input>

          <!-- INDICADOR DE VALIDACIÓN -->
          <div v-if="nuevoCuidado.descripcion" class="validacion-indicator">
            <q-icon
              :name="esDescripcionValida ? 'check_circle' : 'warning'"
              :color="esDescripcionValida ? 'positive' : 'warning'"
              size="16px"
            />
            <span
              :class="esDescripcionValida ? 'text-positive' : 'text-warning'"
              class="q-ml-xs text-caption"
            >
              {{ esDescripcionValida ? 'Descripción válida' : 'Ingrese al menos 5 caracteres' }}
            </span>
          </div>
        </div>

        <q-btn
          unelevated
          type="submit"
          color="primary"
          label="Añadir al Plan"
          icon="add"
          :disable="!puedeAgregar"
          class="full-width btn-add"
        />
      </q-form>
    </div>

    <!-- CUIDADOS LIST -->
    <div v-if="cuidados.length > 0" class="cuidados-section">
      <q-list bordered separator class="rounded-borders cuidados-list">
        <q-item-label header class="bg-teal-1 text-teal-9">
          <q-icon name="list" size="18px" class="q-mr-sm" />
          Cuidados Planificados ({{ cuidados.length }})
        </q-item-label>
        <q-item v-for="(cuidado, index) in cuidados" :key="index" class="cuidado-item">
          <q-item-section>
            <q-item-label class="text-weight-medium text-teal-9">{{ cuidado.tipo }}</q-item-label>
            <q-item-label caption class="text-grey-7">
              {{ cuidado.descripcion }} - (Frecuencia: {{ cuidado.frecuencia }})
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat dense round icon="delete" color="negative" @click="quitarCuidado(index)" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, nextTick } from 'vue'
import { Notify } from 'quasar'

const props = defineProps({
  cuidadosIniciales: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:cuidados'])

const formRef = ref(null)
const descripcionRef = ref(null)
const cuidados = ref([])
const errorDescripcion = ref('')
const formKey = ref(0)

const nuevoCuidado = reactive({
  tipo: 'Cuidado General',
  descripcion: '',
  frecuencia: 'Según necesidad',
})

const descripcionRules = [
  (val) => !!val || 'La descripción es requerida',
  (val) => val.length >= 5 || 'Ingrese al menos 5 caracteres',
]

const esDescripcionValida = computed(() => {
  return nuevoCuidado.descripcion && nuevoCuidado.descripcion.length >= 5
})

const puedeAgregar = computed(() => {
  return nuevoCuidado.descripcion && nuevoCuidado.descripcion.length >= 5
})

function onDescripcionChange(value) {
  if (!value || value === '') {
    errorDescripcion.value = 'La descripción es requerida'
  } else if (value.length < 5) {
    errorDescripcion.value = `Ingrese al menos ${5 - value.length} caracteres más`
  } else {
    errorDescripcion.value = ''
  }
}

watch(
  () => props.cuidadosIniciales,
  (newCuidados) => {
    // Evitar actualización si los datos son idénticos (rompe el bucle infinito)
    if (JSON.stringify(newCuidados) === JSON.stringify(cuidados.value)) {
      return
    }

    if (newCuidados && newCuidados.length > 0) {
      cuidados.value = newCuidados.map((c) => ({ ...c }))
    } else if (newCuidados && newCuidados.length === 0 && cuidados.value.length > 0) {
      cuidados.value = []
    }
  },
  { immediate: true, deep: true },
)

async function agregarCuidado() {
  if (!formRef.value) return

  const esValido = await formRef.value.validate()

  if (!esValido) {
    Notify.create({
      type: 'warning',
      message: 'Por favor, complete correctamente la descripción del cuidado',
      icon: 'warning',
      position: 'top',
      timeout: 2000,
    })
    return
  }

  if (!nuevoCuidado.descripcion || nuevoCuidado.descripcion.length < 5) {
    return
  }

  const cuidadoParaAgregar = {
    tipo: nuevoCuidado.tipo,
    descripcion: nuevoCuidado.descripcion,
    frecuencia: nuevoCuidado.frecuencia,
  }

  cuidados.value.push(cuidadoParaAgregar)

  Notify.create({
    type: 'positive',
    message: 'Cuidado añadido al plan',
    icon: 'check_circle',
    position: 'top',
    timeout: 1500,
  })

  await nextTick()

  nuevoCuidado.descripcion = ''
  nuevoCuidado.tipo = 'Cuidado General'
  nuevoCuidado.frecuencia = 'Según necesidad'
  errorDescripcion.value = ''

  await nextTick()

  if (descripcionRef.value) {
    descripcionRef.value.resetValidation()
  }

  if (formRef.value) {
    formRef.value.resetValidation()
  }

  formKey.value++

  setTimeout(() => {
    const listElement = document.querySelector('.cuidados-section')
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, 200)
}

function quitarCuidado(index) {
  const cuidadoEliminado = cuidados.value[index]
  cuidados.value.splice(index, 1)

  Notify.create({
    type: 'info',
    message: `Cuidado "${cuidadoEliminado.tipo}" eliminado`,
    icon: 'delete',
    position: 'top',
    timeout: 1500,
  })
}

watch(
  cuidados,
  (newValue) => {
    emit('update:cuidados', newValue)
  },
  { deep: true },
)
</script>

<style scoped>
.cuidados-form {
  padding: 0;
  width: 100%;
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

.section-title {
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  font-weight: 600;
  color: #0d9488;
  margin-bottom: clamp(12px, 2vw, 16px);
  padding-bottom: 8px;
  border-bottom: 2px solid #ccfbf1;
  display: flex;
  align-items: center;
}

.text-sm {
  font-size: 0.875rem;
}

.alert-info {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: clamp(12px, 2vw, 16px);
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  color: #92400e;
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  flex-wrap: wrap;
  gap: 8px;
}

.alert-info :deep(.q-icon) {
  color: #d97706;
  flex-shrink: 0;
  margin-top: 2px;
}

/* Grid responsivo para inputs de cuidados */
.cuidado-inputs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(12px, 2vw, 16px);
}

.descripcion-field {
  grid-column: 1 / -1;
}

.validacion-indicator {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
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

.input-field :deep(.q-field__messages) {
  font-weight: 500;
  font-size: 0.85rem;
}

.input-field :deep(.q-field__hint) {
  font-size: 0.8rem;
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

.btn-add {
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
  color: white;
  font-weight: 600;
  padding: clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.2);
}

.btn-add:not(:disabled):hover {
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  transform: translateY(-2px);
}

.btn-add:disabled {
  background: #d1d5db;
  color: #9ca3af;
  box-shadow: none;
  opacity: 0.6;
}

.cuidados-section {
  margin-top: clamp(16px, 3vw, 24px);
}

.cuidados-list {
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  animation: slideInFromTop 0.4s ease-out;
}

.cuidados-list :deep(.q-item-label--header) {
  background: #f0fdfa !important;
  border-bottom: 2px solid #ccfbf1;
  font-weight: 600;
  color: #0d9488;
  padding: clamp(12px, 2vw, 16px) clamp(16px, 3vw, 20px);
}

.cuidado-item {
  transition: all 0.2s ease;
  border-bottom: 1px solid #e2e8f0 !important;
  padding: clamp(12px, 2vw, 16px) clamp(16px, 3vw, 20px);
}

.cuidado-item:hover {
  background: #f0fdfa;
}

.cuidado-item:last-child {
  border-bottom: none !important;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bg-teal-1 {
  background: #f0fdfa;
}

.text-teal-9 {
  color: #0d9488;
}

.text-teal-8 {
  color: #14b8a6;
}

/* Responsive - colapsar a 1 columna en mobile */
@media (max-width: 768px) {
  .cuidado-inputs-grid {
    grid-template-columns: 1fr;
  }

  .descripcion-field {
    grid-column: 1;
  }

  .validacion-indicator {
    grid-column: 1;
  }

  .section-title {
    font-size: 1rem;
  }

  .alert-info {
    font-size: 0.9rem;
  }
}
</style>
