<template>
  <q-card-section class="bg-primary text-white">
    <div class="text-h6">
      {{ esEdicion ? 'Editar Plan de Alimentación' : 'Nuevo Plan de Alimentación' }}
    </div>
  </q-card-section>

  <q-form ref="formRef" @submit.prevent>
    <q-card-section class="q-gutter-md">
      <q-select
        v-model="formData.tipo_dieta_id"
        :options="catalogoTiposDieta"
        label="Tipo de Dieta"
        option-value="id"
        option-label="nombre"
        emit-value
        map-options
        outlined
        :rules="[(val) => !!val || 'Debe seleccionar un tipo de dieta']"
      />

      <q-input
        v-model="formData.frecuencia"
        label="Frecuencia (ej. 3 veces al día)"
        outlined
        :rules="[(val) => !!val || 'La frecuencia es requerida']"
      />

      <q-input
        v-model="formData.descripcion"
        label="Descripción / Indicaciones Adicionales"
        type="textarea"
        outlined
        :rules="[(val) => !!val || 'La descripción es requerida']"
      />

      <div class="row q-col-gutter-md">
        <div class="col-6">
          <q-input
            v-model="formData.fecha_inicio"
            outlined
            type="date"
            label="Fecha de Inicio"
            stack-label
            :rules="[(val) => !!val || 'Campo requerido']"
          />
        </div>
        <div class="col-6">
          <q-input
            v-model="formData.fecha_fin"
            outlined
            type="date"
            label="Fecha de Fin"
            stack-label
            :rules="[(val) => !!val || 'Campo requerido']"
          />
        </div>
      </div>
    </q-card-section>
  </q-form>
</template>

<script>
import { defineComponent, ref, watch, computed } from 'vue'
import { format } from 'date-fns'

export default defineComponent({
  name: 'FormularioAlimentacion',
  props: {
    internacionId: { type: [String, Number], required: true },
    alimentacionParaEditar: { type: Object, default: null },
    catalogoTiposDieta: { type: Array, required: true },
  },
  setup(props) {
    const formRef = ref(null)
    const formData = ref({
      internacion_id: props.internacionId,
      tipo_dieta_id: null,
      frecuencia: '',
      descripcion: '',
      fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
      fecha_fin: '',
    })

    const esEdicion = computed(() => !!props.alimentacionParaEditar)

    watch(
      () => props.alimentacionParaEditar,
      (newVal) => {
        if (newVal) {
          formData.value = {
            internacion_id: props.internacionId,
            tipo_dieta_id: newVal.tipo_dieta_id,
            frecuencia: newVal.frecuencia,
            descripcion: newVal.descripcion,
            fecha_inicio: format(new Date(newVal.fecha_inicio), 'yyyy-MM-dd'),
            fecha_fin: format(new Date(newVal.fecha_fin), 'yyyy-MM-dd'),
          }
        } else {
          // Reset
          formData.value = {
            internacion_id: props.internacionId,
            tipo_dieta_id: null,
            frecuencia: '',
            descripcion: '',
            fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
            fecha_fin: '',
          }
        }
      },
      { immediate: true },
    )

    async function validarYObtenerDatos() {
      const esValido = await formRef.value.validate()
      return { datos: formData.value, esValido }
    }

    return {
      formRef,
      formData,
      esEdicion,
      validarYObtenerDatos,
    }
  },
})
</script>
