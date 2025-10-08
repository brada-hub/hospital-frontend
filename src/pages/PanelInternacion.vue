<template>
  <q-page padding>
    <div v-if="isLoading" class="text-center q-pa-xl">
      <q-spinner-cube color="primary" size="xl" />
      <div class="q-mt-md text-h6">Cargando datos clínicos...</div>
    </div>

    <div v-else-if="error" class="text-center q-pa-xl">
      <q-icon name="error" color="negative" size="xl" />
      <div class="q-mt-md text-h6 text-negative">Error al cargar los datos</div>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="dashboardData">
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h5">
              {{ dashboardData.paciente.nombre }} {{ dashboardData.paciente.apellidos }}
            </div>
            <div class="text-subtitle1 text-grey-8">
              C.I: {{ dashboardData.paciente.ci }} | Edad:
              {{ calcularEdad(dashboardData.paciente.fecha_nacimiento) }} años
            </div>
            <q-badge
              v-if="!dashboardData.fecha_alta"
              color="positive"
              text-color="white"
              label="Internado"
              icon="maps_home_work"
              class="q-mt-sm"
            />
            <q-badge
              v-else
              color="grey"
              text-color="white"
              :label="`De Alta - ${formatDateTime(dashboardData.fecha_alta)}`"
              icon="check_circle"
              class="q-mt-sm"
            />
          </div>
          <div v-if="!dashboardData.fecha_alta">
            <q-btn
              v-if="!hayTratamientoActivo"
              color="primary"
              icon="add"
              label="Nuevo Tratamiento"
              @click="abrirDialogoTratamiento"
              class="q-mr-sm"
            />
            <q-btn
              color="teal"
              icon="restaurant_menu"
              label="Prescribir Dieta"
              @click="abrirDialogoAlimentacion"
              class="q-mr-sm"
              :disable="hayAlimentacionActiva"
            >
              <q-tooltip v-if="hayAlimentacionActiva" class="bg-grey-8" :offset="[0, 5]">
                Suspenda la dieta activa para agregar una nueva.
              </q-tooltip>
            </q-btn>
            <q-btn
              color="negative"
              icon="medical_services"
              label="Dar de Alta"
              @click="darDeAlta"
            />
          </div>
        </q-card-section>
      </q-card>

      <div class="text-h6 q-my-md">Tratamientos</div>
      <div
        v-if="!dashboardData.tratamientos || !dashboardData.tratamientos.length"
        class="text-center text-grey-7 q-pa-lg"
      >
        <q-icon name="medication" size="lg" />
        <p>No hay tratamientos prescritos.</p>
      </div>
      <q-card
        v-for="tratamiento in dashboardData.tratamientos"
        :key="tratamiento.id"
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section class="bg-grey-2 row items-center justify-between">
          <div class="text-subtitle1 text-weight-bold">{{ tratamiento.tipo }}</div>
          <div>
            <q-badge
              :color="getColorPorEstado(tratamiento.estado)"
              :label="traducirEstado(tratamiento.estado)"
              class="text-capitalize"
            />
            <q-btn flat round icon="more_vert" v-if="!dashboardData.fecha_alta">
              <q-menu
                ><q-list>
                  <q-item
                    clickable
                    v-ripple
                    @click="abrirDialogoEditar(tratamiento)"
                    :disable="tratamiento.estado !== 0"
                    ><q-item-section avatar><q-icon name="edit" /></q-item-section
                    ><q-item-section>Modificar</q-item-section></q-item
                  >
                  <q-item
                    clickable
                    v-ripple
                    @click="suspenderTratamiento(tratamiento.id)"
                    :disable="tratamiento.estado !== 0"
                    ><q-item-section avatar
                      ><q-icon name="pause_circle" color="orange" /></q-item-section
                    ><q-item-section>Suspender</q-item-section></q-item
                  >
                </q-list></q-menu
              >
            </q-btn>
          </div>
        </q-card-section>
        <q-card-section>
          <p><strong>Descripción:</strong> {{ tratamiento.descripcion }}</p>
          <p v-if="tratamiento.medico">
            <strong>Prescrito por:</strong> Dr. {{ tratamiento.medico.nombre }}
            {{ tratamiento.medico.apellidos }}
          </p>
          <q-list bordered separator v-if="tratamiento.recetas && tratamiento.recetas.length > 0">
            <q-item-label header>Medicamentos</q-item-label>
            <q-item v-for="receta in tratamiento.recetas" :key="receta.id">
              <q-item-section>
                <q-item-label class="text-weight-medium">{{
                  receta.medicamento.nombre
                }}</q-item-label>
                <q-item-label caption
                  >{{ receta.dosis }} - {{ receta.via_administracion }} - Cada
                  {{ receta.frecuencia_horas }} horas por
                  {{ receta.duracion_dias }} días.</q-item-label
                >
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <div class="text-h6 q-my-md">Planes de Alimentación</div>
      <div
        v-if="!dashboardData.alimentaciones || !dashboardData.alimentaciones.length"
        class="text-center text-grey-7 q-pa-lg"
      >
        <q-icon name="fastfood" size="lg" />
        <p>No hay planes de alimentación prescritos.</p>
      </div>
      <q-card
        v-for="alimentacion in dashboardData.alimentaciones"
        :key="alimentacion.id"
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section
          :class="alimentacion.estado === 0 ? 'bg-teal-1' : 'bg-grey-3'"
          class="row items-center justify-between"
        >
          <div class="text-subtitle1 text-weight-bold text-teal-8">
            {{ alimentacion.tipo_dieta.nombre }}
          </div>
          <div>
            <q-badge
              :color="getColorPorEstadoAlimentacion(alimentacion.estado)"
              :label="traducirEstadoAlimentacion(alimentacion.estado)"
              class="text-capitalize"
            />
            <q-btn flat round icon="more_vert" v-if="!dashboardData.fecha_alta">
              <q-menu
                ><q-list>
                  <q-item
                    clickable
                    v-ripple
                    @click="abrirDialogoEditarAlimentacion(alimentacion)"
                    :disable="alimentacion.estado !== 0"
                    ><q-item-section avatar><q-icon name="edit" /></q-item-section
                    ><q-item-section>Modificar</q-item-section></q-item
                  >
                  <q-item
                    clickable
                    v-ripple
                    @click="suspenderAlimentacion(alimentacion.id)"
                    :disable="alimentacion.estado !== 0"
                    ><q-item-section avatar
                      ><q-icon name="pause_circle" color="orange" /></q-item-section
                    ><q-item-section>Suspender</q-item-section></q-item
                  >
                </q-list></q-menu
              >
            </q-btn>
          </div>
        </q-card-section>
        <q-card-section>
          <p v-if="alimentacion.estado === 1" class="text-orange-8" style="white-space: pre-wrap">
            <strong>Motivo de Suspensión:</strong> {{ alimentacion.motivo_suspension }}
          </p>
          <p><strong>Descripción:</strong> {{ alimentacion.descripcion }}</p>
          <p><strong>Frecuencia:</strong> {{ alimentacion.frecuencia }}</p>
          <p>
            <strong>Periodo:</strong> Del {{ formatDateTime(alimentacion.fecha_inicio) }} al
            {{ formatDateTime(alimentacion.fecha_fin) }}
          </p>
        </q-card-section>
      </q-card>

      <q-separator class="q-my-lg" />
      <div class="text-h6 q-my-md">Monitor de Signos Vitales y Evolución</div>
      <div class="q-mb-md" v-if="!dashboardData.fecha_alta">
        <q-btn
          color="secondary"
          icon="note_add"
          label="Añadir Nota de Evolución"
          @click="abrirDialogoEvolucion"
          unelevated
        />
      </div>

      <div
        v-if="!dashboardData.controls || !dashboardData.controls.length"
        class="text-center text-grey-7 q-pa-xl"
      >
        <q-icon name="analytics" size="xl" />
        <p class="q-mt-md">No hay notas de evolución o controles de signos vitales registrados.</p>
      </div>

      <SignosVitalesDashboard
        v-if="controlesConValores.length > 0"
        :controls="controlesConValores"
      />

      <div class="q-mt-xl" v-if="notasDeEvolucion.length > 0">
        <div class="text-subtitle1 text-weight-medium">Notas de Evolución Médica</div>
        <q-card v-for="control in notasDeEvolucion" :key="control.id" flat bordered class="q-mb-md">
          <q-card-section class="bg-grey-2 row items-center justify-between">
            <div class="text-weight-bold">{{ formatDateTime(control.fecha_control) }}</div>
            <div class="text-grey-8" v-if="control.user">
              Por: {{ control.user.nombre }} {{ control.user.apellidos }}
            </div>
          </q-card-section>
          <q-card-section style="white-space: pre-wrap">{{ control.observaciones }}</q-card-section>
        </q-card>
      </div>

      <q-dialog v-model="mostrarDialogoTratamiento" persistent>
        <q-card style="width: 800px; max-width: 90vw">
          <FormularioPrescripcion
            ref="formularioPrescripcionRef"
            :tratamiento-para-editar="tratamientoSeleccionado"
            :internacion-id="internacionId"
            :catalogo-medicamentos="catalogoMedicamentos"
          />
          <q-card-actions align="right" class="q-pa-md bg-grey-2">
            <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
            <q-btn
              :label="tratamientoSeleccionado ? 'Guardar Cambios' : 'Prescribir'"
              color="primary"
              @click="guardarTratamiento"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="mostrarDialogoAlimentacion" persistent>
        <q-card style="width: 700px; max-width: 90vw">
          <FormularioAlimentacion
            ref="formularioAlimentacionRef"
            :internacion-id="internacionId"
            :alimentacion-para-editar="alimentacionSeleccionada"
            :catalogo-tipos-dieta="catalogoTiposDieta"
          />
          <q-card-actions align="right" class="q-pa-md bg-grey-2">
            <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
            <q-btn
              :label="alimentacionSeleccionada ? 'Guardar Cambios' : 'Prescribir Dieta'"
              color="primary"
              @click="guardarAlimentacion"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="mostrarDialogoEvolucion" persistent>
        <q-card style="min-width: 500px; border-radius: 12px">
          <q-card-section class="row items-center bg-primary text-white">
            <div class="text-h6">Nueva Nota de Evolución</div>
            <q-space /><q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          <q-form @submit.prevent="guardarEvolucion" ref="evolucionFormRef">
            <q-card-section class="q-pt-md">
              <q-input
                v-model="nuevaObservacion"
                type="textarea"
                label="Escriba aquí la evolución del paciente..."
                outlined
                autofocus
                rows="5"
                :rules="[(val) => !!val || 'La observación no puede estar vacía']"
              />
            </q-card-section>
            <q-card-actions align="right" class="q-pa-md bg-grey-2">
              <q-btn label="Cancelar" color="grey" v-close-popup flat />
              <q-btn
                label="Guardar Nota"
                color="primary"
                type="submit"
                :loading="guardandoEvolucion"
                unelevated
              />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Loading, Notify, Dialog } from 'quasar'
import { format, differenceInYears } from 'date-fns'
import { api } from 'boot/axios'
import FormularioPrescripcion from 'src/components/FormularioPrescripcion.vue'
import FormularioAlimentacion from 'src/components/FormularioAlimentacion.vue'
import SignosVitalesDashboard from 'src/components/SignosVitalesDashboard.vue'

export default defineComponent({
  name: 'PanelInternacion',
  components: { FormularioPrescripcion, FormularioAlimentacion, SignosVitalesDashboard },
  setup() {
    const route = useRoute()
    const internacionId = route.params.id

    // --- ESTADOS REACTIVOS ---
    const isLoading = ref(true)
    const error = ref(null)
    const dashboardData = ref(null)
    const catalogoMedicamentos = ref([])
    const mostrarDialogoTratamiento = ref(false)
    const tratamientoSeleccionado = ref(null)
    const formularioPrescripcionRef = ref(null)
    const mostrarDialogoEvolucion = ref(false)
    const nuevaObservacion = ref('')
    const guardandoEvolucion = ref(false)
    const evolucionFormRef = ref(null)
    const catalogoTiposDieta = ref([])
    const mostrarDialogoAlimentacion = ref(false)
    const alimentacionSeleccionada = ref(null)
    const formularioAlimentacionRef = ref(null)

    // ✅ --- CORRECCIÓN DEFINITIVA --- ✅
    // Se blindan las computadas para que no fallen si los datos vienen incompletos.
    const controlesConValores = computed(() => {
      if (!dashboardData.value || !Array.isArray(dashboardData.value.controls)) {
        return []
      }
      return dashboardData.value.controls.filter(
        (c) => c && Array.isArray(c.valores) && c.valores.length > 0,
      )
    })

    const notasDeEvolucion = computed(() => {
      if (!dashboardData.value || !Array.isArray(dashboardData.value.controls)) {
        return []
      }
      return dashboardData.value.controls.filter(
        (c) => c && (!Array.isArray(c.valores) || c.valores.length === 0),
      )
    })

    const hayTratamientoActivo = computed(() => {
      if (!dashboardData.value?.tratamientos) return false
      return dashboardData.value.tratamientos.some((t) => t.estado === 0)
    })

    const hayAlimentacionActiva = computed(() => {
      if (!dashboardData.value?.alimentaciones) return false
      return dashboardData.value.alimentaciones.some((a) => a.estado === 0)
    })

    async function fetchData() {
      isLoading.value = true
      error.value = null
      try {
        const [dashboardResponse, medicamentosResponse, tiposDietaResponse] = await Promise.all([
          api.get(`/internaciones/${internacionId}/vista-completa`),
          api.get('/medicamentos'),
          api.get('/tipos-dieta'),
        ])
        dashboardData.value = dashboardResponse.data
        catalogoMedicamentos.value = medicamentosResponse.data
        catalogoTiposDieta.value = tiposDietaResponse.data
      } catch (err) {
        error.value = err.response?.data?.message || 'No se pudo conectar con el servidor.'
        Notify.create({ type: 'negative', message: error.value })
      } finally {
        isLoading.value = false
      }
    }

    onMounted(fetchData)

    // --- FUNCIONES DE AYUDA ---
    function calcularEdad(fechaNacimiento) {
      if (!fechaNacimiento) return 'N/A'
      return differenceInYears(new Date(), new Date(fechaNacimiento))
    }

    function formatDateTime(dateTimeString) {
      if (!dateTimeString) return 'N/A'
      return format(new Date(dateTimeString), 'dd/MM/yyyy HH:mm')
    }

    function traducirEstado(estadoNum) {
      const estados = { 0: 'Activo', 1: 'Suspendido', 2: 'Finalizado', 3: 'Cancelado' }
      return estados[estadoNum] || 'Desconocido'
    }

    function getColorPorEstado(estadoNum) {
      const colores = { 0: 'green', 1: 'orange', 2: 'grey', 3: 'red' }
      return colores[estadoNum] || 'primary'
    }

    function traducirEstadoAlimentacion(estadoNum) {
      const estados = { 0: 'Activo', 1: 'Suspendido', 2: 'Finalizado' }
      return estados[estadoNum] ?? 'Desconocido'
    }

    function getColorPorEstadoAlimentacion(estadoNum) {
      const colores = { 0: 'green', 1: 'orange', 2: 'grey' }
      return colores[estadoNum] ?? 'primary'
    }

    // --- FUNCIONES DE ACCIÓN ---
    function abrirDialogoTratamiento() {
      tratamientoSeleccionado.value = null
      mostrarDialogoTratamiento.value = true
    }

    function abrirDialogoEditar(tratamiento) {
      tratamientoSeleccionado.value = JSON.parse(JSON.stringify(tratamiento))
      mostrarDialogoTratamiento.value = true
    }

    async function guardarTratamiento() {
      if (!formularioPrescripcionRef.value) return
      const { datos, esValido } = await formularioPrescripcionRef.value.validarYObtenerDatos()
      if (!esValido) {
        Notify.create({
          color: 'warning',
          message: 'Por favor, complete todos los campos requeridos.',
        })
        return
      }
      Loading.show({ message: 'Guardando...' })
      try {
        if (tratamientoSeleccionado.value) {
          await api.post(`/tratamientos/${tratamientoSeleccionado.value.id}`, datos)
        } else {
          await api.post('/tratamientos', datos)
        }
        Notify.create({ color: 'positive', message: 'Tratamiento guardado con éxito.' })
        mostrarDialogoTratamiento.value = false
        await fetchData()
      } catch (err) {
        const message = err.response?.data?.message || 'Ocurrió un error al guardar.'
        Notify.create({ color: 'negative', message })
      } finally {
        Loading.hide()
      }
    }

    async function suspenderTratamiento(tratamientoId) {
      Dialog.create({
        title: 'Suspender Tratamiento',
        message: 'Ingrese el motivo de la suspensión:',
        prompt: {
          model: '',
          type: 'textarea',
          isValid: (val) => val.length >= 10 || 'El motivo debe tener al menos 10 caracteres.',
        },
        cancel: true,
        persistent: true,
      }).onOk(async (motivo) => {
        Loading.show({ message: 'Suspendiendo...' })
        try {
          await api.post(`/tratamientos/${tratamientoId}/suspender`, { motivo })
          Notify.create({ color: 'positive', message: 'Tratamiento suspendido con éxito.' })
          await fetchData()
        } catch (err) {
          const errorMessage = err.response?.data?.message || 'Error al suspender el tratamiento.'
          Notify.create({ color: 'negative', message: errorMessage })
        } finally {
          Loading.hide()
        }
      })
    }

    function abrirDialogoAlimentacion() {
      alimentacionSeleccionada.value = null
      mostrarDialogoAlimentacion.value = true
    }

    function abrirDialogoEditarAlimentacion(alimentacion) {
      alimentacionSeleccionada.value = JSON.parse(JSON.stringify(alimentacion))
      mostrarDialogoAlimentacion.value = true
    }

    async function guardarAlimentacion() {
      if (!formularioAlimentacionRef.value) return
      const { datos, esValido } = await formularioAlimentacionRef.value.validarYObtenerDatos()
      if (!esValido) {
        Notify.create({
          color: 'warning',
          message: 'Por favor, complete todos los campos requeridos.',
        })
        return
      }
      Loading.show({ message: 'Guardando plan...' })
      try {
        if (alimentacionSeleccionada.value) {
          await api.put(`/alimentaciones/${alimentacionSeleccionada.value.id}`, datos)
        } else {
          await api.post('/alimentaciones', datos)
        }
        Notify.create({ color: 'positive', message: 'Plan de alimentación guardado con éxito.' })
        mostrarDialogoAlimentacion.value = false
        await fetchData()
      } catch (err) {
        const message = err.response?.data?.message || 'Ocurrió un error al guardar.'
        Notify.create({ color: 'negative', message })
      } finally {
        Loading.hide()
      }
    }

    async function suspenderAlimentacion(alimentacionId) {
      Dialog.create({
        title: 'Suspender Plan de Alimentación',
        message: 'Ingrese el motivo de la suspensión:',
        prompt: {
          model: '',
          type: 'textarea',
          isValid: (val) => val.length >= 10 || 'El motivo debe tener al menos 10 caracteres.',
        },
        cancel: true,
        persistent: true,
      }).onOk(async (motivo) => {
        Loading.show({ message: 'Suspendiendo...' })
        try {
          await api.post(`/alimentaciones/${alimentacionId}/suspender`, { motivo })
          Notify.create({ color: 'positive', message: 'Plan de alimentación suspendido.' })
          await fetchData()
        } catch (err) {
          const errorMessage = err.response?.data?.message || 'Error al suspender.'
          Notify.create({ color: 'negative', message: errorMessage })
        } finally {
          Loading.hide()
        }
      })
    }

    async function darDeAlta() {
      Dialog.create({
        title: 'Confirmar Alta Médica',
        message: '¿Está seguro de que desea dar de alta a este paciente?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        Loading.show({ message: 'Procesando alta...' })
        try {
          await api.post(`/internaciones/${internacionId}/dar-de-alta`)
          Notify.create({ color: 'positive', message: 'Paciente dado de alta con éxito.' })
          await fetchData()
        } catch (err) {
          const errorMessage = err.response?.data?.message || 'Error al procesar el alta.'
          Notify.create({ color: 'negative', message: errorMessage })
        } finally {
          Loading.hide()
        }
      })
    }

    function abrirDialogoEvolucion() {
      nuevaObservacion.value = ''
      mostrarDialogoEvolucion.value = true
    }

    async function guardarEvolucion() {
      const esValido = await evolucionFormRef.value.validate()
      if (!esValido) return
      guardandoEvolucion.value = true
      try {
        const payload = {
          internacion_id: internacionId,
          observaciones: nuevaObservacion.value,
          tipo: 'Evolución Médica',
        }
        await api.post('/controls', payload)
        Notify.create({ color: 'positive', message: 'Nota de evolución guardada.' })
        mostrarDialogoEvolucion.value = false
        await fetchData()
      } catch (err) {
        const message = err.response?.data?.message || 'Error al guardar la nota.'
        Notify.create({ color: 'negative', message })
      } finally {
        guardandoEvolucion.value = false
      }
    }

    return {
      isLoading,
      error,
      dashboardData,
      catalogoMedicamentos,
      mostrarDialogoTratamiento,
      tratamientoSeleccionado,
      formularioPrescripcionRef,
      internacionId,
      hayTratamientoActivo,
      mostrarDialogoEvolucion,
      nuevaObservacion,
      guardandoEvolucion,
      evolucionFormRef,
      calcularEdad,
      formatDateTime,
      traducirEstado,
      getColorPorEstado,
      abrirDialogoTratamiento,
      abrirDialogoEditar,
      guardarTratamiento,
      suspenderTratamiento,
      darDeAlta,
      abrirDialogoEvolucion,
      guardarEvolucion,
      catalogoTiposDieta,
      mostrarDialogoAlimentacion,
      alimentacionSeleccionada,
      formularioAlimentacionRef,
      abrirDialogoAlimentacion,
      abrirDialogoEditarAlimentacion,
      guardarAlimentacion,
      hayAlimentacionActiva,
      traducirEstadoAlimentacion,
      getColorPorEstadoAlimentacion,
      suspenderAlimentacion,
      controlesConValores,
      notasDeEvolucion,
    }
  },
})
</script>

<style scoped>
.page-background {
  background-color: #f8fafc;
}
</style>
