<template>
  <div class="q-pa-md">
    <!-- Botón para añadir -->
    <q-btn color="primary" label="Añadir Sala" @click="openAddDialog" class="q-mb-md" />

    <!-- Tabla de salas -->
    <q-table title="Salas" :rows="salas" :columns="columns" row-key="id" flat bordered>
      <template v-slot:body-cell-acciones="props">
        <q-td>
          <q-btn
            dense
            round
            color="warning"
            icon="edit"
            @click="openEditDialog(props.row)"
            class="q-mr-sm"
          />
          <q-btn
            dense
            round
            :color="props.row.estado === 'activo' ? 'negative' : 'positive'"
            :icon="props.row.estado === 'activo' ? 'block' : 'check'"
            @click="toggleEstado(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Modal de Sala -->
    <q-dialog v-model="dialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            {{ salaForm.id ? 'Editar Sala' : 'Añadir Sala' }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="salaForm.nombre" label="Nombre" outlined dense class="q-mb-sm" />

          <q-input v-model="salaForm.tipo" label="Tipo" outlined dense class="q-mb-sm" />

          <q-select
            v-model="salaForm.estado"
            :options="['activo', 'inactivo']"
            label="Estado"
            outlined
            dense
            class="q-mb-sm"
          />

          <q-select
            v-model="salaForm.especialidad_id"
            :options="especialidadesOptions"
            option-value="id"
            option-label="nombre"
            emit-value
            map-options
            label="Especialidad"
            outlined
            dense
            class="q-mb-sm"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" v-close-popup />
          <q-btn flat label="Guardar" color="primary" @click="saveSala" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios' // 👈 usamos el mismo api que en HospitalPage

const $q = useQuasar()

const salas = ref([])
const especialidadesOptions = ref([])
const dialog = ref(false)

const salaForm = reactive({
  id: null,
  nombre: '',
  tipo: '',
  estado: 'activo',
  especialidad_id: null,
})

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'center' },
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'left' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  {
    name: 'especialidad',
    label: 'Especialidad',
    field: (row) => row.especialidad?.nombre || 'N/A',
    align: 'left',
  },
  { name: 'acciones', label: 'Acciones', align: 'center' },
]

// 📌 Cargar salas
const fetchSalas = async () => {
  try {
    const { data } = await api.get('/salas')
    salas.value = data
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Error al cargar salas' })
  }
}

// 📌 Cargar especialidades
const fetchEspecialidades = async () => {
  try {
    const { data } = await api.get('/especialidades')
    especialidadesOptions.value = data
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Error al cargar especialidades' })
  }
}

// 📌 Abrir modal para añadir
const openAddDialog = () => {
  Object.assign(salaForm, {
    id: null,
    nombre: '',
    tipo: '',
    estado: 'activo',
    especialidad_id: null,
  })
  dialog.value = true
}

// 📌 Abrir modal para editar
const openEditDialog = (sala) => {
  Object.assign(salaForm, sala)
  dialog.value = true
}

// 📌 Guardar sala (crear o actualizar)
const saveSala = async () => {
  if (!salaForm.nombre || !salaForm.tipo || !salaForm.especialidad_id) {
    $q.notify({ type: 'negative', message: 'Completa todos los campos' })
    return
  }
  try {
    const payload = {
      nombre: salaForm.nombre,
      tipo: salaForm.tipo,
      estado: salaForm.estado.toLowerCase(),
      especialidad_id: salaForm.especialidad_id,
    }
    console.log('payload', payload)
    if (salaForm.id) {
      await api.put(`/salas/${salaForm.id}`, payload)
      $q.notify({ type: 'positive', message: 'Sala actualizada correctamente' })
    } else {
      await api.post('/salas', payload)
      $q.notify({ type: 'positive', message: 'Sala creada correctamente' })
    }
    dialog.value = false
    await fetchSalas()
  } catch (error) {
    console.error('Error al guardar sala:', error.response?.data || error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al guardar sala',
    })
  }
}

// 📌 Cambiar estado (activar/inactivar)
const toggleEstado = async (sala) => {
  try {
    await api.delete(`/salas/${sala.id}`)
    await fetchSalas()
    $q.notify({
      type: 'positive',
      message: `Sala ${sala.estado === 'activo' ? 'inactivada' : 'activada'}`,
    })
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Error al cambiar estado' })
  }
}

onMounted(() => {
  fetchSalas()
  fetchEspecialidades()
})
</script>
