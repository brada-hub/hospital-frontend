<template>
  <q-page padding class="page-background">
    <div class="q-mx-auto" style="max-width: 900px">
      <q-stepper
        v-model="step"
        ref="stepper"
        color="primary"
        animated
        header-nav
        flat
        bordered
        class="styled-stepper"
      >
        <q-step
          :name="1"
          title="Datos de Admisión"
          icon="assignment_ind"
          :done="step > 1"
          :header-nav="step > 1"
        >
          <div class="step-content">
            <div class="text-h6 q-mb-md">Registrar Nueva Admisión</div>
            <q-form @submit.prevent="avanzarPaso" class="q-gutter-md">
              <q-select
                outlined
                v-model="admisionForm.paciente_id"
                use-input
                hide-selected
                fill-input
                input-debounce="500"
                label="Buscar paciente por nombre o CI *"
                :options="pacientesFiltrados"
                @filter="buscarPacientes"
                option-value="id"
                :option-label="
                  (paciente) => `${paciente.nombre} ${paciente.apellidos} - CI: ${paciente.ci}`
                "
                emit-value
                map-options
                lazy-rules
                :rules="[(val) => !!val || 'Debe seleccionar un paciente']"
                :loading="isSearching"
              >
                <template v-slot:prepend><q-icon name="person_search" /></template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">No hay resultados</q-item-section>
                  </q-item>
                </template>
              </q-select>

              <div class="text-subtitle1 text-grey-8 q-mt-md">Asignación de Cama</div>
              <q-select
                outlined
                v-model="selectedSala"
                :options="salas"
                option-value="id"
                :option-label="
                  (sala) =>
                    `${sala.nombre} (${sala.especialidad ? sala.especialidad.nombre : 'Sin especialidad'})`
                "
                emit-value
                map-options
                label="1. Seleccionar Sala *"
                lazy-rules
                :rules="[(val) => !!val || 'Seleccione una sala']"
              >
                <template v-slot:prepend><q-icon name="meeting_room" /></template>
              </q-select>

              <q-select
                outlined
                v-model="admisionForm.cama_id"
                :options="camasDisponibles"
                label="2. Seleccionar Cama Disponible *"
                option-value="id"
                :option-label="(cama) => `Cama: ${cama.nombre} - Tipo: ${cama.tipo}`"
                emit-value
                map-options
                lazy-rules
                :rules="[(val) => !!val || 'Debe seleccionar una cama']"
                :disable="!selectedSala"
                :loading="isLoadingCamas"
                hint="Primero debe seleccionar una sala"
              >
                <template v-slot:prepend><q-icon name="bed" /></template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey"
                      >No hay camas disponibles en esta sala</q-item-section
                    >
                  </q-item>
                </template>
              </q-select>
              <div class="text-subtitle1 text-grey-8 q-mt-md">Detalles del Ingreso</div>
              <q-input
                outlined
                v-model="admisionForm.motivo"
                label="Motivo de Ingreso *"
                lazy-rules
                :rules="[(val) => !!val || 'Campo requerido']"
              />
              <q-input
                outlined
                v-model="admisionForm.diagnostico"
                label="Diagnóstico Inicial *"
                lazy-rules
                :rules="[(val) => !!val || 'Campo requerido']"
              />
              <q-input
                outlined
                v-model="admisionForm.observaciones"
                type="textarea"
                label="Observaciones (Opcional)"
              />

              <q-stepper-navigation>
                <q-btn
                  unelevated
                  type="submit"
                  color="primary"
                  label="Registrar Admisión y Continuar"
                  :loading="submittingAdmision"
                />
              </q-stepper-navigation>
            </q-form>
          </div>
        </q-step>

        <q-step
          :name="2"
          title="Prescripción Inicial"
          icon="medical_services"
          :done="step > 2"
          :header-nav="step > 2"
          :disable="!nuevaInternacionId"
        >
          <div class="step-content">
            <formulario-prescripcion
              v-if="nuevaInternacionId"
              :internacion-id="nuevaInternacionId"
              @tratamiento-guardado="onTratamientoGuardado"
            />
          </div>
          <q-stepper-navigation>
            <q-btn flat @click="step = 1" color="primary" label="Atrás" class="q-mr-sm" />
            <q-btn unelevated color="positive" label="Finalizar Proceso" @click="step = 3" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="3" title="Completado" icon="check_circle">
          <div class="final-step-content">
            <q-icon name="check_circle" color="positive" size="100px" />
            <div class="text-h5 q-mt-md text-weight-medium">Proceso Completado</div>
            <p class="text-grey-8 q-mt-sm">
              El paciente fue admitido y el tratamiento inicial ha sido prescrito con éxito.
            </p>
            <q-btn
              to="/pacientes"
              unelevated
              label="Ir a Lista de Pacientes"
              color="primary"
              class="q-mt-md"
            />
            <q-btn
              flat
              @click="reiniciarProceso"
              label="Registrar Nueva Admisión"
              color="secondary"
              class="q-mt-md q-ml-sm"
            />
          </div>
        </q-step>
      </q-stepper>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue' // <-- ❗️ nextTick importado
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import FormularioPrescripcion from 'components/FormularioPrescripcion.vue'

const $q = useQuasar()
const step = ref(1)
const stepper = ref(null)

const admisionForm = reactive({
  paciente_id: null,
  cama_id: null,
  motivo: '',
  diagnostico: '',
  observaciones: '',
})

const pacientesFiltrados = ref([])
const salas = ref([])
const selectedSala = ref(null)
const camasDisponibles = ref([])
const submittingAdmision = ref(false)
const isSearching = ref(false)
const isLoadingCamas = ref(false)
const nuevaInternacionId = ref(null)

onMounted(() => {
  cargarSalas()
})

watch(selectedSala, (newId) => {
  admisionForm.cama_id = null
  camasDisponibles.value = []
  if (newId) {
    cargarCamasDisponibles(newId)
  }
})

async function cargarSalas() {
  try {
    const response = await api.get('/salas')
    salas.value = response.data
    if (salas.value.length === 0) {
      $q.notify({
        color: 'warning',
        message: 'No se encontraron salas activas.',
        icon: 'warning',
      })
    }
  } catch (error) {
    console.error('Error CRÍTICO al cargar salas:', error)
    $q.notify({ color: 'negative', message: 'No se pudieron cargar las salas.' })
  }
}

async function cargarCamasDisponibles(salaId) {
  isLoadingCamas.value = true
  try {
    const response = await api.get('/camas-disponibles', {
      params: { sala_id: salaId },
    })
    camasDisponibles.value = response.data
  } catch (error) {
    console.error('Error al cargar camas:', error)
    $q.notify({ color: 'negative', message: 'No se pudieron cargar las camas disponibles.' })
  } finally {
    isLoadingCamas.value = false
  }
}

const buscarPacientes = async (val, update) => {
  if (val.length < 2) {
    update(() => {
      pacientesFiltrados.value = []
    })
    return
  }
  isSearching.value = true
  try {
    const { data } = await api.get('/pacientes/buscar', { params: { termino: val } })
    update(() => {
      pacientesFiltrados.value = data
    })
  } catch (error) {
    console.error('Error al buscar pacientes:', error)
    update(() => {
      pacientesFiltrados.value = []
    })
  } finally {
    isSearching.value = false
  }
}

function avanzarPaso() {
  registrarAdmision()
}

async function registrarAdmision() {
  submittingAdmision.value = true
  try {
    const response = await api.post('/admisiones', admisionForm)
    nuevaInternacionId.value = response.data.data.internacion.id
    $q.notify({
      color: 'positive',
      icon: 'check',
      message: response.data.message,
    })

    // ❗️ CORRECCIÓN APLICADA AQUÍ ❗️
    // Esperamos que Vue actualice el DOM para habilitar el Paso 2
    await nextTick()

    // Ahora sí, avanzamos al siguiente paso
    stepper.value.next()
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Ocurrió un error en la admisión.'
    $q.notify({ color: 'negative', message: errorMessage, icon: 'warning' })
  } finally {
    submittingAdmision.value = false
  }
}

function onTratamientoGuardado(tratamiento) {
  console.log('Tratamiento guardado:', tratamiento)
  $q.notify({
    color: 'info',
    message: 'Tratamiento inicial guardado. Puede finalizar el proceso.',
  })
}

function reiniciarProceso() {
  admisionForm.paciente_id = null
  admisionForm.cama_id = null
  admisionForm.motivo = ''
  admisionForm.diagnostico = ''
  admisionForm.observaciones = ''
  selectedSala.value = null
  nuevaInternacionId.value = null
  step.value = 1
}
</script>

<style scoped>
.page-background {
  background-color: #f5f5f5;
}
.styled-stepper {
  border-radius: 8px;
  background-color: #ffffff;
}
.step-content {
  padding: 16px;
}
.final-step-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  min-height: 400px;
}
.q-field--outlined .q-field__control {
  border-radius: 8px !important;
}
</style>
