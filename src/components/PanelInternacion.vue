<template>
  <q-page padding class="panel-internacion-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <q-spinner-dots color="teal" size="60px" />
      <div class="loading-text">Cargando datos clínicos...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <q-icon name="error" color="negative" size="80px" />
      <div class="error-title">Error al cargar los datos</div>
      <p class="error-message">{{ error }}</p>
    </div>

    <!-- Main Content -->
    <div v-else-if="dashboardData" class="content-wrapper">
      <!-- Card de Información del Paciente -->
      <q-card flat bordered class="patient-info-card">
        <q-card-section class="patient-header">
          <div class="patient-details">
            <div class="patient-name">
              {{ dashboardData.paciente.nombre }} {{ dashboardData.paciente.apellidos }}
            </div>
            <div class="patient-meta">
              <span class="meta-item">
                <q-icon name="fingerprint" size="18px" />
                C.I: {{ dashboardData.paciente.ci }}
              </span>
              <span class="meta-item">
                <q-icon name="cake" size="18px" />
                {{ calcularEdad(dashboardData.paciente.fecha_nacimiento) }} años
              </span>
            </div>

            <q-badge
              v-if="!dashboardData.fecha_alta"
              color="positive"
              text-color="white"
              label="Internado"
              icon="local_hospital"
              class="status-badge"
            />
            <q-badge
              v-else
              color="grey"
              text-color="white"
              :label="`De Alta - ${formatDateTime(dashboardData.fecha_alta)}`"
              icon="check_circle"
              class="status-badge"
            />
          </div>

          <div class="action-buttons">
            <template v-if="!dashboardData.fecha_alta">
              <q-btn
                v-if="!hayTratamientoActivo"
                unelevated
                rounded
                color="primary"
                icon="add"
                label="Nuevo Tratamiento"
                @click="abrirDialogoTratamiento"
                class="action-btn"
              />

              <q-btn
                unelevated
                rounded
                color="teal"
                icon="restaurant_menu"
                label="Prescribir Dieta"
                @click="abrirDialogoAlimentacion"
                :disable="hayAlimentacionActiva"
                class="action-btn"
              >
                <q-tooltip v-if="hayAlimentacionActiva">
                  Suspenda la dieta activa para agregar una nueva.
                </q-tooltip>
              </q-btn>

              <q-btn
                unelevated
                rounded
                color="negative"
                icon="medical_services"
                label="Dar de Alta"
                @click="darDeAlta"
                class="action-btn"
              />
            </template>

            <template v-else>
              <q-btn
                unelevated
                rounded
                color="primary"
                icon="picture_as_pdf"
                label="Descargar Epicrisis"
                @click="descargarEpicrisis"
                class="action-btn"
              />
              <q-btn
                unelevated
                rounded
                color="secondary"
                icon="description"
                label="Evolución Clínica"
                @click="descargarEvolucionClinica"
                class="action-btn"
              />
            </template>
          </div>
        </q-card-section>
      </q-card>

      <!-- Tratamientos -->
      <div class="section-header">
        <q-icon name="medication" size="28px" color="teal" />
        <span>Tratamientos</span>
      </div>

      <div
        v-if="!dashboardData.tratamientos || !dashboardData.tratamientos.length"
        class="empty-state"
      >
        <q-icon name="medication" size="80px" color="grey-5" />
        <p>No hay tratamientos prescritos.</p>
      </div>

      <q-card
        v-for="tratamiento in dashboardData.tratamientos"
        :key="tratamiento.id"
        flat
        bordered
        class="treatment-card"
      >
        <q-card-section class="treatment-header">
          <div class="treatment-title">{{ tratamiento.tipo }}</div>
          <div class="treatment-actions">
            <q-badge
              :color="getColorPorEstado(tratamiento.estado)"
              :label="traducirEstado(tratamiento.estado)"
              class="status-badge-small"
            />
            <q-btn flat round dense icon="more_vert" v-if="!dashboardData.fecha_alta">
              <q-menu>
                <q-list dense>
                  <q-item
                    clickable
                    v-ripple
                    @click="abrirDialogoEditar(tratamiento)"
                    :disable="tratamiento.estado !== 0"
                  >
                    <q-item-section avatar><q-icon name="edit" color="teal" /></q-item-section>
                    <q-item-section>Modificar</q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-ripple
                    @click="suspenderTratamiento(tratamiento.id)"
                    :disable="tratamiento.estado !== 0"
                  >
                    <q-item-section avatar>
                      <q-icon name="pause_circle_outline" color="orange" />
                    </q-item-section>
                    <q-item-section>Suspender Tratamiento</q-item-section>
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

          <q-list
            bordered
            separator
            v-if="tratamiento.recetas && tratamiento.recetas.length > 0"
            class="medications-list"
          >
            <q-item-label header>Medicamentos</q-item-label>
            <q-item v-for="receta in tratamiento.recetas" :key="receta.id">
              <q-item-section>
                <q-item-label class="medication-name">
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
                <q-btn flat round dense icon="more_vert" v-if="!dashboardData.fecha_alta">
                  <q-menu>
                    <q-list dense>
                      <q-item
                        clickable
                        v-ripple
                        @click="suspenderReceta(receta.id)"
                        :disable="receta.estado !== 0"
                      >
                        <q-item-section avatar>
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
      <div class="section-header">
        <q-icon name="restaurant" size="28px" color="teal" />
        <span>Planes de Alimentación</span>
      </div>

      <div
        v-if="!dashboardData.alimentaciones || !dashboardData.alimentaciones.length"
        class="empty-state"
      >
        <q-icon name="restaurant_off" size="80px" color="grey-5" />
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
        class="alimentacion-card"
      >
        <q-card-section class="alimentacion-header">
          <div class="alimentacion-title">
            {{ alimentacion.tipo_dieta?.nombre || 'Dieta sin nombre' }}
          </div>
          <q-badge
            :color="getAlimentacionColorPorEstado(alimentacion.estado)"
            :label="getAlimentacionTextoEstado(alimentacion.estado)"
            class="status-badge-small"
          />
        </q-card-section>
        <q-card-section>
          <p><strong>Vía:</strong> {{ alimentacion.via_administracion }}</p>
          <p><strong>Observaciones:</strong> {{ alimentacion.descripcion }}</p>
          <q-list
            bordered
            separator
            dense
            v-if="alimentacion.tiempos && alimentacion.tiempos.length > 0"
            class="tiempos-list"
          >
            <q-item-label header dense>Tiempos de Comida</q-item-label>
            <q-item v-for="tiempo in alimentacion.tiempos" :key="tiempo.id" dense>
              <q-item-section>
                <q-item-label class="tiempo-name">{{ tiempo.tiempo_comida }}</q-item-label>
                <q-item-label caption>{{ tiempo.descripcion || 'Sin detalle' }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <q-separator class="section-separator" />

      <!-- Evolución y Signos Vitales -->
      <div class="section-header">
        <q-icon name="analytics" size="28px" color="teal" />
        <span>Monitor de Signos Vitales y Evolución</span>
      </div>

      <div class="evolution-actions" v-if="!dashboardData.fecha_alta">
        <q-btn
          unelevated
          rounded
          color="secondary"
          icon="note_add"
          label="Añadir Nota de Evolución"
          @click="abrirDialogoEvolucion"
        />
      </div>

      <div v-if="!dashboardData.controls || !dashboardData.controls.length" class="empty-state">
        <q-icon name="analytics" size="80px" color="grey-5" />
        <p>No hay notas de evolución o controles de signos vitales registrados.</p>
      </div>

      <SignosVitalesDashboard
        v-if="controlesConValores.length > 0"
        :controls="controlesConValores"
      />

      <div class="evolution-notes" v-if="notasDeEvolucion.length > 0">
        <div class="notes-title">Notas de Evolución Médica</div>
        <q-card
          v-for="control in notasDeEvolucion"
          :key="control.id"
          flat
          bordered
          class="note-card"
        >
          <q-card-section class="note-header">
            <div class="note-date">{{ formatDateTime(control.fecha_control) }}</div>
            <div class="note-author" v-if="control.user">
              Por: {{ control.user.nombre }} {{ control.user.apellidos }}
            </div>
          </q-card-section>
          <q-card-section class="note-content">
            {{ control.observaciones }}
          </q-card-section>
        </q-card>
      </div>

      <!-- Diálogos -->
      <q-dialog v-model="mostrarDialogoTratamiento" persistent>
        <q-card class="dialog-card">
          <FormularioPrescripcion
            ref="formularioPrescripcionRef"
            :tratamiento-para-editar="tratamientoSeleccionado"
            :internacion-id="internacionId"
            :catalogo-medicamentos="catalogoMedicamentos"
          />
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
            <q-btn
              unelevated
              :label="tratamientoSeleccionado ? 'Guardar Cambios' : 'Prescribir'"
              color="primary"
              @click="guardarTratamiento"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="mostrarDialogoAlimentacion" persistent>
        <q-card class="dialog-card">
          <AlimentacionForm
            ref="formularioAlimentacionRef"
            :internacion-id="internacionId"
            :alimentacion="alimentacionSeleccionada"
            @saved="handleAlimentacionSaved"
            @cancel="mostrarDialogoAlimentacion = false"
          />
        </q-card>
      </q-dialog>

      <q-dialog v-model="mostrarDialogoEvolucion" persistent>
        <q-card class="evolution-dialog">
          <q-card-section class="evolution-dialog-header">
            <div class="dialog-title-text">Nueva Nota de Evolución</div>
            <q-btn icon="close" flat round dense v-close-popup color="white" />
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

            <q-card-actions align="right" class="dialog-actions">
              <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
              <q-btn
                unelevated
                label="Guardar Nota"
                color="primary"
                type="submit"
                :loading="guardandoEvolucion"
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
      const colores = { 0: 'positive', 1: 'orange', 2: 'grey', 3: 'negative' }
      return colores[estadoNum] || 'primary'
    }

    function getAlimentacionColorPorEstado(estadoNum) {
      const colores = { 0: 'positive', 1: 'orange', 2: 'grey', 3: 'negative' }
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
      if (!form) return

      const resultado = await form.validarYObtenerDatos()

      if (!resultado.esValido) {
        return
      }

      try {
        Loading.show({ message: 'Guardando tratamiento...' })

        if (tratamientoSeleccionado.value && tratamientoSeleccionado.value.id) {
          await api.put(`/tratamientos/${tratamientoSeleccionado.value.id}`, resultado.datos)
        } else {
          await api.post('/tratamientos', resultado.datos)
        }

        mostrarDialogoTratamiento.value = false
        Notify.create({
          type: 'positive',
          message: 'Tratamiento guardado correctamente.',
        })
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
        message: '¿Desea suspender este tratamiento completo?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          Loading.show({ message: 'Suspendiendo tratamiento...' })
          await api.patch(`/tratamientos/${id}/suspender`)
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
          Loading.show({ message: 'Suspendiendo medicamento...' })
          await api.patch(`/recetas/${id}/suspender`)
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
      // Recargar el panel de alimentación
      if (panelAlimentacionRef.value) {
        panelAlimentacionRef.value.cargarDatosAlimentacion()
      }
    }

    function abrirDialogoEvolucion() {
      mostrarDialogoEvolucion.value = true
    }

    async function guardarEvolucion() {
      if (!nuevaObservacion.value.trim()) return
      try {
        guardandoEvolucion.value = true
        await api.post('/controls', {
          internacion_id: internacionId,
          tipo: 'Evolución Médica',
          fecha_control: new Date().toISOString(),
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
          Loading.show({ message: 'Procesando alta...' })
          await api.put(`/internaciones/${internacionId}/alta`)
          Notify.create({ type: 'positive', message: 'Paciente dado de alta correctamente.' })
          await fetchData()

          Dialog.create({
            title: 'Epicrisis Generada',
            message:
              'El paciente ha sido dado de alta exitosamente. ¿Desea descargar la epicrisis ahora?',
            cancel: { label: 'Más tarde', flat: true, color: 'grey' },
            ok: { label: 'Descargar Epicrisis', color: 'primary', icon: 'picture_as_pdf' },
            persistent: false,
          }).onOk(() => {
            descargarEpicrisis()
          })
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

    async function descargarEpicrisis() {
      try {
        Loading.show({ message: 'Generando epicrisis en PDF...' })
        const response = await api.get(`/reportes/epicrisis/${internacionId}`, {
          responseType: 'blob',
        })

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        const fileName = `Epicrisis_${dashboardData.value.paciente.apellidos}_${dashboardData.value.paciente.ci}_${format(new Date(), 'ddMMyyyy')}.pdf`
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        Notify.create({
          type: 'positive',
          message: 'Epicrisis descargada correctamente.',
          icon: 'check_circle',
        })
      } catch (err) {
        Notify.create({
          type: 'negative',
          message: err.response?.data?.message || 'Error al descargar la epicrisis.',
          caption: 'Verifique que el paciente esté dado de alta.',
        })
      } finally {
        Loading.hide()
      }
    }

    async function descargarEvolucionClinica() {
      try {
        Loading.show({ message: 'Generando evolución clínica en PDF...' })
        const response = await api.get(`/reportes/evolucion-clinica/${internacionId}`, {
          responseType: 'blob',
        })

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        const fileName = `EvolucionClinica_${dashboardData.value.paciente.apellidos}_${dashboardData.value.paciente.ci}_${format(new Date(), 'ddMMyyyy')}.pdf`
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        Notify.create({
          type: 'positive',
          message: 'Evolución clínica descargada correctamente.',
          icon: 'check_circle',
        })
      } catch (err) {
        Notify.create({
          type: 'negative',
          message: err.response?.data?.message || 'Error al descargar la evolución clínica.',
        })
      } finally {
        Loading.hide()
      }
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
      descargarEpicrisis,
      descargarEvolucionClinica,
    }
  },
})
</script>

<style scoped>
.panel-internacion-page {
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
  min-height: 100vh;
}

/* Loading & Error States */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 20px;
}

.loading-text {
  font-size: 1.125rem;
  color: #0f766e;
  font-weight: 600;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #dc2626;
  margin-top: 16px;
}

.error-message {
  color: #64748b;
  text-align: center;
  max-width: 500px;
}

/* Content Wrapper */
.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

/* Patient Info Card */
.patient-info-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  margin-bottom: 32px;
  overflow: hidden;
}

.patient-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.patient-details {
  flex: 1;
  min-width: 300px;
}

.patient-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
}

.patient-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.9375rem;
  font-weight: 500;
}

.status-badge {
  font-weight: 600;
  padding: 8px 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  font-weight: 600;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Section Headers */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f766e;
  margin: 32px 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 3px solid #ccfbf1;
}

/* Empty States */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: white;
  border-radius: 12px;
  border: 2px dashed #e2e8f0;
  margin-bottom: 20px;
}

.empty-state p {
  color: #64748b;
  font-size: 1rem;
  margin-top: 16px;
}

/* Treatment Cards */
.treatment-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.treatment-card:hover {
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.1);
}

.treatment-header {
  background: #f8fafc;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.treatment-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f766e;
}

.treatment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge-small {
  font-weight: 600;
  padding: 4px 12px;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.medications-list {
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.medication-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
}

/* Alimentación Cards */
.alimentacion-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.alimentacion-header {
  background: #f0fdfa;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ccfbf1;
}

.alimentacion-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f766e;
}

.tiempos-list {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
}

.tiempo-name {
  font-weight: 600;
  color: #0f766e;
}

/* Section Separator */
.section-separator {
  margin: 48px 0;
  background: linear-gradient(90deg, transparent, #14b8a6, transparent);
  height: 2px;
}

/* Evolution Actions */
.evolution-actions {
  margin-bottom: 24px;
}

/* Evolution Notes */
.evolution-notes {
  margin-top: 32px;
}

.notes-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 16px;
}

.note-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.note-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.note-header {
  background: #f8fafc;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.note-date {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

.note-author {
  color: #64748b;
  font-size: 0.875rem;
}

.note-content {
  padding: 20px;
  color: #334155;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Dialogs */
.dialog-card {
  width: 900px;
  max-width: 95vw;
  border-radius: 16px;
}

.dialog-actions {
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.evolution-dialog {
  width: 600px;
  max-width: 95vw;
  border-radius: 16px;
}

.evolution-dialog-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

/* Text Strike */
.text-strike {
  text-decoration: line-through;
}

/* Responsive */
@media (max-width: 768px) {
  .patient-header {
    flex-direction: column;
    align-items: stretch;
  }

  .patient-name {
    font-size: 1.5rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }

  .section-header {
    font-size: 1.25rem;
  }

  .treatment-header,
  .alimentacion-header,
  .note-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
