<template>
  <q-page class="dashboard-page">
    <!-- Header mejorado con animación de gradiente -->
    <div class="header-section">
      <div class="header-glow"></div>
      <div class="header-content">
        <h1 class="titulo-dashboard">Dashboard de Gestión</h1>
        <p class="subtitulo-dashboard">Vista consolidada de las operaciones del hospital</p>
      </div>
    </div>

    <!-- KPI Cards con efectos mejorados -->
    <div class="kpi-grid">
      <div v-for="(kpi, idx) in kpis" :key="kpi.label" class="kpi-card-wrapper">
        <div class="kpi-card">
          <!-- Gradiente de fondo animado -->
          <div class="kpi-bg-gradient" :class="getGradientClass(kpi.color)"></div>

          <!-- Borde superior con gradiente -->
          <div class="kpi-top-border" :class="getGradientClass(kpi.color)"></div>

          <div class="kpi-content">
            <div class="kpi-info">
              <div class="kpi-text">
                <p class="kpi-label">{{ kpi.label }}</p>
                <div class="kpi-value-container">
                  <span class="kpi-value">{{ kpi.value }}</span>
                  <span v-if="kpi.unit" class="kpi-unit">{{ kpi.unit }}</span>
                </div>
                <!-- Indicador de tendencia (simulado) -->
                <div class="kpi-trend">
                  <q-icon
                    :name="idx % 2 === 0 ? 'trending_up' : 'trending_down'"
                    :class="idx % 2 === 0 ? 'trend-up' : 'trend-down'"
                    size="16px"
                  />
                  <span :class="idx % 2 === 0 ? 'trend-up' : 'trend-down'">
                    {{ Math.floor(Math.random() * 5) + 1 }}%
                  </span>
                  <span class="trend-label">vs ayer</span>
                </div>
              </div>

              <!-- Ícono con efecto mejorado -->
              <div class="kpi-icon-container" :class="getGradientClass(kpi.color)">
                <div class="kpi-icon-overlay"></div>
                <q-icon :name="kpi.icon" size="32px" class="kpi-icon" />
              </div>
            </div>
          </div>

          <!-- Efecto de brillo en hover -->
          <div class="kpi-shine"></div>
        </div>
      </div>
    </div>

    <!-- Gráficos principales -->
    <div class="charts-grid">
      <!-- Gráfico de ocupación -->
      <div class="chart-card chart-card-wide">
        <div class="chart-header">
          <div>
            <h2 class="chart-title">Ocupación por Especialidad</h2>
            <p class="chart-subtitle">Distribución de camas ocupadas</p>
          </div>
          <div class="chart-badge">
            <q-icon name="activity" size="16px" />
            Actualizado
          </div>
        </div>
        <div class="chart-content">
          <vue-apex-charts
            type="bar"
            height="300"
            :options="ocupacionChartOptions"
            :series="ocupacionChart.series"
          />
        </div>
      </div>

      <!-- Gráfico de estado de camas -->
      <div class="chart-card">
        <div class="chart-header">
          <div>
            <h2 class="chart-title">Estado de Camas</h2>
            <p class="chart-subtitle">Vista general del hospital</p>
          </div>
        </div>
        <div class="chart-content">
          <vue-apex-charts
            type="donut"
            height="300"
            :options="estadoCamasChartOptions"
            :series="estadoCamasChart.series"
          />
        </div>
        <!-- Leyenda personalizada -->
        <div class="legend-grid">
          <div v-for="(item, idx) in camasLegend" :key="idx" class="legend-item">
            <div class="legend-info">
              <div class="legend-dot" :style="{ backgroundColor: item.color }"></div>
              <span class="legend-name">{{ item.name }}</span>
            </div>
            <span class="legend-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de últimos ingresos -->
    <div class="table-card">
      <div class="table-header-gradient">
        <h2 class="table-title">
          <q-icon name="people" size="24px" />
          Últimos Ingresos
        </h2>
        <p class="table-subtitle">Registro de pacientes ingresados hoy</p>
      </div>

      <q-table
        :rows="ultimosPacientes"
        :columns="columns"
        row-key="ci"
        flat
        class="modern-table"
        :loading="loading"
        no-data-label="No hay ingresos recientes para mostrar."
        :rows-per-page-options="[10, 20, 50]"
      >
        <template v-slot:body-cell-paciente="props">
          <q-td :props="props" class="paciente-cell">
            <div class="paciente-name">{{ props.row.paciente }}</div>
            <div class="paciente-ci">CI: {{ props.row.ci }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-diagnostico="props">
          <q-td :props="props">
            <span class="diagnostico-badge">
              {{ props.row.diagnostico }}
            </span>
          </q-td>
        </template>

        <template v-slot:body-cell-cama="props">
          <q-td :props="props" class="text-center">
            <span class="cama-badge">
              {{ props.row.cama }}
            </span>
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { api } from 'boot/axios'
import VueApexCharts from 'vue3-apexcharts'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)

// KPIs
const kpis = ref([
  { label: 'Pacientes Internados', value: 0, icon: 'fas fa-bed', color: 'teal' },
  { label: 'Tasa de Ocupación', value: 0, unit: '%', icon: 'fas fa-chart-pie', color: 'emerald' },
  { label: 'Ingresos (Hoy)', value: 0, icon: 'fas fa-arrow-up', color: 'blue' },
  { label: 'Altas (Hoy)', value: 0, icon: 'fas fa-arrow-down', color: 'amber' },
])

// Gráfico de Ocupación por Especialidad
const ocupacionChart = reactive({
  series: [{ name: 'Camas Ocupadas', data: [] }],
})

const ocupacionChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 300,
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
  },
  plotOptions: {
    bar: {
      borderRadius: 8,
      horizontal: true,
      distributed: false,
    },
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: ocupacionChart.series[0].data.map(
      (_, i) => ocupacionChartOptions.value?.xaxis?.categories?.[i] || '',
    ),
    labels: {
      style: {
        colors: '#64748b',
        fontSize: '12px',
        fontWeight: 500,
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: '#64748b',
        fontSize: '12px',
        fontWeight: 500,
      },
    },
  },
  colors: ['#14b8a6'],
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'horizontal',
      shadeIntensity: 0.5,
      gradientToColors: ['#06b6d4'],
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 0.8,
    },
  },
  grid: {
    borderColor: '#e2e8f0',
    strokeDashArray: 3,
  },
  tooltip: {
    y: {
      formatter: (val) => `${val} camas`,
    },
    theme: 'light',
    style: {
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
    },
  },
}))

// Gráfico de Estado de Camas
const estadoCamasChart = reactive({
  series: [],
})

const camasLegend = ref([])

const estadoCamasChartOptions = computed(() => ({
  chart: {
    type: 'donut',
    height: 300,
    fontFamily: 'Inter, sans-serif',
  },
  labels: ['Disponibles', 'Ocupadas', 'Mantenimiento'],
  colors: ['#10b981', '#3b82f6', '#f59e0b'],
  legend: { show: false },
  stroke: {
    width: 0,
  },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        labels: {
          show: false,
        },
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    theme: 'light',
    style: {
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
    },
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: { width: 250 },
      },
    },
  ],
}))

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

// Función para obtener clase de gradiente
const getGradientClass = (color) => {
  const gradients = {
    teal: 'gradient-teal',
    emerald: 'gradient-emerald',
    blue: 'gradient-blue',
    amber: 'gradient-amber',
  }
  return gradients[color] || 'gradient-teal'
}

// Funciones para obtener datos de la API
async function fetchDashboardData() {
  loading.value = true
  try {
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
    ocupacionChartOptions.value.xaxis.categories = ocupacionData.map((item) => item.especialidad)

    // 3. Actualizar gráfico de estado de camas
    const camasData = camasResponse.data
    estadoCamasChart.series = [camasData.disponibles, camasData.ocupadas, camasData.mantenimiento]

    camasLegend.value = [
      { name: 'Disponibles', value: camasData.disponibles, color: '#10b981' },
      { name: 'Ocupadas', value: camasData.ocupadas, color: '#3b82f6' },
      { name: 'Mantenimiento', value: camasData.mantenimiento, color: '#f59e0b' },
    ]

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

onMounted(() => {
  fetchDashboardData()
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  padding: 24px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 50%, #eff6ff 100%);
  min-height: 100vh;
}

// ==================== HEADER ====================
.header-section {
  position: relative;
  margin-bottom: 32px;

  .header-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, #14b8a6, #06b6d4, #3b82f6);
    opacity: 0.1;
    filter: blur(60px);
    pointer-events: none;
  }

  .header-content {
    position: relative;
    z-index: 1;
  }

  .titulo-dashboard {
    font-size: 2.25rem;
    font-weight: 900;
    background: linear-gradient(135deg, #0f766e, #0e7490, #1e40af);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }

  .subtitulo-dashboard {
    color: #64748b;
    font-size: 1.125rem;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;

    .heart-icon {
      color: #ef4444;
      animation: heartbeat 1.5s ease-in-out infinite;
    }
  }
}

@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

// ==================== KPI CARDS ====================
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.kpi-card-wrapper {
  animation: fadeInUp 0.6s ease-out backwards;

  @for $i from 1 through 4 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.1}s;
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kpi-card {
  position: relative;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }

  .kpi-bg-gradient {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.5s ease;

    &.gradient-teal {
      background: linear-gradient(135deg, #14b8a6, #06b6d4);
    }
    &.gradient-emerald {
      background: linear-gradient(135deg, #10b981, #14b8a6);
    }
    &.gradient-blue {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
    }
    &.gradient-amber {
      background: linear-gradient(135deg, #f59e0b, #f97316);
    }
  }

  &:hover .kpi-bg-gradient {
    opacity: 0.08;
  }

  .kpi-top-border {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;

    &.gradient-teal {
      background: linear-gradient(90deg, #14b8a6, #06b6d4);
    }
    &.gradient-emerald {
      background: linear-gradient(90deg, #10b981, #14b8a6);
    }
    &.gradient-blue {
      background: linear-gradient(90deg, #3b82f6, #6366f1);
    }
    &.gradient-amber {
      background: linear-gradient(90deg, #f59e0b, #f97316);
    }
  }

  .kpi-content {
    position: relative;
    padding: 24px;
  }

  .kpi-info {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .kpi-text {
    flex: 1;
  }

  .kpi-label {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }

  .kpi-value-container {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 12px;
  }

  .kpi-value {
    font-size: 2.5rem;
    font-weight: 900;
    color: #1e293b;
    line-height: 1;
  }

  .kpi-unit {
    font-size: 1.5rem;
    font-weight: 700;
    color: #64748b;
  }

  .kpi-trend {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    font-weight: 700;

    .trend-up {
      color: #10b981;
    }

    .trend-down {
      color: #ef4444;
    }

    .trend-label {
      color: #94a3b8;
      font-size: 0.75rem;
      font-weight: 400;
    }
  }

  .kpi-icon-container {
    position: relative;
    padding: 16px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);

    &.gradient-teal {
      background: linear-gradient(135deg, #14b8a6, #06b6d4);
    }
    &.gradient-emerald {
      background: linear-gradient(135deg, #10b981, #14b8a6);
    }
    &.gradient-blue {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
    }
    &.gradient-amber {
      background: linear-gradient(135deg, #f59e0b, #f97316);
    }

    .kpi-icon-overlay {
      position: absolute;
      inset: 0;
      background: white;
      opacity: 0;
      border-radius: 16px;
      transition: opacity 0.5s ease;
    }

    .kpi-icon {
      position: relative;
      z-index: 1;
      color: white;
    }
  }

  &:hover .kpi-icon-container {
    transform: scale(1.1) rotate(6deg);
  }

  &:hover .kpi-icon-overlay {
    opacity: 0.2;
  }

  .kpi-shine {
    position: absolute;
    inset: 0;
    opacity: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transform: skewX(-12deg) translateX(-100%);
    transition: opacity 0.5s ease;
  }

  &:hover .kpi-shine {
    opacity: 1;
    animation: shine 1s ease;
  }
}

@keyframes shine {
  to {
    transform: skewX(-12deg) translateX(200%);
  }
}

// ==================== CHARTS ====================
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.chart-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  padding: 24px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }

  &.chart-card-wide {
    grid-column: span 2;

    @media (max-width: 1024px) {
      grid-column: span 1;
    }
  }

  .chart-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 16px;
    flex-wrap: wrap;
  }

  .chart-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 4px 0;
  }

  .chart-subtitle {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0;
  }

  .chart-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #14b8a6, #06b6d4);
    color: white;
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  }

  .chart-content {
    margin-top: 16px;
  }
}

// Leyenda personalizada
.legend-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
  }

  .legend-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .legend-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
  }

  .legend-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
  }
}

// ==================== TABLE ====================
.table-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }

  .table-header-gradient {
    background: linear-gradient(135deg, #0f766e, #0e7490);
    padding: 24px;
    color: white;
  }

  .table-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .table-subtitle {
    font-size: 0.875rem;
    margin: 0;
    opacity: 0.9;
  }
}

.modern-table {
  :deep(thead) {
    tr {
      background: #f8fafc;
    }

    th {
      font-weight: 700;
      color: #475569;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 16px;
    }
  }

  :deep(tbody) {
    tr {
      transition: all 0.2s ease;
      border-bottom: 1px solid #f1f5f9;

      &:hover {
        background: #f0fdfa;
      }
    }

    td {
      padding: 16px;
    }
  }

  .paciente-cell {
    .paciente-name {
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
      transition: color 0.2s ease;
    }

    .paciente-ci {
      font-size: 0.875rem;
      color: #64748b;
    }
  }

  tr:hover .paciente-name {
    color: #0f766e;
  }

  .diagnostico-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .cama-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    height: 32px;
    padding: 0 12px;
    background: linear-gradient(135deg, #14b8a6, #06b6d4);
    color: white;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.875rem;
    box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);
  }
}

// ==================== RESPONSIVE ====================
@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
  }

  .header-section {
    .titulo-dashboard {
      font-size: 1.75rem;
    }

    .subtitulo-dashboard {
      font-size: 1rem;
    }
  }

  .kpi-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .charts-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .chart-card.chart-card-wide {
    grid-column: span 1;
  }

  .modern-table {
    font-size: 0.875rem;
  }
}
</style>
