<template>
  <div class="step-content">
    <div class="text-h6 q-mb-md">Registrar Nueva Admisión</div>
    <q-form ref="formRef" @submit.prevent="validarYContinuar" class="q-gutter-md">
      <!-- BUSCAR PACIENTE -->
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
        <template v-slot:no-option
          ><q-item
            ><q-item-section class="text-grey">No hay resultados</q-item-section></q-item
          ></template
        >
      </q-select>

      <!-- SELECCIONAR MÉDICO RESPONSABLE -->
      <div class="text-subtitle1 text-grey-8 q-mt-lg">Asignación de Profesional</div>
      <q-select
        outlined
        v-model="admisionForm.medico_id"
        :options="listaMedicos"
        label="Médico Responsable *"
        option-value="id"
        :option-label="
          (medico) =>
            `${medico.nombre} ${medico.apellidos} (${medico.pacientes_activos_count} pacientes)`
        "
        emit-value
        map-options
        lazy-rules
        :rules="[(val) => !!val || 'Debe asignar un médico.']"
        :loading="isLoadingMedicos"
      >
        <template v-slot:prepend><q-icon name="medical_information" /></template>
      </q-select>

      <!-- ASIGNACIÓN DE CAMA -->
      <div class="text-subtitle1 text-grey-8 q-mt-lg">Asignación de Cama</div>
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
        <template v-slot:no-option
          ><q-item
            ><q-item-section class="text-grey"
              >No hay camas disponibles en esta sala</q-item-section
            ></q-item
          ></template
        >
      </q-select>

      <!-- DETALLES DEL INGRESO -->
      <div class="text-subtitle1 text-grey-8 q-mt-lg">Detalles del Ingreso</div>
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
          label="Continuar a Signos Vitales"
          icon-right="arrow_forward"
        />
      </q-stepper-navigation>
    </q-form>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, onMounted, watch } from 'vue'
import { Notify } from 'quasar'
import { api } from 'boot/axios'

export default defineComponent({
  name: 'DatosAdmisionForm',
  emits: ['datos-listos'],
  setup(_, { emit, expose }) {
    const formRef = ref(null)
    const admisionForm = reactive({
      paciente_id: null,
      cama_id: null,
      medico_id: null,
      motivo: '',
      diagnostico: '',
      observaciones: '',
    })

    const pacientesFiltrados = ref([])
    const salas = ref([])
    const selectedSala = ref(null)
    const camasDisponibles = ref([])
    const listaMedicos = ref([])

    const isSearching = ref(false)
    const isLoadingCamas = ref(false)
    const isLoadingMedicos = ref(false)

    onMounted(() => {
      cargarSalas()
      cargarMedicos()
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
      } catch (error) {
        console.error('Error cargando salas:', error) // ✅ CORREGIDO
        Notify.create({ color: 'negative', message: 'No se pudieron cargar las salas.' })
      }
    }

    async function cargarCamasDisponibles(salaId) {
      isLoadingCamas.value = true
      try {
        const response = await api.get('/camas-disponibles', { params: { sala_id: salaId } })
        camasDisponibles.value = response.data
      } catch (error) {
        console.error('Error cargando camas:', error) // ✅ CORREGIDO
        Notify.create({
          color: 'negative',
          message: 'No se pudieron cargar las camas disponibles.',
        })
      } finally {
        isLoadingCamas.value = false
      }
    }

    async function cargarMedicos() {
      isLoadingMedicos.value = true
      try {
        const response = await api.get('/medicos-activos')
        listaMedicos.value = response.data
      } catch (error) {
        console.error('Error cargando médicos:', error) // ✅ CORREGIDO
        Notify.create({ color: 'negative', message: 'No se pudo cargar la lista de médicos.' })
      } finally {
        isLoadingMedicos.value = false
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
        console.error('Error buscando pacientes:', error) // ✅ CORREGIDO
        update(() => {
          pacientesFiltrados.value = []
        })
      } finally {
        isSearching.value = false
      }
    }

    async function validarYContinuar() {
      const esValido = await formRef.value.validate()
      if (esValido) {
        emit('datos-listos', admisionForm)
      }
    }

    function reset() {
      if (formRef.value) {
        formRef.value.resetValidation()
      }
      Object.assign(admisionForm, {
        paciente_id: null,
        cama_id: null,
        medico_id: null,
        motivo: '',
        diagnostico: '',
        observaciones: '',
      })
      selectedSala.value = null
    }

    expose({ reset })

    return {
      formRef,
      admisionForm,
      pacientesFiltrados,
      salas,
      selectedSala,
      camasDisponibles,
      listaMedicos,
      isSearching,
      isLoadingCamas,
      isLoadingMedicos,
      validarYContinuar,
      buscarPacientes,
    }
  },
})
</script>

<style scoped>
.step-content {
  padding: 16px;
}
</style>
