<template>
  <q-page class="page-background" padding>
    <!-- Eliminado page-container con max-width, ahora usa todo el ancho -->
    <!-- Header elegante - Ahora full width -->
    <div class="page-header">
      <div class="header-content">

        <div class="header-text">
          <h1 class="page-title">Nueva Admisión de Paciente</h1>
          <p class="page-subtitle">Complete los siguientes pasos para registrar la internación</p>
        </div>
      </div>
      <div class="progress-indicator">
        <span class="step-counter">Paso {{ step }} de 4</span>
        <q-linear-progress
          :value="step / 4"
          color="teal"
          size="8px"
          rounded
          class="progress-bar"
        />
      </div>
    </div>

    <!-- Stepper mejorado - Full width -->
    <q-stepper
      v-model="step"
      ref="stepper"
      color="teal"
      animated
      header-nav
      flat
      class="styled-stepper"
      keep-alive
      :vertical="$q.screen.lt.md"
    >
      <!-- Paso 1: Datos de Admisión -->
      <q-step
        :name="1"
        title="Datos de Admisión"
        icon="assignment_ind"
        :done="step > 1"
        active-icon="edit"
        done-icon="check"
        class="step-section"
      >
        <div class="step-content">
          <div class="step-header">
            <q-icon name="assignment_ind" size="32px" color="teal" />
            <div>
              <h3 class="step-title">Información de Admisión</h3>
              <p class="step-description">
                Seleccione el paciente y configure los detalles de la internación
              </p>
            </div>
          </div>
          <DatosAdmisionForm
            v-if="step === 1"
            ref="admisionFormRef"
            :datos-iniciales="datosDeAdmision"
            @datos-listos="onDatosAdmisionListos"
          />
        </div>
      </q-step>

      <!-- Paso 2: Datos Clínicos -->
      <q-step
        :name="2"
        title="Datos Clínicos"
        icon="monitor_heart"
        :done="step > 2"
        active-icon="edit"
        done-icon="check"
        class="step-section"
      >
        <div class="step-content">
          <div class="step-header">
            <q-icon name="monitor_heart" size="32px" color="red-6" />
            <div>
              <h3 class="step-title">Registro de Datos Clínicos</h3>
              <p class="step-description">
                Ingrese los valores antropométricos y signos vitales del paciente
              </p>
            </div>
          </div>
          <FormularioSignosVitales
            v-if="step === 2"
            ref="signosVitalesFormRef"
            :signos-iniciales="datosDeSignosVitales"
          />

          <q-stepper-navigation class="step-navigation">
            <q-btn
              flat
              @click="retrocederPaso(1)"
              color="grey-7"
              label="Atrás"
              icon="arrow_back"
              class="nav-btn nav-btn-back"
            />
            <q-btn
              @click="onSignosListos"
              color="teal"
              label="Continuar"
              icon-right="arrow_forward"
              unelevated
              class="nav-btn nav-btn-next"
            />
          </q-stepper-navigation>
        </div>
      </q-step>

      <!-- Paso 3: Plan de Cuidados -->
      <q-step
        :name="3"
        title="Plan de Cuidados"
        icon="health_and_safety"
        :done="step > 3"
        active-icon="edit"
        done-icon="check"
        class="step-section"
      >
        <div class="step-content">
          <div class="step-header">
            <q-icon name="health_and_safety" size="32px" color="blue-6" />
            <div>
              <h3 class="step-title">Plan de Cuidados Inicial</h3>
              <p class="step-description">
                Configure las tareas de enfermería que se realizarán de forma recurrente
                (Opcional)
              </p>
            </div>
          </div>

          <div class="optional-banner">
            <q-icon name="info" size="24px" />
            <div>
              <strong>Paso opcional:</strong> Puede agregar planes de cuidado ahora o
              configurarlos más tarde desde el panel del paciente.
            </div>
          </div>

          <FormularioCuidados
            v-if="step === 3"
            ref="cuidadosFormRef"
            :cuidados-iniciales="datosCuidados"
            @update:cuidados="onCuidadosUpdate"
          />

          <q-stepper-navigation class="step-navigation">
            <q-btn
              flat
              @click="retrocederPaso(2)"
              color="grey-7"
              label="Atrás"
              icon="arrow_back"
              class="nav-btn nav-btn-back"
            />
            <q-btn
              unelevated
              color="positive"
              label="Finalizar y Guardar Admisión"
              @click="finalizarAdmision"
              :loading="isSaving"
              icon-right="save"
              class="nav-btn nav-btn-finish"
            />
          </q-stepper-navigation>
        </div>
      </q-step>

      <!-- Paso 4: Completado -->
      <q-step :name="4" title="Completado" icon="check_circle" class="step-section">
        <div class="final-step-content">
          <div class="success-animation">
            <q-icon name="check_circle" color="positive" size="120px" class="success-icon" />
            <div class="success-ring"></div>
          </div>

          <h2 class="success-title">¡Admisión Completada Exitosamente!</h2>
          <p class="success-message">
            El paciente ha sido internado correctamente. Los datos iniciales han sido registrados
            en el sistema.
          </p>

          <div class="success-actions">
            <q-btn
              :to="`/pacientes/internacion/${nuevaInternacionId}`"
              unelevated
              label="Ver Panel del Paciente"
              color="primary"
              size="lg"
              v-if="nuevaInternacionId"
              icon="visibility"
              class="action-btn primary-action"
            />
            <q-btn
              flat
              @click="reiniciarProceso"
              label="Nueva Admisión"
              color="teal"
              size="lg"
              icon="add_circle_outline"
              class="action-btn secondary-action"
            />
          </div>

          <div class="success-info">
            <q-icon name="info_outline" size="20px" />
            <span
              >Puede continuar configurando tratamientos, alimentación y otros detalles desde el
              panel del paciente</span
            >
          </div>
        </div>
      </q-step>
    </q-stepper>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Notify, useQuasar } from 'quasar'
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
    const $q = useQuasar()
    const step = ref(1)
    const stepper = ref(null)
    const isSaving = ref(false)

    const admisionFormRef = ref(null)
    const signosVitalesFormRef = ref(null)
    const cuidadosFormRef = ref(null)

    const datosDeAdmision = ref(null)
    const datosDeSignosVitales = ref(null)
    const datosCuidados = ref([])
    const nuevaInternacionId = ref(null)

    function onDatosAdmisionListos(formData) {
      console.log('Datos de admisión recibidos:', formData)
      datosDeAdmision.value = JSON.parse(JSON.stringify(formData))
      step.value = 2
      Notify.create({
        type: 'positive',
        message: 'Datos de admisión guardados correctamente',
        icon: 'check_circle',
        position: 'top',
        timeout: 2000,
      })
    }

    async function onSignosListos() {
      if (!signosVitalesFormRef.value) {
        console.error('Ref de signos vitales no disponible')
        return
      }

      const { datos, esValido } = await signosVitalesFormRef.value.validarYObtenerDatos()

      if (esValido) {
        datosDeSignosVitales.value = JSON.parse(JSON.stringify(datos))
        step.value = 3
        Notify.create({
          type: 'positive',
          message: 'Signos vitales registrados correctamente',
          icon: 'monitor_heart',
          position: 'top',
          timeout: 2000,
        })
      } else {
        Notify.create({
          type: 'warning',
          message: 'Por favor, complete todos los campos requeridos de signos vitales',
          icon: 'warning',
          position: 'top',
          timeout: 3000,
        })
      }
    }

    function onCuidadosUpdate(cuidados) {
      datosCuidados.value = JSON.parse(JSON.stringify(cuidados))
    }

    async function retrocederPaso(pasoDestino) {
      if (step.value === 2 && signosVitalesFormRef.value) {
        const { datos } = await signosVitalesFormRef.value.validarYObtenerDatos()
        if (datos && datos.length > 0) {
          datosDeSignosVitales.value = JSON.parse(JSON.stringify(datos))
        }
      }
      step.value = pasoDestino
    }

    async function finalizarAdmision() {
      if (!datosDeAdmision.value) {
        Notify.create({
          type: 'negative',
          message: 'Faltan datos de admisión. Por favor, retroceda y complete el formulario.',
          icon: 'error',
          position: 'top',
          timeout: 4000,
        })
        step.value = 1
        return
      }

      if (!datosDeSignosVitales.value || datosDeSignosVitales.value.length === 0) {
        Notify.create({
          type: 'negative',
          message: 'Faltan signos vitales. Por favor, retroceda y complete el registro.',
          icon: 'error',
          position: 'top',
          timeout: 4000,
        })
        step.value = 2
        return
      }

      const signosVitalesFormateados = datosDeSignosVitales.value.map((signo) => {
        const signoFormateado = {
          signo_id: signo.signo_id,
          medida: String(signo.medida),
        }
        if (signo.medida_baja !== null && signo.medida_baja !== undefined && signo.medida_baja !== '') {
          signoFormateado.medida_baja = String(signo.medida_baja)
        }
        return signoFormateado
      })

      const payload = {
        admision: datosDeAdmision.value,
        signos_vitales: signosVitalesFormateados,
        cuidados: datosCuidados.value || [],
      }

      isSaving.value = true

      try {
        const response = await api.post('/admisiones', payload)
        nuevaInternacionId.value = response.data.data.id
        Notify.create({
          type: 'positive',
          message: response.data.message || 'Admisión registrada con éxito',
          icon: 'check_circle',
          position: 'top',
          timeout: 3000,
        })
        step.value = 4
      } catch (error) {
        const msg = error.response?.data?.message || 'Ocurrió un error al guardar la admisión'
        Notify.create({
          type: 'negative',
          message: msg,
          icon: 'report_problem',
          position: 'top',
          timeout: 4000,
        })
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
      Notify.create({
        type: 'info',
        message: 'Listo para una nueva admisión',
        icon: 'refresh',
        position: 'top',
        timeout: 2000,
      })
    }

    return {
      $q,
      step,
      stepper,
      isSaving,
      admisionFormRef,
      signosVitalesFormRef,
      cuidadosFormRef,
      datosDeAdmision,
      datosDeSignosVitales,
      datosCuidados,
      nuevaInternacionId,
      onDatosAdmisionListos,
      onSignosListos,
      onCuidadosUpdate,
      retrocederPaso,
      finalizarAdmision,
      reiniciarProceso,
    }
  },
})
</script>

<style scoped>
/* Eliminado max-width, ahora full responsive */
/* Eliminado max-width, ahora full responsive */
.page-background {
  background: #f8fafc;
  min-height: 100vh;
}

.page-header {
  background: transparent;
  border-radius: 0;
  padding: 0;
  margin-bottom: clamp(16px, 4vw, 32px);
  box-shadow: none;
  border: none;
}

.header-content {
  display: flex;
  align-items: center;
  gap: clamp(12px, 3vw, 20px);
  margin-bottom: clamp(16px, 4vw, 24px);
  flex-wrap: wrap;
}



.header-text {
  flex: 1;
  min-width: 200px;
}

.page-title {

  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
  line-height: 1.2;



}

.page-subtitle {


  font-size: clamp(0.9rem, 1.5vw, 1.1rem);
  color: #64748b;
  margin: 0;
  font-weight: 500;

}

.progress-indicator {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-counter {
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  font-weight: 600;
  color: #0d9488;
  text-align: center;
}

.progress-bar {
  transition: all 0.3s ease;
}

.styled-stepper {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
  overflow: hidden;
}

/* Step content ahora es full width */
.step-content {
  padding: clamp(16px, 4vw, 32px);
  min-height: 400px;
}

.step-header {
  display: flex;
  align-items: flex-start;
  gap: clamp(12px, 3vw, 16px);
  margin-bottom: clamp(20px, 4vw, 32px);
  padding-bottom: clamp(16px, 4vw, 24px);
  border-bottom: 2px solid #e2e8f0;
  flex-wrap: wrap;
}

.step-title {
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.step-description {
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  color: #64748b;
  margin: 0;
}

.optional-banner {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  padding: clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px);
  display: flex;
  align-items: flex-start;
  gap: clamp(12px, 3vw, 16px);
  margin-bottom: clamp(16px, 4vw, 24px);
  color: #92400e;
  flex-wrap: wrap;
}

.optional-banner strong {
  font-weight: 700;
}

/* Navegacion responsiva mejorada */
.step-navigation {
  display: flex;
  justify-content: space-between;
  padding-top: clamp(20px, 4vw, 32px);
  margin-top: clamp(20px, 4vw, 32px);
  border-top: 2px solid #e2e8f0;
  gap: 16px;
  flex-wrap: wrap;
}

.nav-btn {
  font-weight: 600;
  padding: clamp(10px, 2vw, 12px) clamp(20px, 4vw, 32px);
  font-size: clamp(0.875rem, 2vw, 1rem);
  transition: all 0.3s ease;
  flex: 1;
  min-width: 140px;
}

.nav-btn-back {
  border: 2px solid #e2e8f0;
  max-width: 200px;
}

.nav-btn-back:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.nav-btn-next {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}

.nav-btn-next:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(20, 184, 166, 0.4);
}

.nav-btn-finish {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
  flex: 2;
  max-width: none;
}

.nav-btn-finish:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
}

.final-step-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(32px, 6vw, 64px) clamp(16px, 4vw, 32px);
  min-height: 500px;
  text-align: center;
}

.success-animation {
  position: relative;
  margin-bottom: clamp(20px, 4vw, 32px);
}

.success-icon {
  animation: successPulse 2s ease-in-out infinite;
  position: relative;
  z-index: 2;
}

.success-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 3px solid #10b981;
  animation: ringExpand 2s ease-out infinite;
}

@keyframes successPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes ringExpand {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 0;
  }
}

.success-title {
  font-size: clamp(1.25rem, 4vw, 2rem);
  font-weight: 700;
  color: #059669;
  margin: 0 0 16px 0;
}

.success-message {
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  color: #64748b;
  max-width: 600px;
  line-height: 1.6;
  margin: 0 0 clamp(24px, 4vw, 40px) 0;
}

.success-actions {
  display: flex;
  gap: 16px;
  margin-bottom: clamp(20px, 4vw, 32px);
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 500px;
}

.action-btn {
  font-weight: 700;
  padding: clamp(12px, 2vw, 16px) clamp(24px, 4vw, 40px);
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  transition: all 0.3s ease;
  flex: 1;
  min-width: 180px;
}

.primary-action {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.primary-action:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.secondary-action {
  border: 2px solid #14b8a6;
  color: #14b8a6;
}

.secondary-action:hover {
  background: rgba(20, 184, 166, 0.1);
  transform: translateY(-2px);
}

.success-info {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
  padding: clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px);
  border-radius: 8px;
  max-width: 600px;
  color: #1e40af;
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  text-align: left;
}

/* Media queries mejoradas para full responsive */
@media (max-width: 1024px) {
  .step-content {
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .header-text {
    min-width: 100%;
  }

  .step-header {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }

  .step-navigation {
    flex-direction: column-reverse;
  }

  .nav-btn {
    width: 100%;
    max-width: none;
  }

  .nav-btn-back {
    max-width: none;
  }

  .success-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-btn {
    width: 100%;
    min-width: auto;
  }

  .optional-banner {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .success-info {
    flex-direction: column;
    text-align: center;
  }
}
</style>
