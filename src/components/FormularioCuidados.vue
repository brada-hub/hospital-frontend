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
      <span
        >Paso opcional: Puedes agregar planes de cuidado ahora o configurarlos más tarde desde el
        panel del paciente.</span
      >
    </div>

    <!-- FORM INPUTS -->
    <div class="form-section">
      <div class="row items-start q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6">
          <q-input
            outlined
            v-model="nuevoCuidado.tipo"
            label="Tipo de Cuidado (ej. General, Postoperatorio)"
            dense
            class="input-field"
          >
            <template v-slot:prepend>
              <q-icon name="category" color="teal" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6">
          <q-input
            outlined
            v-model="nuevoCuidado.frecuencia"
            label="Frecuencia (ej. Cada 8h, Diario)"
            dense
            class="input-field"
          >
            <template v-slot:prepend>
              <q-icon name="schedule" color="teal" />
            </template>
          </q-input>
        </div>
        <div class="col-12">
          <!-- Added ref to reset validation state after adding cuidado -->
          <q-input
            ref="descripcionRef"
            type="textarea"
            outlined
            v-model="nuevoCuidado.descripcion"
            label="Descripción del Cuidado *"
            :rules="[(val) => !!val || 'La descripción es requerida']"
            autogrow
            dense
            class="input-field"
            @blur="validarDescripcion"
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
        </div>
        <div class="col-12">
          <q-btn
            unelevated
            color="primary"
            label="Añadir al Plan"
            icon="add"
            @click="agregarCuidado"
            :disable="!nuevoCuidado.descripcion"
            class="full-width btn-add"
          />
        </div>
      </div>
    </div>

    <!-- CUIDADOS LIST -->
    <q-list bordered separator v-if="cuidados.length > 0" class="rounded-borders cuidados-list">
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
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { defineEmits } from 'vue'

const emit = defineEmits(['update:cuidados'])

const cuidados = ref([])
const descripcionRef = ref(null)
const nuevoCuidado = reactive({
  tipo: 'Cuidado General',
  descripcion: '',
  frecuencia: 'Según necesidad',
})

function validarDescripcion() {
  // Only validation on blur, doesn't persist error state
  return !!nuevoCuidado.descripcion
}

function agregarCuidado() {
  if (!nuevoCuidado.descripcion) return

  cuidados.value.push({ ...nuevoCuidado })

  // Reset de campo sin activar validación automática
  nuevoCuidado.descripcion = ''
  nuevoCuidado.tipo = 'Cuidado General'
  nuevoCuidado.frecuencia = 'Según necesidad'

  // Limpia el estado de error del input
  if (descripcionRef.value) {
    descripcionRef.value.resetValidation()
    descripcionRef.value.blur() // fuerza salir del modo “validando”
  }
}

function quitarCuidado(index) {
  cuidados.value.splice(index, 1)
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
}

/* Estilos estandarizados del componente de admisión */
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

.text-sm {
  font-size: 0.875rem;
}

/* Alert info styling */
.alert-info {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  color: #92400e;
  font-size: 0.95rem;
}

.alert-info :deep(.q-icon) {
  color: #d97706;
  flex-shrink: 0;
  margin-top: 2px;
}

/* Input field styling */
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

/* Button styling */
.btn-add {
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  transition: all 0.3s ease;
}

.btn-add:hover {
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  transform: translateY(-2px);
}

.btn-add:disabled {
  background: #d1d5db;
  color: #9ca3af;
}

/* Cuidados list styling */
.cuidados-list {
  border-radius: 12px !important;
  overflow: hidden;
}

.cuidados-list :deep(.q-item-label--header) {
  background: #f0fdfa !important;
  border-bottom: 2px solid #ccfbf1;
  font-weight: 600;
  color: #0d9488;
}

.cuidado-item {
  transition: all 0.2s ease;
  border-bottom: 1px solid #e2e8f0 !important;
}

.cuidado-item:hover {
  background: #f0fdfa;
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

/* Responsive */
@media (max-width: 768px) {
  .form-section {
    padding: 16px;
  }

  .section-title {
    font-size: 1rem;
  }

  .alert-info {
    font-size: 0.9rem;
  }
}
</style>
