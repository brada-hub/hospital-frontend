<template>
  <div>
    <div class="q-mb-lg">
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
      <div v-else class="text-grey q-pa-sm">Datos antropométricos no disponibles al ingreso.</div>
    </div>

    <div class="q-mb-lg">
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
        color="info"
        label="Registrar Novedad"
        icon="add_box"
        class="q-ml-md"
        @click="abrirDialogoCrearCuidadoRapido(internacion)"
      />
    </div>

    <div class="text-subtitle1 text-weight-medium">Historial de Signos Vitales</div>
    <div v-if="!internacion.controls || !internacion.controls.length" class="text-grey q-pa-sm">
      Aún no se han registrado signos vitales.
    </div>
    <q-list v-else bordered separator dense class="q-mt-sm rounded-borders">
      <q-expansion-item
        v-for="control in internacion.controls"
        :key="control.id"
        :label="`Registro del ${formatDateTime(control.fecha_control)}`"
        :caption="`Por: ${control.user.nombre} ${control.user.apellidos}`"
        header-class="bg-grey-1"
      >
        <q-card>
          <q-card-section>
            <template v-for="valor in control.valores" :key="valor.id">
              <div v-if="valor.signo.es_rutinario" class="row q-mb-xs">
                <div class="col-6 text-grey-8">{{ valor.signo.nombre }}:</div>
                <div class="col-6 text-weight-bold">
                  {{ valor.medida }} {{ valor.signo.unidad }}
                </div>
              </div>
            </template>
            <div v-if="control.observaciones" class="q-mt-sm">
              <q-item-label caption>Observaciones:</q-item-label>
              <div class="text-grey-8">{{ control.observaciones }}</div>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>

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
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn
            unelevated
            label="Guardar Registro"
            color="primary"
            @click="handleGuardarSignosVitales"
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
import { format } from 'date-fns'
import FormularioSignosVitales from 'src/components/FormularioSignosVitales.vue'
import ListaTratamientos from 'src/components/ListaTratamientos.vue'
// ✅ CORRECCIÓN AQUÍ: Se eliminó un punto extra en 'PlanCuidados.vue'
import PlanCuidados from 'src/components/PlanCuidados.vue'
import EvolucionEnfermeria from 'src/components/EvolucionEnfermeria.vue'
import { useUserStore } from 'stores/user'

const { internacion } = defineProps({
  internacion: {
    type: Object,
    default: () => ({
      datos_antropometricos: null,
      controls: [],
      tratamientos: [],
      plan_de_cuidados: [],
      evolucion_enfermeria: [],
    }),
  },
})

const emit = defineEmits(['recargar-pacientes', 'reabrir-paciente'])

const dialogoSignosVisible = ref(false)
const internacionSeleccionada = ref(null)
const formSignosRef = ref(null)
const observacionesSignos = ref('')
const userStore = useUserStore()

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
    Notify.create({ color: 'warning', message: 'Por favor, complete todos los campos requeridos.' })
    return
  }
  const valoresAEnviar = datos.filter((d) => d.medida && d.medida.trim() !== '')
  if (valoresAEnviar.length === 0) {
    Notify.create({ color: 'warning', message: 'Debe registrar al menos un signo vital.' })
    return
  }

  try {
    await api.post('/controls', {
      internacion_id: internacionSeleccionada.value.id,
      observaciones: observacionesSignos.value,
      valores: valoresAEnviar,
    })
    Notify.create({ color: 'positive', message: 'Signos vitales registrados correctamente.' })
    dialogoSignosVisible.value = false
    emit('recargar-pacientes')
  } catch (error) {
    console.error('Error al guardar signos vitales:', error)
    Notify.create({ color: 'negative', message: 'Hubo un error al guardar el registro.' })
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

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A'
  try {
    const date = new Date(dateTimeString.replace(' ', 'T') + '.000Z')
    if (isNaN(date)) return 'N/A'
    return format(date, 'dd/MM/yyyy HH:mm')
  } catch {
    return 'N/A'
  }
}
</script>
