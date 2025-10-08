<template>
  <div>
    <div class="row q-col-gutter-xl q-mb-lg">
      <div class="col-12 col-md-4">
        <div class="text-subtitle1 text-weight-medium">Datos de Ingreso</div>
        <div
          v-if="internacion.datos_antropometricos"
          class="row q-col-gutter-md q-mt-xs text-center bg-grey-1 q-pa-sm rounded-borders"
        >
          <div class="col-4">
            <div class="text-caption text-grey-7">Altura</div>
            <div class="text-body1 text-weight-bold">
              {{ internacion.datos_antropometricos.altura || 'N/A' }}
            </div>
          </div>
          <div class="col-4">
            <div class="text-caption text-grey-7">Peso</div>
            <div class="text-body1 text-weight-bold">
              {{ internacion.datos_antropometricos.peso || 'N/A' }}
            </div>
          </div>
          <div class="col-4">
            <div class="text-caption text-grey-7">IMC</div>
            <div v-if="internacion.datos_antropometricos.imc" class="text-body1 text-weight-bold">
              {{ internacion.datos_antropometricos.imc }}
            </div>
            <div v-else class="text-body1 text-weight-bold">N/A</div>
          </div>
        </div>
        <div v-else class="text-grey q-pa-sm">Datos antropométricos no disponibles.</div>
      </div>
      <div class="col-12 col-md-8">
        <div class="text-subtitle1 text-weight-medium q-mb-sm">Acciones de Enfermería</div>
        <q-btn
          unelevated
          color="primary"
          label="Registrar Signos Vitales"
          icon="monitor_heart"
          @click="abrirDialogoRegistrarSignos(internacion)"
        />
        <q-btn
          unelevated
          color="secondary"
          label="Registrar Novedad"
          icon="add_box"
          class="q-ml-md"
          @click="abrirDialogoCrearCuidadoRapido(internacion)"
        />
      </div>
    </div>

    <q-separator class="q-my-lg" />

    <div class="text-h6 text-weight-medium">Monitor de Signos Vitales</div>
    <div
      v-if="!internacion.controls || !internacion.controls.length"
      class="text-center text-grey-7 q-pa-xl"
    >
      <q-icon name="analytics" size="xl" />
      <p class="q-mt-md">Aún no se han registrado signos vitales para este paciente.</p>
    </div>
    <SignosVitalesDashboard v-else :controls="internacion.controls" class="q-mt-md" />

    <q-separator class="q-my-lg" />

    <ListaTratamientos
      :internacion="internacion"
      @recargar-pacientes="emit('recargar-pacientes')"
    />
    <PlanCuidados
      :plan="internacion.plan_de_cuidados"
      @recargar-pacientes="emit('recargar-pacientes')"
    />
    <EvolucionEnfermeria :evoluciones="internacion.evolucion_enfermeria" />

    <q-dialog v-model="dialogoSignosVisible">
      <q-card style="width: 700px; max-width: 80vw">
        <q-card-section>
          <div class="text-h6">Registrar Signos Vitales</div>
          <div v-if="internacionSeleccionada" class="text-subtitle2 text-grey">
            Paciente: {{ internacionSeleccionada.paciente.nombre }}
            {{ internacionSeleccionada.paciente.apellidos }}
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <FormularioSignosVitales ref="formSignosRef" tipo="rutinario" />
          <q-input
            v-model="observacionesSignos"
            type="textarea"
            label="Observaciones generales (opcional)"
            outlined
            class="q-mt-md"
            autogrow
          />
        </q-card-section>
        <q-card-actions align="right" class="bg-grey-2 q-pa-md">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn
            unelevated
            label="Guardar Registro"
            color="primary"
            @click="handleGuardarSignosVitales"
            :loading="isSavingSignos"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { api } from 'boot/axios'
import { Notify, Dialog } from 'quasar'
import FormularioSignosVitales from 'src/components/FormularioSignosVitales.vue'
import ListaTratamientos from 'src/components/ListaTratamientos.vue'
import PlanCuidados from 'src/components/PlanCuidados.vue'
import EvolucionEnfermeria from 'src/components/EvolucionEnfermeria.vue'
import { useUserStore } from 'stores/user'
import SignosVitalesDashboard from 'src/components/SignosVitalesDashboard.vue'

defineProps({
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
