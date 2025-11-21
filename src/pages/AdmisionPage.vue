<template>
  <q-page class="page-background">
    <div class="page-container">
      <!-- Header elegante -->
      <div class="page-header">
        <div class="header-content">
          <q-icon name="local_hospital" size="48px" class="header-icon" />
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

      <!-- Stepper mejorado -->
      <q-stepper
        v-model="step"
        ref="stepper"
        color="teal"
        animated
        header-nav
        flat
        class="styled-stepper"
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
            <DatosAdmisionForm ref="admisionFormRef" @datos-listos="onDatosAdmisionListos" />
          </div>
        </q-step>

        <!-- Paso 2: Signos Vitales -->
        <q-step
          :name="2"
          title="Signos Vitales"
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
                <h3 class="step-title">Registro de Signos Vitales Iniciales</h3>
                <p class="step-description">
                  Ingrese los valores actuales del paciente al momento de la admisión
                </p>
              </div>
            </div>
            <FormularioSignosVitales ref="signosVitalesFormRef" />

            <q-stepper-navigation class="step-navigation">
              <q-btn
                flat
                @click="step = 1"
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

            <FormularioCuidados @update:cuidados="onCuidadosUpdate" />

            <q-stepper-navigation class="step-navigation">
              <q-btn
                flat
                @click="step = 2"
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

    const datosDeAdmision = ref(null)
    const datosDeSignosVitales = ref(null)
    const datosCuidados = ref([])
    const nuevaInternacionId = ref(null)

    function onDatosAdmisionListos(formData) {
      datosDeAdmision.value = formData
      stepper.value.next()

      // Notificación elegante
      Notify.create({
        type: 'positive',
        message: 'Datos de admisión guardados correctamente',
        icon: 'check_circle',
        position: 'top',
        timeout: 2000,
      })
    }

    async function onSignosListos() {
      if (!signosVitalesFormRef.value) return

      const { datos, esValido } = await signosVitalesFormRef.value.validarYObtenerDatos()

      if (esValido) {
        datosDeSignosVitales.value = datos
        stepper.value.next()

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
      datosCuidados.value = cuidados
    }

    async function finalizarAdmision() {
      if (!datosDeAdmision.value || !datosDeSignosVitales.value) {
        Notify.create({
          type: 'negative',
          message:
            'Faltan datos de pasos anteriores. Por favor, retroceda y complete la información.',
          icon: 'error',
          position: 'top',
          timeout: 4000,
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

      if (admisionFormRef.value) admisionFormRef.value.reset()

      Notify.create({
        type: 'info',
        message: 'Listo para una nueva admisión',
        icon: 'refresh',
        position: 'top',
        timeout: 2000,
      })
    }

    return {
      step,
      stepper,
      isSaving,
      admisionFormRef,
      signosVitalesFormRef,
      nuevaInternacionId,
      onDatosAdmisionListos,
      onSignosListos,
      onCuidadosUpdate,
      finalizarAdmision,
      reiniciarProceso,
    }
  },
})
</script>

<style scoped>
.page-background {
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
  min-height: 100vh;
  padding: 24px;
}

.page-container {
  max-width: 1100px;
  margin: 0 auto;
}

/* Header elegante */
.page-header {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.header-icon {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}

.header-text {
  flex: 1;
}

.page-title {
  background: linear-gradient(135deg, #0f3027 0%, #082f49 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 900;
  font-size: 2rem;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.page-subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

.progress-indicator {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-counter {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0d9488;
  text-align: center;
}

.progress-bar {
  transition: all 0.3s ease;
}

/* Stepper estilizado */
.styled-stepper {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
  overflow: hidden;
}

.styled-stepper :deep(.q-stepper__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 2px solid #e2e8f0;
  padding: 16px;
}

.styled-stepper :deep(.q-stepper__tab) {
  padding: 16px 24px;
  transition: all 0.3s ease;
  border-radius: 12px;
  margin: 0 8px;
}

.styled-stepper :deep(.q-stepper__tab:hover) {
  background: rgba(20, 184, 166, 0.1);
}

.styled-stepper :deep(.q-stepper__tab--active) {
  background: linear-gradient(135deg, #ccfbf1 0%, #a7f3d0 100%);
}

.styled-stepper :deep(.q-stepper__tab--done) {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.styled-stepper :deep(.q-stepper__dot) {
  width: 40px;
  height: 40px;
  font-size: 20px;
}

.styled-stepper :deep(.q-stepper__label) {
  font-weight: 600;
  font-size: 0.95rem;
}

/* Contenido de cada paso */
.step-content {
  padding: 32px;
  min-height: 400px;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #e2e8f0;
}

.step-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.step-description {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
}

/* Banner informativo */
.optional-banner {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  color: #92400e;
}

.optional-banner strong {
  font-weight: 700;
}

/* Navegación de pasos */
.step-navigation {
  display: flex;
  justify-content: space-between;
  padding-top: 32px;
  margin-top: 32px;
  border-top: 2px solid #e2e8f0;
  gap: 16px;
}

.nav-btn {
  font-weight: 600;
  padding: 12px 32px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.nav-btn-back {
  border: 2px solid #e2e8f0;
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
  flex: 1;
  max-width: 400px;
}

.nav-btn-finish:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
}

/* Paso final - Completado */
.final-step-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  min-height: 500px;
  text-align: center;
}

.success-animation {
  position: relative;
  margin-bottom: 32px;
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
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
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
  font-size: 2rem;
  font-weight: 700;
  color: #059669;
  margin: 0 0 16px 0;
}

.success-message {
  font-size: 1.1rem;
  color: #64748b;
  max-width: 600px;
  line-height: 1.6;
  margin: 0 0 40px 0;
}

.success-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  font-weight: 700;
  padding: 16px 40px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
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
  padding: 16px 24px;
  border-radius: 8px;
  max-width: 600px;
  color: #1e40af;
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 768px) {
  .page-background {
    padding: 16px;
  }

  .page-header {
    padding: 24px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .step-content {
    padding: 24px 16px;
  }

  .step-header {
    flex-direction: column;
    text-align: center;
  }

  .step-navigation {
    flex-direction: column;
  }

  .nav-btn {
    width: 100%;
  }

  .success-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-btn {
    width: 100%;
  }

  .styled-stepper :deep(.q-stepper__header) {
    flex-wrap: wrap;
  }

  .styled-stepper :deep(.q-stepper__tab) {
    flex: 1 1 100%;
    margin: 4px 0;
  }
}
</style>
