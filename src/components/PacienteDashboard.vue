<template>
  <div class="dashboard-paciente">
    <div class="datos-acciones-container">
      <div class="datos-ingreso-card">
        <div class="card-header">
          <q-icon name="straighten" size="24px" />
          <span>Datos de Ingreso</span>
        </div>
        <div v-if="internacion.datos_antropometricos" class="datos-grid">
          <div class="dato-item">
            <q-icon name="height" size="32px" class="dato-icon" />
            <div class="dato-label">Altura</div>
            <div class="dato-value">
              {{ internacion.datos_antropometricos.altura || 'N/A' }}
            </div>
          </div>
          <div class="dato-item">
            <q-icon name="monitor_weight" size="32px" class="dato-icon" />
            <div class="dato-label">Peso</div>
            <div class="dato-value">
              {{ internacion.datos_antropometricos.peso || 'N/A' }}
            </div>
          </div>
          <div class="dato-item">
            <q-icon name="calculate" size="32px" class="dato-icon" />
            <div class="dato-label">IMC</div>
            <div v-if="internacion.datos_antropometricos.imc" class="dato-value">
              {{ internacion.datos_antropometricos.imc }}
            </div>
            <div v-else class="dato-value">N/A</div>
          </div>
        </div>
        <div v-else class="no-datos">
          <q-icon name="info" size="24px" />
          <span>Datos antropométricos no disponibles</span>
        </div>
      </div>

      <div class="acciones-card">
        <div class="card-header">
          <q-icon name="medical_services" size="24px" />
          <span>Acciones de Enfermería</span>
        </div>
        <div class="acciones-buttons">
          <q-btn
            unelevated
            class="action-btn primary-btn"
            label="Registrar Signos Vitales"
            icon="monitor_heart"
            @click="abrirDialogoRegistrarSignos(internacion)"
          />
          <q-btn
            unelevated
            class="action-btn secondary-btn"
            label="Registrar Novedad"
            icon="add_box"
            @click="abrirDialogoCrearCuidadoRapido(internacion)"
          />
        </div>
      </div>
    </div>

    <q-separator class="section-separator" />

    <div v-if="!haySignosVitales" class="empty-state">
      <q-icon name="analytics" size="64px" />
      <p>Aún no se han registrado signos vitales para este paciente.</p>
    </div>

    <SignosVitalesDashboard v-else :controls="internacion.controles" :internacion="internacion" />

    <q-separator class="section-separator" />

    <ListaTratamientos
      :internacion="internacion"
      class="component-section"
      @recargar-pacientes="emit('recargar-pacientes')"
    />
    <PlanCuidados
      :plan="internacion.plan_de_cuidados"
      class="component-section"
      @recargar-pacientes="emit('recargar-pacientes')"
    />
    <EvolucionEnfermeria
      :evoluciones="internacion.evolucion_enfermeria"
      class="component-section"
    />

    <q-dialog v-model="dialogoSignosVisible">
      <q-card class="signos-dialog">
        <q-card-section class="dialog-header">
          <div class="dialog-title">
            <q-icon name="monitor_heart" size="28px" />
            <span>Registrar Signos Vitales</span>
          </div>
          <div v-if="internacionSeleccionada" class="dialog-subtitle">
            Paciente: {{ internacionSeleccionada.paciente.nombre }}
            {{ internacionSeleccionada.paciente.apellidos }}
          </div>
        </q-card-section>
        <q-card-section class="dialog-body">
          <FormularioSignosVitales ref="formSignosRef" tipo="rutinario" />
          <q-input
            v-model="observacionesSignos"
            type="textarea"
            label="Observaciones generales (opcional)"
            outlined
            class="q-mt-md observaciones-input"
            autogrow
          />
        </q-card-section>
        <q-card-actions class="dialog-actions">
          <q-btn flat label="Cancelar" class="cancel-btn" v-close-popup />
          <q-btn
            unelevated
            label="Guardar Registro"
            class="save-btn"
            @click="handleGuardarSignosVitales"
            :loading="isSavingSignos"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue'
import { api } from 'boot/axios'
import { Notify, Dialog } from 'quasar'
import FormularioSignosVitales from 'src/components/FormularioSignosVitales.vue'
import ListaTratamientos from 'src/components/ListaTratamientos.vue'
import PlanCuidados from 'src/components/PlanCuidados.vue'
import EvolucionEnfermeria from 'src/components/EvolucionEnfermeria.vue'
import { useUserStore } from 'stores/user'
import SignosVitalesDashboard from 'src/components/SignosVitalesDashboard.vue'

const props = defineProps({
  internacion: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['recargar-pacientes', 'reabrir-paciente'])

const dialogoSignosVisible = ref(false)
const internacionSeleccionada = ref(null)
const formSignosRef = ref(null)
const observacionesSignos = ref('')
const userStore = useUserStore()
const isSavingSignos = ref(false)

const haySignosVitales = computed(() => {
  if (!Array.isArray(props.internacion?.controles)) {
    return false
  }

  return props.internacion.controles.some(
    (c) => c && Array.isArray(c.valores) && c.valores.length > 0,
  )
})

function abrirDialogoRegistrarSignos(internacion) {
  internacionSeleccionada.value = internacion
  observacionesSignos.value = ''
  dialogoSignosVisible.value = true
  emit('reabrir-paciente', internacion.id)
}

async function handleGuardarSignosVitales() {
  if (!formSignosRef.value || !internacionSeleccionada.value) return

  const { datos, esValido } = await formSignosRef.value.validarYObtenerDatos()

  if (!esValido) {
    Notify.create({ color: 'warning', message: 'Debe registrar al menos un signo vital.' })
    return
  }

  isSavingSignos.value = true
  try {
    await api.post('/controls', {
      internacion_id: internacionSeleccionada.value.id,
      observaciones: observacionesSignos.value,
      valores: datos,
    })
    Notify.create({ color: 'positive', message: 'Signos vitales registrados correctamente.' })
    dialogoSignosVisible.value = false
    emit('recargar-pacientes')
  } catch (error) {
    console.error('Error al guardar signos vitales:', error)
    Notify.create({ color: 'negative', message: 'Hubo un error al guardar el registro.' })
  } finally {
    isSavingSignos.value = false
  }
}

function abrirDialogoCrearCuidadoRapido(internacion) {
  const idUsuario = userStore.user?.id
  if (!idUsuario) {
    Notify.create({ color: 'negative', message: 'Error de sesión. Usuario no identificado.' })
    return
  }

  emit('reabrir-paciente', internacion.id)

  Dialog.create({
    title: `Registrar Novedad / Cuidado a Demanda`,
    message:
      'Describe el evento o cuidado que acabas de realizar. Esto quedará en la bitácora de evolución.',
    prompt: {
      model: '',
      type: 'textarea',
      label: 'Descripción completa (Ej: Se administró paracetamol SOS por fiebre)',
      isValid: (val) =>
        (val.length > 0 && val.length <= 255) ||
        'La descripción es obligatoria (máx. 255 caracteres).',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (descripcionCompleta) => {
    try {
      await api.post('/cuidados-directo', {
        internacion_id: internacion.id,
        descripcion_completa: descripcionCompleta,
      })
      Notify.create({
        color: 'info',
        message: 'Novedad registrada y guardada en la evolución exitosamente.',
      })
      emit('recargar-pacientes')
    } catch (error) {
      console.error('Error al registrar cuidado directo:', error)
      Notify.create({
        color: 'negative',
        message: error.response?.data?.message || 'Error al crear el registro.',
      })
    }
  })
}
</script>

<style scoped>
.dashboard-paciente {
  padding: 20px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
  min-height: 100vh;
}

.component-section,
.datos-acciones-container,
.empty-state {
  margin-bottom: 40px;
}

.datos-acciones-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.datos-ingreso-card,
.acciones-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

.datos-ingreso-card:hover,
.acciones-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
}

.datos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 24px;
}

.dato-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.dato-item:hover {
  transform: scale(1.05);
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.dato-icon {
  color: #10b981;
}

.dato-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.dato-value {
  font-size: 20px;
  font-weight: 700;
  color: #059669;
}

.no-datos {
  padding: 32px;
  text-align: center;
  color: #9ca3af;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.acciones-buttons {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-btn {
  width: 100%;
  height: 56px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.primary-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
}

.secondary-btn {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
}

.secondary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(13, 148, 136, 0.3);
}

.section-separator {
  margin: 40px 0;
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  height: 2px;
  border: none;
}

.empty-state {
  text-align: center;
  padding: 64px 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  color: #9ca3af;
}

.empty-state p {
  margin-top: 16px;
  font-size: 16px;
}

.signos-dialog {
  border-radius: 16px;
  overflow: hidden;
  min-width: 600px;
}

.dialog-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 24px;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}

.dialog-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin-left: 40px;
}

.dialog-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-actions {
  background: #f9fafb;
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  color: #6b7280;
  font-weight: 600;
}

.save-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-weight: 600;
  padding: 0 24px;
  border-radius: 8px;
}

.save-btn:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

@media (max-width: 1024px) {
  .datos-acciones-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-paciente {
    padding: 16px;
  }
  .datos-grid {
    gap: 12px;
    padding: 16px;
  }
  .dato-item {
    padding: 12px;
  }
  .dato-value {
    font-size: 18px;
  }
  .acciones-buttons {
    padding: 16px;
  }
  .action-btn {
    height: 48px;
    font-size: 14px;
  }
  .signos-dialog {
    min-width: 90vw;
  }
}

@media (max-width: 480px) {
  .datos-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .dato-item {
    flex-direction: row;
    justify-content: space-between;
    padding: 16px;
  }
  .dato-icon {
    order: 1;
  }
  .dato-label {
    order: 2;
    flex: 1;
    text-align: left;
    margin-left: 12px;
  }
  .dato-value {
    order: 3;
  }
  .acciones-buttons {
    gap: 12px;
  }
  .action-btn {
    font-size: 13px;
  }
  .dialog-title {
    font-size: 18px;
  }
}

@media (max-width: 360px) {
  .card-header {
    font-size: 16px;
    padding: 16px;
  }
  .dato-value {
    font-size: 16px;
  }
  .action-btn {
    height: 44px;
    font-size: 12px;
  }
}
</style>
