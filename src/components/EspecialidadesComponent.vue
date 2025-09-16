<template>
  <div class="salas-container">
    <div class="header-section">
      <h2 class="titulo-principal">Gestión de Especialidades</h2>
      <q-btn
        class="btn-agregar"
        label="Añadir Especialidad"
        icon="add"
        @click="abrirDialogoAgregar"
        no-caps
        rounded
      />
    </div>

    <div class="salas-grid">
      <div
        v-for="item in especialidades"
        :key="item.id"
        class="sala-card"
        :class="{ 'card-inactivo': !item.estado }"
      >
        <div class="card-header">
          <div class="sala-info">
            <q-icon name="medical_services" class="sala-icon" size="2rem" />
            <div class="sala-details">
              <span class="sala-label">ESPECIALIDAD:</span>
              <h3 class="sala-nombre">{{ item.nombre }}</h3>
            </div>
          </div>
          <q-chip
            :class="item.estado ? 'estado-activo' : 'estado-inactivo'"
            :label="item.estado ? 'Activo' : 'Inactivo'"
            dense
          />
        </div>

        <div class="card-body">
          <div class="info-item">
            <q-icon name="description" class="info-icon" />
            <span class="info-label">Descripción:</span>
            <span class="info-value">{{ item.descripcion }}</span>
          </div>
        </div>

        <div class="card-actions">
          <q-btn
            flat
            dense
            class="btn-editar"
            icon="edit"
            label="Editar"
            @click="editarEspecialidad(item)"
            no-caps
          />
          <q-btn
            flat
            dense
            :class="item.estado ? 'btn-inactivar' : 'btn-activar'"
            :icon="item.estado ? 'block' : 'check'"
            :label="item.estado ? 'Desactivar' : 'Activar'"
            @click="cambiarEstado(item)"
            no-caps
          />
        </div>
      </div>

      <div class="add-card" @click="abrirDialogoAgregar">
        <div class="add-content">
          <q-icon name="add_circle" class="add-icon" />
          <p class="add-text">Añadir Especialidad</p>
        </div>
      </div>
    </div>

    <q-dialog v-model="mostrarDialog" persistent>
      <q-card class="dialog-card">
        <q-card-section class="dialog-header">
          <div class="dialog-title">
            {{ formulario.id ? 'Editar Especialidad' : 'Añadir Especialidad' }}
          </div>
        </q-card-section>
        <q-card-section class="dialog-content">
          <q-input
            v-model="formulario.nombre"
            label="Nombre *"
            outlined
            dense
            class="input-field"
            :rules="[(val) => (val && val.length > 0) || 'El nombre es requerido']"
          />
          <q-input
            v-model="formulario.descripcion"
            label="Descripción *"
            outlined
            dense
            type="textarea"
            rows="3"
            class="input-field"
            :rules="[(val) => (val && val.length > 0) || 'La descripción es requerida']"
          />
          <q-toggle
            v-model="formulario.estado"
            :label="formulario.estado ? 'Estado: Activo' : 'Estado: Inactivo'"
            :color="formulario.estado ? 'teal' : 'red'"
            left-label
            class="q-mt-md"
          />
        </q-card-section>
        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="btn-cancelar" />
          <q-btn
            label="Guardar"
            @click="guardarEspecialidad"
            class="btn-guardar"
            :disable="!esFormularioValido"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const $q = useQuasar()
const especialidades = ref([])
const mostrarDialog = ref(false)

const formulario = reactive({
  id: null,
  nombre: '',
  descripcion: '',
  estado: true,
  hospital_id: 1, // Asumimos un ID de hospital fijo
})

const esFormularioValido = computed(() => {
  return formulario.nombre.trim().length >= 3 && formulario.descripcion.trim().length >= 3
})

const cargarEspecialidades = async () => {
  try {
    const { data } = await api.get('/especialidades')
    especialidades.value = data
  } catch (error) {
    console.error('Error al cargar especialidades:', error)
    $q.notify({ type: 'negative', message: 'Error al cargar especialidades' })
  }
}

const abrirDialogoAgregar = () => {
  Object.assign(formulario, {
    id: null,
    nombre: '',
    descripcion: '',
    estado: true,
    hospital_id: 1,
  })
  mostrarDialog.value = true
}

const editarEspecialidad = (especialidad) => {
  Object.assign(formulario, { ...especialidad })
  mostrarDialog.value = true
}

// CORREGIDO: Se mejora el manejo de errores en esta función
const guardarEspecialidad = async () => {
  if (!esFormularioValido.value) return

  try {
    const payload = { ...formulario }
    if (formulario.id) {
      await api.put(`/especialidades/${formulario.id}`, payload)
      $q.notify({ type: 'positive', message: 'Especialidad actualizada' })
    } else {
      await api.post('/especialidades', payload)
      $q.notify({ type: 'positive', message: 'Especialidad creada' })
    }
    mostrarDialog.value = false
    await cargarEspecialidades()
  } catch (error) {
    console.error('Error al guardar especialidad:', error)

    // Lógica mejorada para mostrar errores de validación de Laravel
    if (error.response && error.response.status === 422) {
      const errors = error.response.data.errors
      let errorMessage = 'Por favor, corrige los siguientes errores:'
      // Muestra cada error en una nueva línea
      for (const key in errors) {
        errorMessage += `<br>- ${errors[key][0]}`
      }
      $q.notify({
        type: 'negative',
        message: errorMessage,
        html: true, // Permite que <br> funcione
        timeout: 7000,
      })
    } else {
      // Muestra un error genérico si no es de validación
      $q.notify({ type: 'negative', message: 'Error inesperado al guardar' })
    }
  }
}

const cambiarEstado = async (especialidad) => {
  try {
    await api.delete(`/especialidades/${especialidad.id}`)
    await cargarEspecialidades()
    $q.notify({ type: 'info', message: 'El estado ha sido actualizado.' })
  } catch (error) {
    console.error('Error al cambiar estado:', error)
    $q.notify({ type: 'negative', message: 'Error al cambiar estado' })
  }
}

onMounted(() => {
  cargarEspecialidades()
})
</script>

<style scoped>
/* Tus estilos (no necesitan cambios) */
.salas-container {
  padding: 24px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 0 8px;
  flex-wrap: wrap;
  gap: 12px;
}
.titulo-principal {
  background: linear-gradient(135deg, #0f3027 0%, #082f49 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 900;
  font-size: 1.75rem;
  margin: 0;
}
.btn-agregar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  font-weight: 700;
  padding: 12px 24px;
}
@media (max-width: 600px) {
  .titulo-principal {
    font-size: 1.5rem;
    text-align: center;
    width: 100%;
  }
  .btn-agregar {
    width: 100%;
  }
}
.salas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}
.sala-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ESTILOS DE LA TARJETA (HEADER) */
.card-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sala-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.sala-details {
  display: flex;
  flex-direction: column;
}
.sala-label {
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.8;
  text-transform: uppercase;
  line-height: 1;
}
.sala-nombre {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
}

/* ESTILOS DEL CHIP DE ESTADO */
.estado-activo,
.estado-inactivo {
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 99px;
}
.estado-activo {
  background: rgba(16, 185, 129, 0.8);
}
.estado-inactivo {
  background: rgba(239, 68, 68, 0.8);
}

/* ESTILOS DEL CUERPO Y ACCIONES DE LA TARJETA */
.card-body {
  padding: 20px;
  background: #f8fafc;
  flex-grow: 1;
}
.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.info-label {
  font-weight: 600;
  opacity: 0.8;
}
.info-value {
  flex: 1;
  word-break: break-word;
}
.info-icon {
  margin-top: 2px;
  opacity: 0.7;
}
.card-actions {
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  background: #f8fafc;
}

.btn-editar,
.btn-inactivar,
.btn-activar {
  flex: 1;
  font-weight: 600;
  border-radius: 0px;
  color: white;
  transition: all 0.3s ease;
}
.btn-editar {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
}
.btn-inactivar {
  background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
}
.btn-activar {
  background: linear-gradient(135deg, #065f46 0%, #059669 100%);
}
.btn-editar:hover,
.btn-inactivar:hover,
.btn-activar:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.2);
}

.card-inactivo {
  background-color: #fef2f2;
}
.add-card {
  border: 2px dashed #0d9488;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  cursor: pointer;
  background-color: #f0fdfa;
}
.add-content {
  text-align: center;
  color: #0d9488;
}
.add-icon {
  font-size: 2.5rem;
}
.add-text {
  font-weight: 600;
}

/* ESTILOS DEL MODAL */
.dialog-card {
  width: 90vw;
  max-width: 450px;
  border-radius: 16px;
  overflow: hidden;
}
.dialog-header {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
}
.dialog-title {
  font-size: 1.25rem;
}
.dialog-content {
  padding: 24px;
}
.dialog-actions {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}
.btn-cancelar {
  color: #ef4444;
}
.btn-guardar {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  border-radius: 12px;
  padding: 8px 24px;
}
.btn-guardar:disabled {
  background: #cccccc;
  color: #666666;
}
</style>
