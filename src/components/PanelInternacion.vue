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
      <!-- Botones de Acción -->
      <div class="actions-container q-mb-md">
           <div class="action-buttons justify-end">
            <template v-if="!dashboardData.fecha_alta">
              <q-btn
                v-if="!dashboardData.fecha_alta"
                unelevated
                rounded
                color="teal"
                icon="add"
                label="Nuevo Tratamiento"
                @click="abrirDialogoTratamiento"
                class="action-btn"
                :disable="hayTratamientoActivo"
              >
                <q-tooltip v-if="hayTratamientoActivo">
                  Suspenda el tratamiento activo para agregar uno nuevo.
                </q-tooltip>
              </q-btn>

              <!-- Botón Prescribir Dieta Eliminado para Médicos -->

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
      </div>

      <!-- TABS NAVIGATION -->
      <div class="tabs-container">
        <q-tabs
          v-model="activeTab"
          dense
          class="text-grey"
          active-color="teal"
          indicator-color="teal"
          align="justify"
          narrow-indicator
        >
          <q-tab name="signos-vitales" icon="monitor_heart" label="Signos Vitales" />
          <q-tab name="tratamientos" icon="medication" label="Tratamientos" />
          <q-tab name="alimentacion" icon="restaurant" label="Alimentación" />
          <q-tab name="plan-cuidados" icon="assignment" label="Plan de Cuidados" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <!-- PANEL: SIGNOS VITALES -->
          <q-tab-panel name="signos-vitales" class="q-pa-none">
             <div class="panel-inner-content">
                <SignosVitalesDashboard
                  v-if="controlesConValores.length > 0"
                  :controls="controlesConValores"
                  :internacion="dashboardData"
                />

                <div v-else class="empty-state">
                  <q-icon name="monitor_heart" size="60px" color="grey-4" />
                   <p class="text-grey-6 q-mt-sm">No hay registros de signos vitales.</p>
                </div>
             </div>
          </q-tab-panel>

          <!-- PANEL: TRATAMIENTOS -->
          <q-tab-panel name="tratamientos" class="q-pa-none">
             <div class="panel-inner-content">
                <div
                  v-if="!tratamientosActivos || !tratamientosActivos.length"
                  class="empty-state"
                >
                  <q-icon name="medication" size="80px" color="grey-5" />
                  <p>No hay tratamientos activos prescritos.</p>
                </div>

                <q-card
                  v-for="tratamiento in tratamientosActivos"
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

                <!-- Historial de Tratamientos (Nuevo Componente) -->
                <ListaHistorialTratamientos :tratamientos="tratamientosInactivos" />
             </div>
          </q-tab-panel>

          <!-- PANEL: ALIMENTACIÓN -->
          <q-tab-panel name="alimentacion" class="q-pa-none">
             <div class="panel-inner-content">

                <!-- VISTA LECTURA / GESTIÓN (Médico / Nutricionista) -->
                <template v-if="isMedico || isNutricionista">
                  <div class="role-view-container">
                    <!-- Barra de Acciones para Nutricionista -->
                    <div v-if="isNutricionista && hayAlimentacionActiva" class="actions-bar q-mb-md">
                       <div class="text-subtitle2 text-grey-7">Acciones de Nutrición</div>
                       <div class="row q-gutter-sm">
                          <q-btn
                            color="amber-9"
                            icon="edit"
                            label="Modificar Plan"
                            unelevated
                            class="action-btn"
                            @click="abrirDialogoEditarAlimentacion(dashboardData.alimentaciones.find(a => a.estado === 0))"
                          />
                          <q-btn
                            color="negative"
                            icon="block"
                            label="Suspender Dieta"
                            outline
                            class="action-btn"
                            @click="confirmarSuspensionDieta"
                          />
                       </div>
                    </div>

                    <!-- Botón para asignar dieta si no tiene (Solo Nutricionista) -->
                    <div v-if="isNutricionista && !hayAlimentacionActiva" class="q-mb-md">
                       <q-btn
                          color="teal"
                          icon="add_circle"
                          label="Asignar Nuevo Plan Alimenticio"
                          unelevated
                          class="full-width"
                          size="lg"
                          @click="abrirDialogoAlimentacion"
                        />
                    </div>

                    <AlimentacionPanelReadOnly
                      :internacion-id="internacionId"
                    />
                  </div>
                </template>

                <!-- VISTA ENFERMERÍA / OTROS (Registro de consumos) -->
                <template v-else>
                     <div
                      v-if="!hayAlimentacionActiva"
                      class="empty-state"
                    >
                      <q-icon name="restaurant_off" size="80px" color="grey-5" />
                      <p>No hay planes de alimentación prescritos.</p>
                      <p class="text-caption text-grey-6">Solo un nutricionista puede asignar un plan.</p>
                    </div>

                    <AlimentacionPanel
                      v-else
                      ref="panelAlimentacionRef"
                      :internacion-id="internacionId"
                      :tratamiento-id="dashboardData.tratamientos?.[0]?.id || null"
                      :read-only="false"
                      @edit-request="abrirDialogoEditarAlimentacion"
                    />
                </template>

                <!-- Historial de dietas suspendidas (visible para todos al final) -->
                <div v-if="alimentacionesSuspendidas.length > 0" class="q-mt-xl">
                    <div class="text-subtitle1 q-mb-md text-grey-8">Historial de Dietas Anteriores</div>
                    <q-card
                      v-for="alimentacion in alimentacionesSuspendidas"
                      :key="alimentacion.id"
                      flat
                      bordered
                      class="alimentacion-card q-mb-md"
                    >
                      <q-card-section class="alimentacion-header bg-grey-2">
                        <div class="alimentacion-title text-grey-8">
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
                        <p class="text-caption">Finalizada el: {{ formatDateTime(alimentacion.updated_at) }}</p>
                      </q-card-section>
                    </q-card>
                </div>

             </div>
          </q-tab-panel>

          <!-- PANEL: PLAN DE CUIDADOS (EVOLUCIÓN) -->
          <q-tab-panel name="plan-cuidados" class="q-pa-none">
             <div class="panel-inner-content">

               <!-- SECCIÓN 1: PLAN DE CUIDADOS (INSTRUCCIONES) -->
               <div class="q-mb-xl">
                 <div class="row items-center justify-between q-mb-md">
                    <div class="text-h6 text-teal-9">Indicaciones y Plan de Cuidados</div>
                    <q-btn
                      v-if="!dashboardData.fecha_alta"
                      unelevated
                      rounded
                      color="teal"
                      icon="add_task"
                      label="Nueva Indicación"
                      @click="abrirDialogoCuidado"
                    />
                 </div>

                 <PlanCuidados
                    :plan="dashboardData.plan_de_cuidados || []"
                    @recargar-pacientes="fetchData"
                 />
               </div>

               <q-separator class="q-my-lg" />

               <!-- SECCIÓN 2: NOTAS DE EVOLUCIÓN -->
               <div class="row items-center justify-between q-mb-md">
                  <div class="text-h6 text-blue-grey-9">Notas de Evolución</div>
                  <q-btn
                    v-if="!dashboardData.fecha_alta"
                    unelevated
                    rounded
                    color="secondary"
                    icon="note_add"
                    label="Nueva Nota"
                    @click="abrirDialogoEvolucion"
                  />
               </div>

                <div v-if="notasDeEvolucion.length > 0" class="evolution-notes">
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
                 <div v-else class="empty-state">
                  <q-icon name="history_edu" size="60px" color="grey-4" />
                   <p class="text-grey-6 q-mt-sm">No hay notas de evolución registradas.</p>
                </div>
             </div>
          </q-tab-panel>
        </q-tab-panels>
      </div>


      <!-- Diálogos -->
      <q-dialog v-model="mostrarDialogoTratamiento" persistent>
        <q-card class="dialog-card">
          <FormularioPrescripcion
            ref="formularioPrescripcionRef"
            :tratamiento-para-editar="tratamientoSeleccionado"
            :internacion-id="internacionId"
            :catalogo-medicamentos="catalogoMedicamentos"
            @medicamento-creado="onMedicamentoCreado"
          />
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
            <q-btn
              unelevated
              :label="tratamientoSeleccionado ? 'Guardar Cambios' : 'Prescribir'"
              color="teal"
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

      <!-- Diálogo Nuevo Cuidado -->
      <q-dialog v-model="mostrarDialogoCuidado" persistent>
        <q-card class="dialog-card-small">
           <q-card-section class="dialog-header-custom text-white">
            <div class="text-h6">Nueva Indicación / Cuidado</div>
          </q-card-section>

          <q-form @submit.prevent="guardarCuidado">
            <q-card-section class="q-pt-md q-gutter-md">
              <q-input
                outlined
                v-model="cuidadoForm.tipo"
                label="Tipo de Indicación"
                hint="Ej: Cuidado de Herida, Control Glucemia, Reposo"
                :rules="[val => !!val || 'Requerido']"
              />

              <q-input
                outlined
                v-model="cuidadoForm.frecuencia"
                label="Frecuencia"
                hint="Ej: Cada 8 horas, Turno Mañana, SOS"
                :rules="[val => !!val || 'Requerido']"
              />

              <q-input
                outlined
                v-model="cuidadoForm.descripcion"
                label="Descripción Detallada"
                type="textarea"
                rows="4"
                :rules="[val => !!val || 'Requerido', val => val.length > 5 || 'Mínimo 5 caracteres']"
              />
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md bg-grey-1">
              <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
              <q-btn
                unelevated
                label="Guardar Indicación"
                color="teal"
                type="submit"
                :loading="guardandoCuidado"
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
import { useUserStore } from 'src/stores/user'
import FormularioPrescripcion from 'src/components/FormularioPrescripcion.vue'
import AlimentacionForm from 'src/components/AlimentacionForm.vue'
import AlimentacionPanel from 'src/components/AlimentacionPanel.vue'
import AlimentacionPanelReadOnly from 'src/components/AlimentacionPanelReadOnly.vue'
import ListaHistorialTratamientos from 'src/components/ListaHistorialTratamientos.vue' // ✅ Added history component
import SignosVitalesDashboard from 'src/components/SignosVitalesDashboard.vue'
import PlanCuidados from 'src/components/PlanCuidados.vue'

export default defineComponent({
  name: 'PanelInternacion',
  components: {
    FormularioPrescripcion,
    AlimentacionForm,
    AlimentacionPanel,
    AlimentacionPanelReadOnly,
    ListaHistorialTratamientos, // ✅ Added
    SignosVitalesDashboard,
    PlanCuidados,
  },
  props: {
    internacionId: {
      type: [String, Number],
      required: true,
    },
    initialData: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const internacionId = props.internacionId
    const userStore = useUserStore() // ✅ Added for permission checks
    const activeTab = ref('signos-vitales') // ✅ Added for tabs
    const isLoading = ref(true)
    const error = ref(null)
    const dashboardData = ref(null)
    const catalogoMedicamentos = ref([])
    const catalogoTiposDieta = ref([])
    const mostrarDialogoTratamiento = ref(false)
    const tratamientoSeleccionado = ref(null)
    const formularioPrescripcionRef = ref(null)
    const mostrarDialogoEvolucion = ref(false)
    const nuevaObservacion = ref('')
    const guardandoEvolucion = ref(false)
    const evolucionFormRef = ref(null)
    const mostrarDialogoAlimentacion = ref(false)
    const alimentacionSeleccionada = ref(null)
    const formularioAlimentacionRef = ref(null)
    const panelAlimentacionRef = ref(null)

    // Care Plan State
    const mostrarDialogoCuidado = ref(false)
    const cuidadoForm = ref({
        tipo: 'Indicación Médica',
        descripcion: '',
        frecuencia: '',
    })
    const guardandoCuidado = ref(false)

    const controlesConValores = computed(() => {
      // FIX: El backend envía 'controles' (español), no 'controls'
      if (!dashboardData.value || !Array.isArray(dashboardData.value.controles)) return []
      return dashboardData.value.controles.filter(
        (c) => c && Array.isArray(c.valores) && c.valores.length > 0,
      )
    })

    const notasDeEvolucion = computed(() => {
      // FIX: El backend envía 'controles' (español), no 'controls'
      if (!dashboardData.value || !Array.isArray(dashboardData.value.controles)) return []
      return dashboardData.value.controles.filter(
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

    const tratamientosActivos = computed(() => {
      return dashboardData.value?.tratamientos?.filter((t) => t.estado === 0) || []
    })

    const tratamientosInactivos = computed(() => {
      return dashboardData.value?.tratamientos?.filter((t) => t.estado !== 0) || []
    })

    // ✅ Permission check for diet editing
    const canEditDiet = computed(() => {
      return userStore.hasPermission('acceso.nutricion')
    })

    // ROL COMPUTED PROPERTIES
    const isMedico = computed(() => userStore.user?.rol?.nombre?.toLowerCase().includes('medico') || userStore.user?.rol?.nombre?.toLowerCase().includes('médico'))
    const isNutricionista = computed(() => userStore.user?.rol?.nombre?.toLowerCase().includes('nutricio'))

    async function fetchData() {
      isLoading.value = true
      error.value = null
      try {
        const promises = [
          api.get('/medicamentos'),
          api.get('/tipos-dieta'),
        ]

        // If no initial data, fetch dashboard data
        if (!props.initialData) {
            promises.unshift(api.get(`/internaciones/${internacionId}/vista-completa`))
        }

        const responses = await Promise.all(promises)

        let medicamentosRes, tiposDietaRes

        if (props.initialData) {
            dashboardData.value = props.initialData
            medicamentosRes = responses[0]
            tiposDietaRes = responses[1]
        } else {
            dashboardData.value = responses[0].data
            medicamentosRes = responses[1]
            tiposDietaRes = responses[2]
        }

        catalogoMedicamentos.value = medicamentosRes.data
        catalogoTiposDieta.value = tiposDietaRes.data
      } catch (err) {
        error.value = err.response?.data?.message || 'No se pudo conectar con el servidor.'
        Notify.create({ type: 'negative', message: error.value })
      } finally {
        isLoading.value = false
      }
    }

    onMounted(fetchData)

    // SUPENSION DIETA
    function confirmarSuspensionDieta() {
      Dialog.create({
        title: 'Confirmar Suspensión',
        message: '¿Estás seguro de que deseas suspender (finalizar) la dieta actual de este paciente?',
        cancel: {
          label: 'Cancelar',
          color: 'primary',
          flat: true
        },
        persistent: true,
        ok: {
          label: 'Suspender',
          color: 'negative',
          flat: true
        }
      }).onOk(() => {
        suspenderDieta()
      })
    }

    async function suspenderDieta() {
      const activeDiet = dashboardData.value?.alimentaciones?.find(a => a.estado === 0)
      if (!activeDiet) return

      try {
        Loading.show({ message: 'Suspendiendo dieta...' })
        await api.put(`/alimentaciones/${activeDiet.id}`, {
          estado: 1 // 1 = Inactivo
        })

        Notify.create({
          color: 'positive',
          message: 'Dieta suspendida correctamente',
          icon: 'check_circle'
        })

        await fetchData()

      } catch (error) {
        console.error('Error al suspender dieta:', error)
         Notify.create({
          color: 'negative',
          message: 'Error al suspender la dieta',
          icon: 'error'
        })
      } finally {
        Loading.hide()
      }
    }

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
        title: 'Confirmar suspensión de tratamiento',
        message: 'Por favor, indique el motivo de la suspensión (mínimo 10 caracteres):',
        prompt: {
          model: '',
          type: 'textarea', // Usar textarea para escribir más cómodo
          isValid: val => val.length >= 10, // Validación local
        },
        cancel: true,
        persistent: true,
      }).onOk(async (motivo) => {
        try {
          Loading.show({ message: 'Suspendiendo tratamiento...' })
          // Se envía el motivo en el body
          await api.post(`/tratamientos/${id}/suspender`, { motivo })
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
        title: 'Confirmar suspensión de medicamento',
        message: 'Por favor, indique el motivo de la suspensión (mínimo 10 caracteres):',
        prompt: {
          model: '',
          type: 'textarea',
          isValid: val => val.length >= 10,
        },
        cancel: true,
        persistent: true,
      }).onOk(async (motivo) => {
        try {
          Loading.show({ message: 'Suspendiendo medicamento...' })
          await api.post(`/recetas/${id}/suspender`, { motivo })
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

    function abrirDialogoCuidado() {
      cuidadoForm.value = {
        tipo: 'Indicación Médica',
        descripcion: '',
        frecuencia: '',
      }
      mostrarDialogoCuidado.value = true
    }

    async function guardarCuidado() {
      try {
        guardandoCuidado.value = true
        await api.post('/cuidados', {
          internacion_id: internacionId,
          ...cuidadoForm.value,
        })
        Notify.create({ type: 'positive', message: 'Indicación registrada correctamente' })
        mostrarDialogoCuidado.value = false
        await fetchData()
      } catch (err) {
        Notify.create({
          type: 'negative',
          message: err.response?.data?.message || 'Error al guardar indicación',
        })
      } finally {
        guardandoCuidado.value = false
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

    // ✅ Función para manejar la creación de un nuevo medicamento
    function onMedicamentoCreado(nuevoMedicamento) {
      console.log('✅ Nuevo medicamento creado:', nuevoMedicamento)
      // Agregar el nuevo medicamento al catálogo local
      catalogoMedicamentos.value.push(nuevoMedicamento)
    }

    return {
      activeTab, // ✅ Added
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
      onMedicamentoCreado,
      canEditDiet, // ✅ Exposed for diet button visibility
      isMedico, // ✅
      isNutricionista, // ✅
      confirmarSuspensionDieta, // ✅
      mostrarDialogoCuidado,
      abrirDialogoCuidado,
      guardarCuidado,
      guardandoCuidado,
      cuidadoForm,
      tratamientosActivos,
      tratamientosInactivos,
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
/* Actions Container */
.actions-container {
  display: flex;
  justify-content: flex-end;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  font-weight: 600;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Suavizado */
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

/* Dialog Styles Custom */
.dialog-card-small {
  width: 100%;
  max-width: 500px;
  border-radius: 16px;
  background: white;
}

.dialog-header-custom {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); /* Teal gradient */
  padding: 16px 24px;
}

/* Text Strike */
.text-strike {
  text-decoration: line-through;
}

/* Responsive */
@media (max-width: 768px) {
  /* Removed patient-header and patient-name responsive styles as they are no longer used */

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

/* NEW STYLES FOR ROLE VIEW */
.role-view-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fadeIn 0.4s ease-out;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
}

.action-btn {
  font-weight: 600;
  letter-spacing: 0.3px;
}

.empty-diet-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  color: #94a3b8;
  gap: 16px;
  background: white;
}

</style>
