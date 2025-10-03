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
                    v-model="receta.dosis"
                    label="Dosis *"
                    :rules="[(val) => !!val || 'Requerido']"
                  />
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
      (tratamiento) => {
        if (tratamiento) {
          Object.assign(tratamientoForm, tratamiento)
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
      { immediate: true, deep: true },
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
      tratamientoForm.recetas.push({
        medicamento_id: medicamentoSeleccionado.value,
        dosis: '',
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
          const duraciones = tratamientoForm.recetas.map((r) => r.duracion_dias || 0)
          const maxDuracion = Math.max(...duraciones)
          tratamientoForm.fecha_fin = format(
            addDays(new Date(tratamientoForm.fecha_inicio), maxDuracion),
            'yyyy-MM-dd HH:mm:ss',
          )
        }
        return { datos: tratamientoForm, esValido }
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
</style>
