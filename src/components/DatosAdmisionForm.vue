<template>
  <div class="datos-admision-form">
    <q-form ref="formRef" @submit.prevent="validarYContinuar" class="form-content">
      <!-- BUSCAR PACIENTE -->
      <div class="form-section">
        <div class="section-title">
          <q-icon name="person_search" size="20px" class="q-mr-xs" />
          Seleccionar Paciente
        </div>

        <q-select
          outlined
          v-model="admisionForm.paciente_id"
          use-input
          input-debounce="300"
          label="Buscar paciente por nombre o CI *"
          :options="pacientesFiltrados"
          @filter="filtrarPacientes"
          option-value="id"
          :option-label="
            (paciente) => `${paciente.nombre} ${paciente.apellidos} - CI: ${paciente.ci}`
          "
          emit-value
          map-options
          :rules="[(val) => !!val || 'Debe seleccionar un paciente']"
          reactive-rules
          :loading="isLoadingPacientes"
          class="input-field"
          @update:model-value="validarPaciente"
          :error="errorPaciente !== ''"
          :error-message="errorPaciente"
        >
          <template v-slot:prepend>
            <q-icon name="person_search" color="teal" />
          </template>
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                <div class="text-center q-pa-md">
                  <q-icon name="search_off" size="48px" color="grey-5" />
                  <div class="q-mt-sm">No se encontraron pacientes</div>
                </div>
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:hint>
            <span class="text-teal-8">
              <q-icon name="info" size="14px" />
              Escriba para buscar o seleccione de la lista
            </span>
          </template>
        </q-select>
      </div>

      <!-- SELECCIONAR MÉDICO RESPONSABLE -->
      <div class="form-section">
        <div class="section-title">
          <q-icon name="medical_information" size="20px" class="q-mr-xs" />
          Asignación de Profesional
        </div>

        <q-select
          outlined
          v-model="admisionForm.medico_id"
          :options="medicosFiltrados"
          use-input
          input-debounce="300"
          @filter="filtrarMedicos"
          label="Médico Responsable *"
          option-value="id"
          emit-value
          map-options
          :rules="[(val) => !!val || 'Debe asignar un médico']"
          reactive-rules
          :loading="isLoadingMedicos"
          class="input-field"
          @update:model-value="validarMedico"
          :error="errorMedico !== ''"
          :error-message="errorMedico"
        >
          <template v-slot:prepend>
            <q-icon name="medical_information" color="teal" />
          </template>
          <template v-slot:selected>
            <div v-if="admisionForm.medico_id">
              {{ getNombreMedico(admisionForm.medico_id) }}
            </div>
          </template>
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.nombre }} {{ scope.opt.apellidos }}</q-item-label>
                <q-item-label caption
                  >{{ scope.opt.pacientes_activos_count }} pacientes activos</q-item-label
                >
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                <div class="text-center q-pa-md">
                  <q-icon name="search_off" size="48px" color="grey-5" />
                  <div class="q-mt-sm">No se encontraron médicos</div>
                </div>
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:hint>
            <span class="text-teal-8">
              <q-icon name="info" size="14px" />
              Seleccione el médico responsable del paciente
            </span>
          </template>
        </q-select>
      </div>

      <!-- ASIGNACIÓN DE CAMA -->
      <div class="form-section">
        <div class="section-title">
          <q-icon name="bed" size="20px" class="q-mr-xs" />
          Asignación de Cama
        </div>

        <q-select
          outlined
          v-model="selectedSala"
          :options="salasFiltradas"
          use-input
          input-debounce="300"
          @filter="filtrarSalas"
          option-value="id"
          :option-label="
            (sala) =>
              `${sala.nombre} (${sala.especialidad ? sala.especialidad.nombre : 'Sin especialidad'})`
          "
          emit-value
          map-options
          label="1. Seleccionar Sala *"
          :rules="[(val) => !!val || 'Seleccione una sala']"
          reactive-rules
          class="input-field q-mb-md"
          @update:model-value="validarSala"
          :error="errorSala !== ''"
          :error-message="errorSala"
        >
          <template v-slot:prepend>
            <q-icon name="meeting_room" color="teal" />
          </template>
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                <div class="text-center q-pa-md">
                  <q-icon name="search_off" size="48px" color="grey-5" />
                  <div class="q-mt-sm">No se encontraron salas</div>
                </div>
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:hint>
            <span class="text-teal-8">
              <q-icon name="info" size="14px" />
              Seleccione la sala donde se ubicará el paciente
            </span>
          </template>
        </q-select>

        <q-select
          outlined
          v-model="admisionForm.cama_id"
          :options="camasFiltradas"
          use-input
          input-debounce="300"
          @filter="filtrarCamas"
          label="2. Seleccionar Cama Disponible *"
          option-value="id"
          :option-label="(cama) => `Cama: ${cama.nombre} - Tipo: ${cama.tipo}`"
          emit-value
          map-options
          :rules="[(val) => !!val || 'Debe seleccionar una cama']"
          reactive-rules
          :disable="!selectedSala"
          :loading="isLoadingCamas"
          class="input-field"
          @update:model-value="validarCama"
          :error="errorCama !== ''"
          :error-message="errorCama"
        >
          <template v-slot:prepend>
            <q-icon name="bed" color="teal" />
          </template>
          <template v-slot:hint>
            <span v-if="!selectedSala" class="text-orange-8">
              <q-icon name="warning" size="14px" />
              Primero debe seleccionar una sala
            </span>
            <span v-else class="text-teal-8">
              <q-icon name="check_circle" size="14px" />
              Camas disponibles en {{ getNombreSala(selectedSala) }}
            </span>
          </template>
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                <div class="text-center q-pa-md">
                  <q-icon name="bed" size="48px" color="grey-5" />
                  <div class="q-mt-sm">
                    {{
                      selectedSala
                        ? 'No hay camas disponibles en esta sala'
                        : 'Seleccione una sala primero'
                    }}
                  </div>
                </div>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <!-- DETALLES DEL INGRESO -->
      <div class="form-section">
        <div class="section-title">
          <q-icon name="description" size="20px" class="q-mr-xs" />
          Detalles del Ingreso
        </div>

        <q-input
          outlined
          v-model="admisionForm.motivo"
          label="Motivo de Ingreso *"
          :rules="[
            (val) => !!val || 'El motivo es requerido',
            (val) => val.length >= 5 || 'Ingrese al menos 5 caracteres',
          ]"
          reactive-rules
          class="input-field q-mb-md"
          @update:model-value="validarMotivo"
          :error="errorMotivo !== ''"
          :error-message="errorMotivo"
        >
          <template v-slot:prepend>
            <q-icon name="assignment" color="teal" />
          </template>
          <template v-slot:hint>Ej: Dolor abdominal agudo, fractura de brazo</template>
        </q-input>

        <q-input
          outlined
          v-model="admisionForm.diagnostico"
          label="Diagnóstico Inicial *"
          :rules="[
            (val) => !!val || 'El diagnóstico es requerido',
            (val) => val.length >= 5 || 'Ingrese al menos 5 caracteres',
          ]"
          reactive-rules
          class="input-field q-mb-md"
          @update:model-value="validarDiagnostico"
          :error="errorDiagnostico !== ''"
          :error-message="errorDiagnostico"
        >
          <template v-slot:prepend>
            <q-icon name="medical_services" color="teal" />
          </template>
          <template v-slot:hint>Ej: Apendicitis aguda, fractura de radio</template>
        </q-input>

        <q-input
          outlined
          v-model="admisionForm.observaciones"
          type="textarea"
          rows="3"
          label="Observaciones (Opcional)"
          class="input-field"
          counter
          maxlength="500"
        >
          <template v-slot:prepend>
            <q-icon name="notes" color="teal" />
          </template>
          <template v-slot:hint>Agregue información adicional relevante</template>
        </q-input>
      </div>

      <q-stepper-navigation class="form-actions">
        <q-btn
          unelevated
          type="submit"
          color="teal"
          label="Continuar a Signos Vitales"
          icon-right="arrow_forward"
          class="btn-continuar"
          :disable="!formularioValido"
        />
      </q-stepper-navigation>
    </q-form>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, onMounted, watch, computed } from 'vue'
import { Notify } from 'quasar'
import { api } from 'boot/axios'

export default defineComponent({
  name: 'DatosAdmisionForm',
  props: {
    datosIniciales: {
      type: Object,
      default: null,
    },
  },
  emits: ['datos-listos'],
  setup(props, { emit, expose }) {
    const formRef = ref(null)
    const admisionForm = reactive({
      paciente_id: null,
      cama_id: null,
      medico_id: null,
      motivo: '',
      diagnostico: '',
      observaciones: '',
    })

    // Listas completas
    const pacientesCompletos = ref([])
    const medicosCompletos = ref([])
    const salasCompletas = ref([])
    const camasDisponibles = ref([])

    // Listas filtradas
    const pacientesFiltrados = ref([])
    const medicosFiltrados = ref([])
    const salasFiltradas = ref([])
    const camasFiltradas = ref([])

    const selectedSala = ref(null)
    const datosParaRestaurar = ref(null)

    // Estados de carga
    const isLoadingPacientes = ref(false)
    const isLoadingMedicos = ref(false)
    const isLoadingCamas = ref(false)

    // Estados de validación en tiempo real
    const errorPaciente = ref('')
    const errorMedico = ref('')
    const errorSala = ref('')
    const errorCama = ref('')
    const errorMotivo = ref('')
    const errorDiagnostico = ref('')

    // Computed para validar si el formulario está completo
    const formularioValido = computed(() => {
      return (
        admisionForm.paciente_id &&
        admisionForm.medico_id &&
        admisionForm.cama_id &&
        admisionForm.motivo &&
        admisionForm.motivo.length >= 5 &&
        admisionForm.diagnostico &&
        admisionForm.diagnostico.length >= 5 &&
        !errorPaciente.value &&
        !errorMedico.value &&
        !errorSala.value &&
        !errorCama.value &&
        !errorMotivo.value &&
        !errorDiagnostico.value
      )
    })

    // ✅ WATCH para restaurar datos guardados
    watch(
      () => props.datosIniciales,
      (newDatos) => {
        if (newDatos) {
          console.log('📥 Datos recibidos para restaurar:', newDatos)
          datosParaRestaurar.value = newDatos
          restaurarDatos()
        }
      },
      { immediate: true, deep: true },
    )

    // ✅ WATCH para detectar cuando las salas están cargadas
    watch(salasCompletas, () => {
      if (salasCompletas.value.length > 0 && datosParaRestaurar.value) {
        console.log('📥 Salas cargadas, restaurando datos...')
        restaurarDatos()
      }
    })

    // Función para restaurar datos
    async function restaurarDatos() {
      const newDatos = datosParaRestaurar.value

      if (!newDatos) return

      console.log('📥 Restaurando datos de admisión:', newDatos)

      // Copiar todos los datos básicos
      admisionForm.paciente_id = newDatos.paciente_id
      admisionForm.medico_id = newDatos.medico_id
      admisionForm.motivo = newDatos.motivo || ''
      admisionForm.diagnostico = newDatos.diagnostico || ''
      admisionForm.observaciones = newDatos.observaciones || ''

      // Si hay cama_id y las salas están cargadas, buscar la sala correspondiente
      if (newDatos.cama_id && salasCompletas.value.length > 0) {
        try {
          let camaEncontrada = false

          // Buscar la sala correspondiente a la cama
          for (const sala of salasCompletas.value) {
            const response = await api.get('/camas-disponibles', {
              params: { sala_id: sala.id },
            })
            const cama = response.data.find((c) => c.id === newDatos.cama_id)
            if (cama) {
              selectedSala.value = sala.id
              camasDisponibles.value = response.data
              camasFiltradas.value = response.data
              admisionForm.cama_id = newDatos.cama_id
              camaEncontrada = true
              console.log('✅ Cama y sala restauradas:', { sala: sala.id, cama: newDatos.cama_id })
              break
            }
          }

          if (!camaEncontrada) {
            console.warn('⚠️ No se encontró la sala para la cama:', newDatos.cama_id)
          }
        } catch (error) {
          console.error('❌ Error al restaurar sala de la cama:', error)
        }
      }

      // Limpiar errores
      errorPaciente.value = ''
      errorMedico.value = ''
      errorSala.value = ''
      errorCama.value = ''
      errorMotivo.value = ''
      errorDiagnostico.value = ''
    }

    onMounted(() => {
      cargarPacientes()
      cargarSalas()
      cargarMedicos()
    })

    watch(selectedSala, (newId, oldId) => {
      // Solo limpiar si NO estamos restaurando datos Y la sala cambió realmente
      const estaRestaurando = datosParaRestaurar.value && datosParaRestaurar.value.cama_id

      if (!estaRestaurando && oldId !== undefined) {
        admisionForm.cama_id = null
        errorCama.value = ''
      }

      camasDisponibles.value = []
      camasFiltradas.value = []

      if (newId) {
        cargarCamasDisponibles(newId)
      }
    })

    // Funciones de validación en tiempo real
    const validarPaciente = (value) => {
      if (!value) {
        errorPaciente.value = 'Debe seleccionar un paciente'
      } else {
        errorPaciente.value = ''
      }
    }

    const validarMedico = (value) => {
      if (!value) {
        errorMedico.value = 'Debe asignar un médico'
      } else {
        errorMedico.value = ''
      }
    }

    const validarSala = (value) => {
      if (!value) {
        errorSala.value = 'Debe seleccionar una sala'
      } else {
        errorSala.value = ''
      }
    }

    const validarCama = (value) => {
      if (!value) {
        errorCama.value = 'Debe seleccionar una cama'
      } else {
        errorCama.value = ''
      }
    }

    const validarMotivo = (value) => {
      if (!value) {
        errorMotivo.value = 'El motivo es requerido'
      } else if (value.length < 5) {
        errorMotivo.value = `Faltan ${5 - value.length} caracteres (mínimo 5)`
      } else {
        errorMotivo.value = ''
      }
    }

    const validarDiagnostico = (value) => {
      if (!value) {
        errorDiagnostico.value = 'El diagnóstico es requerido'
      } else if (value.length < 5) {
        errorDiagnostico.value = `Faltan ${5 - value.length} caracteres (mínimo 5)`
      } else {
        errorDiagnostico.value = ''
      }
    }

    // Cargar datos iniciales
    async function cargarPacientes() {
      isLoadingPacientes.value = true
      try {
        const response = await api.get('/pacientes/buscar', { params: { termino: '' } })
        pacientesCompletos.value = response.data
        pacientesFiltrados.value = response.data
      } catch (error) {
        console.error('Error cargando pacientes:', error)
        Notify.create({
          type: 'negative',
          message: 'No se pudieron cargar los pacientes',
          icon: 'error',
          position: 'top',
        })
      } finally {
        isLoadingPacientes.value = false
      }
    }

    async function cargarSalas() {
      try {
        const response = await api.get('/salas')
        salasCompletas.value = response.data
        salasFiltradas.value = response.data
      } catch (error) {
        console.error('Error cargando salas:', error)
        Notify.create({
          type: 'negative',
          message: 'No se pudieron cargar las salas',
          icon: 'error',
          position: 'top',
        })
      }
    }

    async function cargarCamasDisponibles(salaId) {
      isLoadingCamas.value = true
      try {
        const response = await api.get('/camas-disponibles', { params: { sala_id: salaId } })
        camasDisponibles.value = response.data
        camasFiltradas.value = response.data
      } catch (error) {
        console.error('Error cargando camas:', error)
        Notify.create({
          type: 'negative',
          message: 'No se pudieron cargar las camas disponibles',
          icon: 'error',
          position: 'top',
        })
      } finally {
        isLoadingCamas.value = false
      }
    }

    async function cargarMedicos() {
      isLoadingMedicos.value = true
      try {
        const response = await api.get('/medicos-activos')
        medicosCompletos.value = response.data
        medicosFiltrados.value = response.data
      } catch (error) {
        console.error('Error cargando médicos:', error)
        Notify.create({
          type: 'negative',
          message: 'No se pudo cargar la lista de médicos',
          icon: 'error',
          position: 'top',
        })
      } finally {
        isLoadingMedicos.value = false
      }
    }

    // Funciones de filtrado
    const filtrarPacientes = (val, update) => {
      update(() => {
        if (val === '') {
          pacientesFiltrados.value = pacientesCompletos.value
        } else {
          const needle = val.toLowerCase()
          pacientesFiltrados.value = pacientesCompletos.value.filter((p) => {
            const nombre = `${p.nombre} ${p.apellidos} ${p.ci}`.toLowerCase()
            return nombre.includes(needle)
          })
        }
      })
    }

    const filtrarMedicos = (val, update) => {
      update(() => {
        if (val === '') {
          medicosFiltrados.value = medicosCompletos.value
        } else {
          const needle = val.toLowerCase()
          medicosFiltrados.value = medicosCompletos.value.filter((m) => {
            const nombre = `${m.nombre} ${m.apellidos}`.toLowerCase()
            return nombre.includes(needle)
          })
        }
      })
    }

    const filtrarSalas = (val, update) => {
      update(() => {
        if (val === '') {
          salasFiltradas.value = salasCompletas.value
        } else {
          const needle = val.toLowerCase()
          salasFiltradas.value = salasCompletas.value.filter((s) => {
            const nombre = `${s.nombre} ${s.especialidad?.nombre || ''}`.toLowerCase()
            return nombre.includes(needle)
          })
        }
      })
    }

    const filtrarCamas = (val, update) => {
      update(() => {
        if (val === '') {
          camasFiltradas.value = camasDisponibles.value
        } else {
          const needle = val.toLowerCase()
          camasFiltradas.value = camasDisponibles.value.filter((c) => {
            const nombre = `${c.nombre} ${c.tipo}`.toLowerCase()
            return nombre.includes(needle)
          })
        }
      })
    }

    const getNombreSala = (salaId) => {
      const sala = salasCompletas.value.find((s) => s.id === salaId)
      return sala ? sala.nombre : ''
    }

    const getNombreMedico = (medicoId) => {
      const medico = medicosCompletos.value.find((m) => m.id === medicoId)
      return medico
        ? `${medico.nombre} ${medico.apellidos} (${medico.pacientes_activos_count} pacientes)`
        : ''
    }

    async function validarYContinuar() {
      const esValido = await formRef.value.validate()
      if (esValido && formularioValido.value) {
        emit('datos-listos', admisionForm)
      } else {
        Notify.create({
          type: 'warning',
          message: 'Por favor, complete todos los campos correctamente',
          icon: 'warning',
          position: 'top',
          timeout: 3000,
        })
      }
    }

    function reset() {
      if (formRef.value) {
        formRef.value.resetValidation()
      }
      Object.assign(admisionForm, {
        paciente_id: null,
        cama_id: null,
        medico_id: null,
        motivo: '',
        diagnostico: '',
        observaciones: '',
      })
      selectedSala.value = null

      errorPaciente.value = ''
      errorMedico.value = ''
      errorSala.value = ''
      errorCama.value = ''
      errorMotivo.value = ''
      errorDiagnostico.value = ''

      pacientesFiltrados.value = pacientesCompletos.value
      medicosFiltrados.value = medicosCompletos.value
      salasFiltradas.value = salasCompletas.value
      camasFiltradas.value = []
    }

    expose({ reset })

    return {
      formRef,
      admisionForm,
      pacientesFiltrados,
      medicosFiltrados,
      salasFiltradas,
      camasFiltradas,
      selectedSala,
      isLoadingPacientes,
      isLoadingMedicos,
      isLoadingCamas,
      errorPaciente,
      errorMedico,
      errorSala,
      errorCama,
      errorMotivo,
      errorDiagnostico,
      formularioValido,
      validarPaciente,
      validarMedico,
      validarSala,
      validarCama,
      validarMotivo,
      validarDiagnostico,
      filtrarPacientes,
      filtrarMedicos,
      filtrarSalas,
      filtrarCamas,
      getNombreSala,
      getNombreMedico,
      validarYContinuar,
    }
  },
})
</script>

<style scoped>
.datos-admision-form {
  padding: 0;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.form-section:hover {
  border-color: #14b8a6;
  box-shadow: 0 2px 8px rgba(20, 184, 166, 0.1);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0d9488;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #ccfbf1;
  display: flex;
  align-items: center;
}

.input-field {
  transition: all 0.3s ease;
}

.input-field :deep(.q-field__control) {
  background: white;
  border-radius: 8px;
}

.input-field :deep(.q-field__native) {
  font-weight: 500;
}

.input-field.q-field--error :deep(.q-field__control) {
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.input-field :deep(.q-field__messages) {
  font-weight: 500;
  font-size: 0.85rem;
}

.input-field :deep(.q-field__hint) {
  font-size: 0.8rem;
  font-weight: 500;
}

.input-field :deep(.q-field__counter) {
  color: #64748b;
  font-weight: 500;
}

.form-actions {
  margin-top: 8px;
  padding-top: 0;
}

.btn-continuar {
  width: 100%;
  padding: 12px 24px;
  font-weight: 700;
  font-size: 1rem;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  transition: all 0.3s ease;
}

.btn-continuar:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(20, 184, 166, 0.4);
}

.btn-continuar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-section {
    padding: 16px;
  }

  .section-title {
    font-size: 1rem;
  }
}
</style>
