<template>
  <q-form ref="formRef" class="q-gutter-y-md q-pt-md">
    <q-card class="styled-card" flat bordered>
      <q-card-section>
        <div class="text-h6 text-primary">
          <q-icon name="medical_services" class="q-mr-sm" />
          {{ tratamientoParaEditar ? 'Modificar' : 'Prescribir' }} Tratamiento
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              outlined
              v-model="tratamientoForm.tipo"
              label="Tipo de Tratamiento *"
              lazy-rules
              :rules="[(val) => !!val || 'El tipo es requerido']"
            >
              <template v-slot:prepend><q-icon name="category" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-input
              outlined
              v-model="tratamientoForm.descripcion"
              label="Descripción / Diagnóstico *"
              lazy-rules
              :rules="[(val) => !!val || 'La descripción es requerida']"
            >
              <template v-slot:prepend><q-icon name="description" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-input
              outlined
              readonly
              v-model="tratamientoForm.fecha_inicio"
              label="Fecha y Hora de Inicio"
            >
              <template v-slot:prepend><q-icon name="event" /></template>
            </q-input>
          </div>
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="text-subtitle1 text-grey-8 q-mb-md section-title">
          <q-icon name="medication" /><span>Receta de Medicamentos</span>
        </div>
        <div class="row items-start q-col-gutter-md">
          <div class="col-12 col-md-8">
            <q-select
              outlined
              v-model="medicamentoSeleccionado"
              use-input
              hide-selected
              fill-input
              input-debounce="400"
              label="Buscar medicamento en catálogo..."
              :options="opcionesFiltradas"
              @filter="filtrarMedicamentos"
              option-value="id"
              option-label="nombre"
              emit-value
              map-options
            >
              <template v-slot:prepend><q-icon name="search" /></template>
              <template v-slot:no-option
                ><q-item
                  ><q-item-section class="text-grey"
                    >No se encontraron resultados</q-item-section
                  ></q-item
                ></template
              >
            </q-select>
          </div>
          <div class="col-12 col-md-4">
            <q-btn
              label="Añadir"
              icon="add"
              color="secondary"
              class="full-width q-py-md"
              :disable="!medicamentoSeleccionado"
              @click="agregarReceta"
            />
          </div>
        </div>
      </q-card-section>
      <q-card-section v-if="tratamientoForm.recetas.length > 0" class="q-pt-none">
        <q-list bordered separator class="rounded-borders">
          <q-item-label header class="bg-grey-2"
            >Medicamentos Prescritos ({{ tratamientoForm.recetas.length }})</q-item-label
          >
          <q-item v-for="(receta, index) in tratamientoForm.recetas" :key="index" class="q-py-md">
            <q-item-section>
              <q-item-label class="text-weight-medium text-subtitle1">{{
                getMedicamentoNombre(receta.medicamento_id)
              }}</q-item-label>
              <div class="row q-col-gutter-sm q-mt-xs">
                <div class="col-12 col-md-6 col-lg-3">
                  <q-input
                    dense
                    outlined
                    v-model.number="receta.dosis_valor"
                    label="Dosis *"
                    type="number"
                    :rules="[(val) => val > 0 || 'Debe ser > 0']"
                  >
                    <template v-slot:append>
                      <q-select
                        dense
                        borderless
                        v-model="receta.dosis_unidad"
                        :options="unidadesDosis"
                        class="unidad-select"
                      />
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-md-6 col-lg-3">
                  <q-select
                    dense
                    outlined
                    v-model="receta.via_administracion"
                    :options="viasDeAdministracion"
                    label="Vía *"
                    :rules="[(val) => !!val || 'Requerido']"
                  />
                </div>
                <div class="col-12 col-md-6 col-lg-3">
                  <q-input
                    type="number"
                    dense
                    outlined
                    v-model.number="receta.frecuencia_horas"
                    label="Frecuencia (h) *"
                    :rules="[(val) => val > 0 || '> 0']"
                  />
                </div>
                <div class="col-12 col-md-6 col-lg-3">
                  <q-input
                    type="number"
                    dense
                    outlined
                    v-model.number="receta.duracion_dias"
                    label="Duración (días) *"
                    :rules="[(val) => val > 0 || '> 0']"
                  />
                </div>
              </div>
            </q-item-section>
            <q-item-section side
              ><q-btn flat dense round icon="delete" color="negative" @click="quitarReceta(index)"
                ><q-tooltip>Quitar</q-tooltip></q-btn
              ></q-item-section
            >
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-form>
</template>

<script>
import { defineComponent, ref, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import { format, addDays } from 'date-fns'

export default defineComponent({
  name: 'FormularioPrescripcion',
  props: {
    tratamientoParaEditar: {
      type: Object,
      default: null,
    },
    internacionId: {
      type: [Number, String],
      required: true,
    },
    catalogoMedicamentos: {
      type: Array,
      required: true,
    },
  },
  setup(props, { expose }) {
    const $q = useQuasar()
    const formRef = ref(null)

    const viasDeAdministracion = ref([
      'Oral',
      'Intravenosa',
      'Intramuscular',
      'Subcutánea',
      'Tópica',
      'Inhalatoria',
      'Rectal',
      'Ótica',
      'Oftálmica',
    ])

    // ✅ Lista de unidades para el selector
    const unidadesDosis = ref([
      'mg',
      'g',
      'ml',
      'mcg',
      'UI',
      'gotas',
      'comprimido(s)',
      'cápsula(s)',
    ])

    const tratamientoForm = reactive({
      internacion_id: props.internacionId,
      tipo: '',
      descripcion: '',
      fecha_inicio: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      fecha_fin: '',
      observaciones: '',
      estado: 0,
      recetas: [],
    })

    watch(
      () => props.tratamientoParaEditar,
      (nuevoTratamiento) => {
        if (nuevoTratamiento) {
          Object.assign(tratamientoForm, nuevoTratamiento)

          // ✅ Lógica para PARSEAR la dósis al editar
          // Separa "12 mg" en valor=12 y unidad='mg'
          const recetasParseadas = (nuevoTratamiento.recetas || []).map((receta) => {
            const [valor, ...unidadParts] = (receta.dosis || '').split(' ')
            const unidad = unidadParts.join(' ') || 'mg'
            return {
              ...receta,
              dosis_valor: parseFloat(valor) || null,
              dosis_unidad: unidadesDosis.value.includes(unidad) ? unidad : 'mg',
            }
          })
          tratamientoForm.recetas = JSON.parse(JSON.stringify(recetasParseadas))
        } else {
          Object.assign(tratamientoForm, {
            internacion_id: props.internacionId,
            tipo: '',
            descripcion: '',
            fecha_inicio: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            fecha_fin: '',
            observaciones: '',
            estado: 0,
            recetas: [],
          })
        }
      },
      { immediate: true },
    )

    const opcionesFiltradas = ref([])
    const medicamentoSeleccionado = ref(null)

    function filtrarMedicamentos(val, update) {
      if (!val) {
        update(() => {
          opcionesFiltradas.value = props.catalogoMedicamentos.slice(0, 10)
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        opcionesFiltradas.value = props.catalogoMedicamentos.filter(
          (v) => v.nombre.toLowerCase().indexOf(needle) > -1,
        )
      })
    }

    function agregarReceta() {
      if (!medicamentoSeleccionado.value) return
      if (tratamientoForm.recetas.some((r) => r.medicamento_id === medicamentoSeleccionado.value)) {
        $q.notify({ color: 'warning', message: 'Este medicamento ya fue añadido.' })
        return
      }
      // ✅ Se inicializa la nueva receta con los campos para valor y unidad
      tratamientoForm.recetas.push({
        medicamento_id: medicamentoSeleccionado.value,
        dosis_valor: null,
        dosis_unidad: 'mg',
        via_administracion: 'Oral',
        frecuencia_horas: 8,
        duracion_dias: 1,
        indicaciones: '',
      })
      medicamentoSeleccionado.value = null
    }

    function quitarReceta(index) {
      tratamientoForm.recetas.splice(index, 1)
    }

    function getMedicamentoNombre(id) {
      const med = props.catalogoMedicamentos.find((m) => m.id === id)
      return med ? med.nombre : 'Desconocido'
    }

    expose({
      async validarYObtenerDatos() {
        const esValido = await formRef.value.validate()

        if (!tratamientoForm.recetas.length) {
          $q.notify({ color: 'negative', message: 'Debe prescribir al menos un medicamento.' })
          return { esValido: false }
        }

        if (esValido) {
          const datosParaEnviar = JSON.parse(JSON.stringify(tratamientoForm))

          // ✅ Lógica para UNIR valor y unidad antes de enviar al backend
          // Convierte valor=12 y unidad='mg' en dosis="12 mg"
          datosParaEnviar.recetas.forEach((receta) => {
            if (receta.dosis_valor && receta.dosis_unidad) {
              receta.dosis = `${receta.dosis_valor} ${receta.dosis_unidad}`
            }
            delete receta.dosis_valor
            delete receta.dosis_unidad
          })

          const duraciones = datosParaEnviar.recetas.map((r) => r.duracion_dias || 0)
          const maxDuracion = Math.max(...duraciones)
          datosParaEnviar.fecha_fin = format(
            addDays(new Date(datosParaEnviar.fecha_inicio), maxDuracion),
            'yyyy-MM-dd HH:mm:ss',
          )

          return { datos: datosParaEnviar, esValido }
        }

        return { esValido: false }
      },
    })

    return {
      formRef,
      tratamientoForm,
      viasDeAdministracion,
      opcionesFiltradas,
      medicamentoSeleccionado,
      filtrarMedicamentos,
      agregarReceta,
      quitarReceta,
      getMedicamentoNombre,
      unidadesDosis, // Exponer la lista de unidades al template
    }
  },
})
</script>

<style scoped>
.styled-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #555;
}
/* Estilo para que el selector de unidad se vea bien */
.unidad-select {
  padding-left: 0;
  background-color: #f7f7f7;
  border-left: 1px solid #ccc;
  min-width: 85px;
}
</style>
