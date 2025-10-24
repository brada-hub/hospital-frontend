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
      <!-- Información del paciente -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h5">
              {{ dashboardData.paciente.nombre }}
              {{ dashboardData.paciente.apellidos }}
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

      <!-- Tratamientos -->
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
              <q-menu>
                <q-list dense>
                  <q-item
                    clickable
                    v-ripple
                    @click="abrirDialogoEditar(tratamiento)"
                    :disable="tratamiento.estado !== 0"
                  >
                    <q-item-section avatar><q-icon name="edit" /></q-item-section>
                    <q-item-section>Modificar</q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-ripple
                    @click="suspenderTratamiento(tratamiento.id)"
                    :disable="tratamiento.estado !== 0"
                  >
                    <q-item-section avatar>
                      <q-icon name="pause_circle_outline" color="deep-orange" />
                    </q-item-section>
                    <q-item-section>Suspender Tratamiento Completo</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
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
                <q-item-label class="text-weight-medium">
                  {{ receta.medicamento.nombre }}
                  <q-badge
                    v-if="receta.estado === 1"
                    color="orange"
                    label="Suspendido"
                    class="q-ml-sm"
                  />
                </q-item-label>
                <q-item-label caption :class="{ 'text-strike text-grey-6': receta.estado === 1 }">
                  {{ receta.dosis }} - {{ receta.via_administracion }} - Cada
                  {{ receta.frecuencia_horas }} horas por {{ receta.duracion_dias }} días.
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round icon="more_vert" size="sm" v-if="!dashboardData.fecha_alta">
                  <q-menu anchor="bottom right" self="top right">
                    <q-list dense>
                      <q-item
                        clickable
                        v-ripple
                        @click="suspenderReceta(receta.id)"
                        :disable="receta.estado !== 0"
                      >
                        <q-item-section avatar style="min-width: 40px">
                          <q-icon name="pause_circle" color="orange" />
                        </q-item-section>
                        <q-item-section>Suspender Medicamento</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Alimentación -->
      <div class="text-h6 q-my-md">Planes de Alimentación</div>

      <div
        v-if="!dashboardData.alimentaciones || !dashboardData.alimentaciones.length"
        class="text-center text-grey-7 q-pa-lg"
      >
        <q-icon name="restaurant_off" size="lg" />
        <p>No hay planes de alimentación prescritos.</p>
      </div>

      <AlimentacionPanel
        ref="panelAlimentacionRef"
        v-if="hayAlimentacionActiva"
        :internacion-id="internacionId"
        :tratamiento-id="dashboardData.tratamientos?.[0]?.id"
        @edit-request="abrirDialogoEditarAlimentacion"
      />

      <q-card
        v-for="alimentacion in alimentacionesSuspendidas"
        :key="alimentacion.id"
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section class="bg-grey-2 row items-center justify-between">
          <div class="text-subtitle1 text-weight-bold">
            {{ alimentacion.tipo_dieta?.nombre || 'Dieta sin nombre' }}
          </div>
          <div>
            <q-badge
              :color="getAlimentacionColorPorEstado(alimentacion.estado)"
              :label="getAlimentacionTextoEstado(alimentacion.estado)"
              class="text-capitalize"
            />
          </div>
        </q-card-section>
        <q-card-section>
          <p><strong>Vía:</strong> {{ alimentacion.via_administracion }}</p>
          <p><strong>Observaciones:</strong> {{ alimentacion.descripcion }}</p>
          <q-list
            bordered
            separator
            dense
            v-if="alimentacion.tiempos && alimentacion.tiempos.length > 0"
          >
            <q-item-label header dense>Tiempos de Comida</q-item-label>
            <q-item v-for="tiempo in alimentacion.tiempos" :key="tiempo.id" dense>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ tiempo.tiempo_comida }}</q-item-label>
                <q-item-label caption>{{ tiempo.descripcion || 'Sin detalle' }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <q-separator class="q-my-lg" />

      <!-- Evolución y Signos Vitales -->
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
          <q-card-section style="white-space: pre-wrap">
            {{ control.observaciones }}
          </q-card-section>
        </q-card>
      </div>

      <!-- Diálogo: Nuevo Tratamiento -->
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

      <!-- Diálogo: Alimentación -->
      <q-dialog v-model="mostrarDialogoAlimentacion" persistent>
        <q-card style="width: 700px; max-width: 90vw">
          <AlimentacionForm
            ref="formularioAlimentacionRef"
            :internacion-id="internacionId"
            :alimentacion="alimentacionSeleccionada"
            @saved="handleAlimentacionSaved"
            @cancel="mostrarDialogoAlimentacion = false"
          />
        </q-card>
      </q-dialog>

      <!-- Diálogo: Nota de evolución -->
      <q-dialog v-model="mostrarDialogoEvolucion" persistent>
        <q-card style="min-width: 500px; border-radius: 12px">
          <q-card-section class="row items-center bg-primary text-white">
            <div class="text-h6">Nueva Nota de Evolución</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
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
import { Loading, Notify, Dialog } from 'quasar'
import { format, differenceInYears } from 'date-fns'
import { api } from 'boot/axios'
import FormularioPrescripcion from 'src/components/FormularioPrescripcion.vue'
import AlimentacionForm from 'src/components/AlimentacionForm.vue'
import AlimentacionPanel from 'src/components/AlimentacionPanel.vue'
import SignosVitalesDashboard from 'src/components/SignosVitalesDashboard.vue'

export default defineComponent({
  name: 'PanelInternacion',
  components: {
    FormularioPrescripcion,
    AlimentacionForm,
    AlimentacionPanel,
    SignosVitalesDashboard,
  },
  props: {
    internacionId: {
      type: [String, Number],
      required: true,
    },
  },
  setup(props) {
    const internacionId = props.internacionId
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
    const panelAlimentacionRef = ref(null)

    const controlesConValores = computed(() => {
      if (!dashboardData.value || !Array.isArray(dashboardData.value.controls)) return []
      return dashboardData.value.controls.filter(
        (c) => c && Array.isArray(c.valores) && c.valores.length > 0,
      )
    })

    const notasDeEvolucion = computed(() => {
      if (!dashboardData.value || !Array.isArray(dashboardData.value.controls)) return []
      return dashboardData.value.controls.filter(
        (c) => c && c.observaciones && (!Array.isArray(c.valores) || c.valores.length === 0),
      )
    })

    const hayTratamientoActivo = computed(() => {
      return dashboardData.value?.tratamientos?.some((t) => t.estado === 0) || false
    })

    const hayAlimentacionActiva = computed(() => {
      return dashboardData.value?.alimentaciones?.some((a) => a.estado === 0) || false
    })

    const alimentacionesSuspendidas = computed(() => {
      return dashboardData.value?.alimentaciones?.filter((a) => a.estado !== 0) || []
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

    function calcularEdad(fechaNacimiento) {
      if (!fechaNacimiento) return 'N/A'
      try {
        return differenceInYears(new Date(), new Date(fechaNacimiento))
      } catch {
        return 'N/A'
      }
    }

    function formatDateTime(dateTimeString) {
      if (!dateTimeString) return 'N/A'
      try {
        return format(new Date(dateTimeString), 'dd/MM/yyyy HH:mm')
      } catch {
        return 'N/A'
      }
    }

    function traducirEstado(estadoNum) {
      const estados = { 0: 'Activo', 1: 'Suspendido', 2: 'Finalizado', 3: 'Cancelado' }
      return estados[estadoNum] || 'Desconocido'
    }

    function getColorPorEstado(estadoNum) {
      const colores = { 0: 'green', 1: 'orange', 2: 'grey', 3: 'red' }
      return colores[estadoNum] || 'primary'
    }

    function getAlimentacionColorPorEstado(estadoNum) {
      const colores = { 0: 'positive', 1: 'orange', 2: 'grey', 3: 'red' }
      return colores[estadoNum] || 'primary'
    }

    function getAlimentacionTextoEstado(estadoNum) {
      const estados = { 0: 'Activa', 1: 'Suspendida', 2: 'Finalizada', 3: 'Cancelada' }
      return estados[estadoNum] || 'Desconocido'
    }

    function abrirDialogoTratamiento() {
      tratamientoSeleccionado.value = null
      mostrarDialogoTratamiento.value = true
    }

    function abrirDialogoEditar(tratamiento) {
      tratamientoSeleccionado.value = { ...tratamiento }
      mostrarDialogoTratamiento.value = true
    }

    async function guardarTratamiento() {
      const form = formularioPrescripcionRef.value
      if (!form || !form.validarFormulario()) return
      try {
        Loading.show()
        await form.guardarPrescripcion()
        mostrarDialogoTratamiento.value = false
        Notify.create({ type: 'positive', message: 'Tratamiento guardado correctamente.' })
        await fetchData()
      } catch (err) {
        Notify.create({
          type: 'negative',
          message: err.response?.data?.message || 'Error al guardar el tratamiento.',
        })
      } finally {
        Loading.hide()
      }
    }

    async function suspenderTratamiento(id) {
      Dialog.create({
        title: 'Confirmar suspensión',
        message: '¿Desea suspender este tratamiento?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          Loading.show()
          await api.put(`/tratamientos/${id}/suspender`)
          Notify.create({ type: 'positive', message: 'Tratamiento suspendido correctamente.' })
          await fetchData()
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: err.response?.data?.message || 'Error al suspender tratamiento.',
          })
        } finally {
          Loading.hide()
        }
      })
    }

    async function suspenderReceta(id) {
      Dialog.create({
        title: 'Suspender medicamento',
        message: '¿Desea suspender este medicamento del tratamiento?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          Loading.show()
          await api.put(`/recetas/${id}/suspender`)
          Notify.create({ type: 'positive', message: 'Medicamento suspendido correctamente.' })
          await fetchData()
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: err.response?.data?.message || 'Error al suspender medicamento.',
          })
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
      alimentacionSeleccionada.value = { ...alimentacion }
      mostrarDialogoAlimentacion.value = true
    }

    async function handleAlimentacionSaved() {
      mostrarDialogoAlimentacion.value = false
      Notify.create({ type: 'positive', message: 'Plan de alimentación guardado correctamente.' })
      await fetchData()
    }

    function abrirDialogoEvolucion() {
      mostrarDialogoEvolucion.value = true
    }
    async function guardarEvolucion() {
      if (!nuevaObservacion.value.trim()) return
      try {
        guardandoEvolucion.value = true
        await api.post(`/internaciones/${internacionId}/evoluciones`, {
          observaciones: nuevaObservacion.value,
        })
        Notify.create({ type: 'positive', message: 'Nota de evolución registrada correctamente.' })
        mostrarDialogoEvolucion.value = false
        nuevaObservacion.value = ''
        await fetchData()
      } catch (err) {
        Notify.create({
          type: 'negative',
          message: err.response?.data?.message || 'Error al guardar la evolución.',
        })
      } finally {
        guardandoEvolucion.value = false
      }
    }

    async function darDeAlta() {
      Dialog.create({
        title: 'Dar de Alta al Paciente',
        message: '¿Desea finalizar la internación y dar de alta al paciente?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          Loading.show()
          await api.put(`/internaciones/${internacionId}/alta`)
          Notify.create({ type: 'positive', message: 'Paciente dado de alta correctamente.' })
          await fetchData()
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: err.response?.data?.message || 'Error al dar de alta al paciente.',
          })
        } finally {
          Loading.hide()
        }
      })
    }

    return {
      isLoading,
      error,
      dashboardData,
      calcularEdad,
      formatDateTime,
      traducirEstado,
      getColorPorEstado,
      mostrarDialogoTratamiento,
      abrirDialogoTratamiento,
      abrirDialogoEditar,
      guardarTratamiento,
      suspenderTratamiento,
      suspenderReceta,
      tratamientoSeleccionado,
      formularioPrescripcionRef,
      mostrarDialogoEvolucion,
      abrirDialogoEvolucion,
      nuevaObservacion,
      guardarEvolucion,
      guardandoEvolucion,
      evolucionFormRef,
      hayTratamientoActivo,
      hayAlimentacionActiva,
      mostrarDialogoAlimentacion,
      abrirDialogoAlimentacion,
      abrirDialogoEditarAlimentacion,
      alimentacionSeleccionada,
      handleAlimentacionSaved,
      formularioAlimentacionRef,
      panelAlimentacionRef,
      catalogoMedicamentos,
      getAlimentacionColorPorEstado,
      getAlimentacionTextoEstado,
      alimentacionesSuspendidas,
      controlesConValores,
      notasDeEvolucion,
      darDeAlta,
    }
  },
})
</script>

<style scoped>
.text-strike {
  text-decoration: line-through;
}
</style>
