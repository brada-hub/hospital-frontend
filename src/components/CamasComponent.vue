<template>
  <div class="q-pa-md">
    <q-list bordered class="rounded-borders">
      <q-expansion-item
        v-for="sala in salas"
        :key="sala.id"
        group="salas-group"
        header-class="bg-white text-primary text-bold"
        class="expansion-item-header"
      >
        <template v-slot:header>
          <q-item-section avatar>
            <q-icon name="local_hospital" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-h6">{{ sala.nombre }}</q-item-label>
            <q-item-label caption class="text-grey-8">
              Especialidad: {{ sala.especialidad?.nombre || 'N/A' }}
            </q-item-label>
          </q-item-section>
        </template>

        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div
              v-for="cama in getCamasBySala(sala.id)"
              :key="cama.id"
              class="col-12 col-sm-6 col-md-4 col-lg-2-5"
            >
              <q-card flat bordered :class="`cama-card status-${cama.estado.toLowerCase()}`">
                <q-card-section class="q-pa-md text-center">
                  <q-icon
                    name="bed"
                    size="xl"
                    :color="cama.estado === 'activo' ? 'positive' : 'negative'"
                  />
                  <div class="text-h6 q-mt-sm">{{ cama.nombre }}</div>
                  <div class="text-subtitle1 text-bold">{{ cama.tipo }}</div>
                  <div class="text-caption text-grey-8">{{ cama.estado }}</div>
                </q-card-section>

                <q-card-actions align="center" class="bg-grey-2">
                  <q-btn
                    dense
                    round
                    flat
                    icon="edit"
                    color="warning"
                    @click="openEditCamaDialog(cama)"
                  />
                  <q-btn
                    dense
                    round
                    flat
                    :icon="cama.estado === 'activo' ? 'block' : 'check'"
                    :color="cama.estado === 'activo' ? 'negative' : 'positive'"
                    @click="toggleCamaEstado(cama)"
                  />
                </q-card-actions>
              </q-card>
            </div>

            <div class="col-12 col-sm-6 col-md-4 col-lg-2-5">
              <q-card
                flat
                bordered
                class="add-cama-card cursor-pointer"
                @click="openAddCamaDialog(sala.id)"
              >
                <q-card-section class="text-center q-pa-lg">
                  <q-icon name="add_circle_outline" size="lg" color="primary" />
                  <div class="q-mt-sm text-primary text-weight-bold">Añadir Cama</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-expansion-item>
    </q-list>

    <q-dialog v-model="camaDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            {{ camaForm.id ? 'Editar Cama' : 'Añadir Cama' }}
          </div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="camaForm.nombre" label="Nombre" outlined dense class="q-mb-sm" />
          <q-input v-model="camaForm.tipo" label="Tipo" outlined dense class="q-mb-sm" />
          <q-select
            v-model="camaForm.estado"
            :options="['activo', 'inactivo']"
            label="Estado"
            outlined
            dense
            class="q-mb-sm"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" v-close-popup />
          <q-btn flat label="Guardar" color="primary" @click="saveCama" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const $q = useQuasar()

const salas = ref([])
const camas = ref([])

const camaDialog = ref(false)

const camaForm = reactive({
  id: null,
  nombre: '',
  tipo: '',
  estado: 'activo',
  sala_id: null,
})

// 📌 Funciones para SALAS
const fetchSalas = async () => {
  try {
    const { data } = await api.get('/salas')
    salas.value = data
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Error al cargar salas' })
  }
}

// 📌 Funciones para CAMAS
const fetchCamas = async () => {
  try {
    const { data } = await api.get('/camas')
    camas.value = data
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Error al cargar camas' })
  }
}

const getCamasBySala = (salaId) => {
  return camas.value.filter((cama) => cama.sala_id === salaId)
}

const openAddCamaDialog = (salaId) => {
  Object.assign(camaForm, {
    id: null,
    nombre: '',
    tipo: '',
    estado: 'activo',
    sala_id: salaId,
  })
  camaDialog.value = true
}

const openEditCamaDialog = (cama) => {
  Object.assign(camaForm, cama)
  camaDialog.value = true
}

const saveCama = async () => {
  try {
    const payload = { ...camaForm }
    if (camaForm.id) {
      await api.put(`/camas/${camaForm.id}`, payload)
      $q.notify({ type: 'positive', message: 'Cama actualizada' })
    } else {
      await api.post('/camas', payload)
      $q.notify({ type: 'positive', message: 'Cama creada' })
    }
    camaDialog.value = false
    await fetchCamas()
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Error al guardar cama' })
  }
}

const toggleCamaEstado = async (cama) => {
  try {
    const newEstado = cama.estado === 'activo' ? 'inactivo' : 'activo'
    await api.put(`/camas/${cama.id}`, { ...cama, estado: newEstado })

    $q.notify({ type: 'positive', message: `Cama ${newEstado} correctamente` })
    await fetchCamas()
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Error al cambiar estado de la cama' })
  }
}

// Se eliminó la función de especialidades ya que no se usaba en este componente
// y causaba un error de ESLint.

onMounted(() => {
  fetchSalas()
  fetchCamas()
})
</script>

<style scoped>
/*
  Clase personalizada para las columnas.
  Crea 5 columnas de igual ancho para pantallas grandes.
*/
.col-lg-2-5 {
  width: 20%;
}
@media (max-width: 1439px) {
  /* Tablet/Desktop */
  .col-lg-2-5 {
    width: 33.3333%; /* Vuelve a 3 columnas para pantallas más pequeñas */
  }
}
@media (max-width: 1023px) {
  /* Tablet */
  .col-lg-2-5 {
    width: 50%; /* 2 columnas */
  }
}
@media (max-width: 599px) {
  /* Móvil */
  .col-lg-2-5 {
    width: 100%; /* 1 columna */
  }
}

.expansion-item-header {
  transition: background-color 0.2s ease;
}
.expansion-item-header:hover {
  background-color: #f5f5f5 !important;
}

.cama-card {
  border-radius: 12px;
  min-height: 200px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  cursor: pointer;
}
.cama-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.add-cama-card {
  border: 2px dashed #1976d2;
  color: #1976d2;
  min-height: 200px;
  opacity: 0.8;
}
.add-cama-card:hover {
  opacity: 1;
}

/* Estilos de estado */
.status-activo {
  background-color: #e0f2f1;
  border-left: 5px solid #00c853;
}
.status-inactivo {
  background-color: #ffebee;
  border-left: 5px solid #d32f2f;
}
</style>
