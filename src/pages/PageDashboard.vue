<template>
  <q-page padding>
    <div class="q-mb-md">
      <h4 class="text-h4 text-weight-bold q-my-none">Dashboard de Gestión</h4>
      <p class="text-grey-7">Vista consolidada de las operaciones del hospital.</p>
    </div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div v-for="kpi in kpis" :key="kpi.label" class="col-12 col-sm-6 col-md-3">
        <q-card class="kpi-card" flat bordered>
          <q-card-section>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-grey-8 text-subtitle2">{{ kpi.label }}</div>
                <div class="text-h4 text-weight-bold">
                  {{ kpi.value }}<span v-if="kpi.unit" class="text-h6">{{ kpi.unit }}</span>
                </div>
              </div>
              <div class="col-auto">
                <q-icon :name="kpi.icon" :color="kpi.color" size="44px" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-lg-7">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Ocupación por Especialidad</div>
          </q-card-section>
          <q-card-section>
            <vue-apex-charts
              type="bar"
              height="350"
              :options="ocupacionChart.chartOptions"
              :series="ocupacionChart.series"
            />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-5">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Estado General de Camas</div>
          </q-card-section>
          <q-card-section class="flex flex-center">
            <vue-apex-charts
              type="donut"
              height="350"
              :options="estadoCamasChart.chartOptions"
              :series="estadoCamasChart.series"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row">
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Últimos Ingresos</div>
          </q-card-section>
          <q-table
            :rows="ultimosPacientes"
            :columns="columns"
            row-key="ci"
            flat
            :loading="loading"
            no-data-label="No hay ingresos recientes para mostrar."
          >
            <template v-slot:body-cell-paciente="props">
              <q-td :props="props">
                <div class="text-weight-bold">{{ props.row.paciente }}</div>
                <div class="text-grey-8">CI: {{ props.row.ci }}</div>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { api } from 'boot/axios' // ⬅️ Importamos la instancia de Axios configurada
import VueApexCharts from 'vue3-apexcharts'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)

// --- Estado Reactivo para los Datos ---

// KPIs
const kpis = ref([
  { label: 'Pacientes Internados', value: 0, icon: 'fas fa-bed', color: 'primary' },
  { label: 'Tasa de Ocupación', value: 0, unit: '%', icon: 'fas fa-chart-pie', color: 'positive' },
  { label: 'Ingresos (Hoy)', value: 0, icon: 'fas fa-arrow-up', color: 'info' },
  { label: 'Altas (Hoy)', value: 0, icon: 'fas fa-arrow-down', color: 'orange' },
])

// Gráfico de Ocupación por Especialidad
const ocupacionChart = reactive({
  series: [{ name: 'Camas Ocupadas', data: [] }],
  chartOptions: {
    chart: { type: 'bar', height: 350, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, horizontal: true } },
    dataLabels: { enabled: false },
    xaxis: { categories: [] },
    colors: ['#008FFB'],
    tooltip: { y: { formatter: (val) => `${val} camas` } },
  },
})

// Gráfico de Estado de Camas
const estadoCamasChart = reactive({
  series: [],
  chartOptions: {
    chart: { type: 'donut', height: 350 },
    labels: ['Disponibles', 'Ocupadas', 'Mantenimiento'],
    colors: ['#2E93fA', '#F44336', '#FFC107'],
    legend: { position: 'bottom' },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 250 },
          legend: { position: 'bottom' },
        },
      },
    ],
  },
})

// Tabla de Últimos Pacientes
const ultimosPacientes = ref([])
const columns = [
  {
    name: 'paciente',
    required: true,
    label: 'Paciente',
    align: 'left',
    field: 'paciente',
    sortable: true,
  },
  { name: 'motivo', align: 'left', label: 'Motivo de Ingreso', field: 'motivo', sortable: true },
  {
    name: 'diagnostico',
    align: 'left',
    label: 'Diagnóstico Preliminar',
    field: 'diagnostico',
    sortable: true,
  },
  { name: 'cama', align: 'center', label: 'Cama Asignada', field: 'cama' },
]

// --- Funciones para obtener datos de la API ---

async function fetchDashboardData() {
  loading.value = true
  try {
    // Simulamos llamadas a diferentes endpoints de la API
    // En una app real, podrías usar Promise.all para ejecutarlas en paralelo
    const [kpisResponse, ocupacionResponse, camasResponse, pacientesResponse] = await Promise.all([
      api.get('/dashboard/kpis'),
      api.get('/dashboard/ocupacion-especialidad'),
      api.get('/dashboard/estado-camas'),
      api.get('/dashboard/ultimos-ingresos'),
    ])

    // 1. Actualizar KPIs
    const kpisData = kpisResponse.data
    kpis.value[0].value = kpisData.pacientesInternados
    kpis.value[1].value = kpisData.tasaOcupacion
    kpis.value[2].value = kpisData.ingresosHoy
    kpis.value[3].value = kpisData.altasHoy

    // 2. Actualizar gráfico de ocupación
    const ocupacionData = ocupacionResponse.data
    ocupacionChart.series[0].data = ocupacionData.map((item) => item.ocupadas)
    ocupacionChart.chartOptions.xaxis.categories = ocupacionData.map((item) => item.especialidad)

    // 3. Actualizar gráfico de estado de camas
    const camasData = camasResponse.data
    estadoCamasChart.series = [camasData.disponibles, camasData.ocupadas, camasData.mantenimiento]

    // 4. Actualizar tabla de pacientes
    ultimosPacientes.value = pacientesResponse.data
  } catch (error) {
    console.error('Error al cargar los datos del dashboard:', error)
    $q.notify({
      color: 'negative',
      position: 'top',
      message: 'No se pudieron cargar los datos del dashboard. Revisa la conexión con el servidor.',
      icon: 'report_problem',
    })
  } finally {
    loading.value = false
  }
}

// --- Hook del ciclo de vida ---

onMounted(() => {
  fetchDashboardData()
})
</script>

<style lang="scss" scoped>
.kpi-card {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
}
</style>
