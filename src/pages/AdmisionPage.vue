<template>
  <q-page padding class="page-background">
    <div class="q-mx-auto" style="max-width: 900px">
      <div class="text-h4 q-mb-md text-weight-bold">Nueva Admisión</div>
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
        <q-step :name="1" title="Datos de Admisión" icon="assignment_ind" :done="step > 1">
          <DatosAdmisionForm ref="admisionFormRef" @datos-listos="onDatosAdmisionListos" />
        </q-step>

        <q-step :name="2" title="Signos Vitales" icon="monitor_heart" :done="step > 2">
          <FormularioSignosVitales ref="signosVitalesFormRef" />
          <q-stepper-navigation>
            <q-btn flat @click="step = 1" color="primary" label="Atrás" class="q-mr-sm" />
            <q-btn @click="onSignosListos" color="primary" label="Siguiente" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="3" title="Plan de Cuidados" icon="list_alt" :done="step > 3">
          <div class="text-h6 q-mb-sm">Plan de Cuidados Inicial (Opcional)</div>
          <p class="text-grey-8">
            Añada los planes de cuidado recurrentes que el personal de enfermería deberá seguir.
          </p>
          <FormularioCuidados @update:cuidados="onCuidadosUpdate" />

          <q-stepper-navigation>
            <q-btn flat @click="step = 2" color="primary" label="Atrás" class="q-mr-sm" />
            <q-btn
              unelevated
              color="positive"
              label="Finalizar y Guardar Admisión"
              @click="finalizarAdmision"
              :loading="isSaving"
              icon="save"
            />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="4" title="Completado" icon="check_circle">
          <div class="final-step-content">
            <q-icon name="check_circle" color="positive" size="100px" />
            <div class="text-h5 q-mt-md text-weight-medium">Admisión Completada</div>
            <p class="text-grey-8 q-mt-sm">
              El paciente ha sido internado y sus datos iniciales han sido registrados.
            </p>
            <q-btn
              :to="`/pacientes/internacion/${nuevaInternacionId}`"
              unelevated
              label="Ir al Panel del Paciente"
              color="primary"
              class="q-mt-md"
              v-if="nuevaInternacionId"
              icon="visibility"
            />
            <q-btn
              flat
              @click="reiniciarProceso"
              label="Registrar Nueva Admisión"
              color="secondary"
              class="q-mt-md q-ml-sm"
              icon="add_circle_outline"
            />
          </div>
        </q-step>
      </q-stepper>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Notify } from 'quasar'
import { api } from 'boot/axios'
import DatosAdmisionForm from 'src/components/DatosAdmisionForm.vue'
import FormularioSignosVitales from 'src/components/FormularioSignosVitales.vue'
import FormularioCuidados from 'src/components/FormularioCuidados.vue'

export default defineComponent({
  name: 'AdmisionPage',
  components: {
    DatosAdmisionForm,
    FormularioSignosVitales,
    FormularioCuidados,
  },
  setup() {
    const step = ref(1)
    const stepper = ref(null)
    const isSaving = ref(false)

    const admisionFormRef = ref(null)
    const signosVitalesFormRef = ref(null)

    // ✅ Variables para guardar los datos de cada paso
    const datosDeAdmision = ref(null)
    const datosDeSignosVitales = ref(null)
    const datosCuidados = ref([])
    const nuevaInternacionId = ref(null)

    // Función para el Paso 1 (sin cambios)
    function onDatosAdmisionListos(formData) {
      datosDeAdmision.value = formData
      stepper.value.next()
    }

    // ✅ Nueva función para validar y guardar los datos del Paso 2
    async function onSignosListos() {
      if (!signosVitalesFormRef.value) return
      const { datos, esValido } = await signosVitalesFormRef.value.validarYObtenerDatos()
      if (esValido) {
        datosDeSignosVitales.value = datos // Guardamos los datos
        stepper.value.next() // Avanzamos al siguiente paso
      } else {
        Notify.create({
          color: 'warning',
          message: 'Por favor, complete todos los campos requeridos de signos vitales.',
        })
      }
    }

    // ✅ Función para el Paso 3, que se actualiza en tiempo real
    function onCuidadosUpdate(cuidados) {
      datosCuidados.value = cuidados
    }

    // ✅ Función Finalizar, ahora mucho más simple y robusta
    async function finalizarAdmision() {
      // Validamos que tengamos los datos de los pasos anteriores
      if (!datosDeAdmision.value || !datosDeSignosVitales.value) {
        Notify.create({
          color: 'negative',
          message:
            'Faltan datos de pasos anteriores. Por favor, retroceda y complete la información.',
        })
        return
      }

      const payload = {
        admision: datosDeAdmision.value,
        signos_vitales: datosDeSignosVitales.value,
        cuidados: datosCuidados.value,
      }

      isSaving.value = true
      try {
        const response = await api.post('/admisiones', payload)
        nuevaInternacionId.value = response.data.data.id
        Notify.create({
          color: 'positive',
          message: response.data.message || 'Admisión registrada con éxito.',
        })
        step.value = 4 // Avanza al paso final
      } catch (error) {
        const msg = error.response?.data?.message || 'Ocurrió un error al guardar la admisión.'
        Notify.create({ color: 'negative', message: msg, icon: 'report_problem' })
      } finally {
        isSaving.value = false
      }
    }

    function reiniciarProceso() {
      datosDeAdmision.value = null
      datosDeSignosVitales.value = null
      datosCuidados.value = []
      nuevaInternacionId.value = null
      step.value = 1
      if (admisionFormRef.value) admisionFormRef.value.reset()
      // Faltaría un método reset en los otros forms si es necesario
    }

    return {
      step,
      stepper,
      isSaving,
      admisionFormRef,
      signosVitalesFormRef,
      // ya no se necesita la ref de cuidados
      nuevaInternacionId,
      onDatosAdmisionListos,
      onSignosListos, // nueva función
      onCuidadosUpdate, // nueva función
      finalizarAdmision,
      reiniciarProceso,
    }
  },
})
</script>

<style scoped>
.page-background {
  background-color: #f8fafc;
}
.styled-stepper {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.final-step-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  min-height: 400px;
}
</style>
