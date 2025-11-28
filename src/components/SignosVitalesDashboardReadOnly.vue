<template>
  <div class="signos-vitales-readonly-container">
    <div class="section-header">
      <q-icon name="analytics" size="28px" />
      <span>Monitor de Signos Vitales</span>
    </div>

    <div v-if="!controls || controls.length === 0" class="empty-state">
      <q-icon name="monitor_heart" size="80px" class="empty-icon" />
      <div class="empty-text">
        <h3>Sin registros de signos vitales</h3>
        <p>Aún no se han registrado controles de signos vitales.</p>
      </div>
    </div>

    <template v-else>
      <div class="stats-grid">
        <div
          v-for="(card, index) in statCards"
          :key="card.nombre"
          class="stat-card"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="stat-card-header">
            <q-icon :name="getIconForStat(card.nombre)" size="32px" class="stat-icon" />
          </div>
          <div class="stat-card-body">
            <div class="stat-label">{{ card.nombre }}</div>
            <!-- ✅ MOSTRAR VALOR DUAL SI EXISTE -->
            <div class="stat-value">{{ card.valorFormateado }}</div>
            <div class="stat-unidad">{{ card.unidad }}</div>
            <div class="stat-status" :class="getStatusClass(card.nombre, card.valor, card.valorBajo)">
              {{ getStatusText(card.nombre, card.valor, card.valorBajo) }}
            </div>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div
          v-for="(chart, index) in chartData"
          :key="chart.signoNombre"
          class="chart-card"
          :style="{ animationDelay: `${(statCards.length + index) * 0.1}s` }"
        >
          <div class="chart-card-header">
            <div class="chart-title">
              <q-icon :name="getIconForStat(chart.signoNombre)" size="24px" class="chart-icon" />
              <span>{{ chart.signoNombre }}</span>
            </div>
            <div class="chart-badge">{{ chart.unidad }}</div>
          </div>
          <div class="chart-card-body">
            <vue-apex-charts
              type="line"
              height="280"
              :options="getChartOptions(chart.signoNombre, chart.unidad)"
              :series="chart.series"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { format } from 'date-fns'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  controls: {
    type: Array,
    required: true,
  },
  internacion: {
    type: Object,
    required: true,
  },
})

const rangosNormales = {
  'Frecuencia Cardíaca': { min: 60, max: 100 },
  'Frecuencia Respiratoria': { min: 12, max: 20 },
  'Presión Arterial': { min: 90, max: 120 },
  'Saturación de Oxígeno': { min: 95, max: 100 },
  Temperatura: { min: 36.5, max: 37.5 },
  'Glucosa Capilar': { min: 70, max: 140 },
}

const ejesY = {
  'Frecuencia Cardíaca': { min: 40, max: 180 },
  'Frecuencia Respiratoria': { min: 0, max: 40 },
  'Presión Arterial': { min: 60, max: 200 },
  'Saturación de Oxígeno': { min: 80, max: 101 },
  Temperatura: { min: 30, max: 42 },
  'Glucosa Capilar': { min: 40, max: 250 },
}

function getIconForStat(nombre) {
  const iconMap = {
    'Frecuencia Cardíaca': 'favorite',
    'Frecuencia Respiratoria': 'air',
    'Presión Arterial': 'monitor_heart',
    'Saturación de Oxígeno': 'water_drop',
    Temperatura: 'thermostat',
    'Glucosa Capilar': 'bloodtype',
  }
  return iconMap[nombre] || 'analytics'
}

function getStatusClass(nombre, valor, valorBajo = null) {
  const rango = rangosNormales[nombre]
  if (!rango) return 'status-normal'

  const numValor = parseFloat(valor)

  if (nombre === 'Presión Arterial' && valorBajo) {
    const numValorBajo = parseFloat(valorBajo)
    if (numValor > rango.max || numValorBajo > 80) return 'status-alto'
    if (numValor < rango.min || numValorBajo < 60) return 'status-bajo'
    return 'status-normal'
  }

  if (numValor < rango.min) return 'status-bajo'
  if (numValor > rango.max) return 'status-alto'
  return 'status-normal'
}

function getStatusText(nombre, valor, valorBajo = null) {
  const rango = rangosNormales[nombre]
  if (!rango) return 'Normal'

  const numValor = parseFloat(valor)

  if (nombre === 'Presión Arterial' && valorBajo) {
    const numValorBajo = parseFloat(valorBajo)
    if (numValor > rango.max || numValorBajo > 80) return 'Alto'
    if (numValor < rango.min || numValorBajo < 60) return 'Bajo'
    return 'Normal'
  }

  if (numValor < rango.min) return 'Bajo'
  if (numValor > rango.max) return 'Alto'
  return 'Normal'
}

function getChartOptions(title, unit) {
  const rango = rangosNormales[title]
  const eje = ejesY[title]
  let annotations = {}

  if (rango) {
    annotations = {
      yaxis: [
        {
          y: rango.min,
          y2: rango.max,
          borderColor: '#10b981',
          fillColor: '#10b981',
          opacity: 0.15,
          label: {
            borderColor: '#10b981',
            style: { color: '#fff', background: '#10b981', fontSize: '11px', fontWeight: 600 },
            text: 'Rango Normal',
            position: 'right',
          },
        },
      ],
    }
  }

  return {
    annotations: annotations,
    chart: {
      height: 280,
      type: 'line',
      zoom: { enabled: false },
      toolbar: {
        show: true,
        tools: {
          download: true,
          pan: false,
          zoom: false,
          reset: true,
        },
      },
      fontFamily: 'inherit',
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: ['#10b981'],
    },
    markers: {
      size: 5,
      colors: ['#10b981', '#ef4444'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: { size: 7 },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        formatter: (value) => format(new Date(value), 'dd/MM HH:mm'),
        style: {
          colors: '#64748b',
          fontSize: '11px',
        },
      },
    },
    yaxis: {
      min: eje ? eje.min : undefined,
      max: eje ? eje.max : undefined,
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '11px',
        },
      },
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
    },
    tooltip: {
      x: { formatter: (value) => format(new Date(value), 'dd/MM/yyyy HH:mm') },
      y: {
        formatter: function (value, { dataPointIndex, w }) {
          const dataPoint = w.globals.initialSeries[0].data[dataPointIndex] || {}
          const usuario = dataPoint.user || 'No disponible'
          const rol = dataPoint.rol || ''
          const observacion = dataPoint.observacion
          const valorBajo = dataPoint.valorBajo

          let valorHtml = ''
          if (valorBajo) {
            valorHtml = `<div style="font-size: 18px; font-weight: 700; color: #10b981;">${value}/${valorBajo} <span style="font-size: 12px; color: #64748b;">${unit}</span></div>`
          } else {
            valorHtml = `<div style="font-size: 18px; font-weight: 700; color: #10b981;">${value} <span style="font-size: 12px; color: #64748b;">${unit}</span></div>`
          }

          let observacionHtml = ''
          if (observacion) {
            observacionHtml = `<div style="margin-top: 8px; font-size: 11px; color: #64748b; font-style: italic;">Obs: ${observacion}</div>`
          }

          return `
            <div style="padding: 4px;">
              ${valorHtml}
              <div style="margin-top: 6px; font-size: 11px; color: #64748b;">
                Registrado por: <strong style="color: #1e293b;">${usuario}</strong> (${rol})
              </div>
              ${observacionHtml}
            </div>
          `
        },
      },
      theme: 'light',
    },
    legend: {
      show: false,
    },
  }
}

const latestControl = computed(() => {
  if (!props.controls || props.controls.length === 0) return null
  return props.controls[0]
})

const statCards = computed(() => {
  if (!latestControl.value) return []
  const signosAExcluir = ['Altura', 'Peso']

  return latestControl.value.valores
    .filter((v) => !signosAExcluir.includes(v.signo.nombre))
    .map((v) => {
      let valorFormateado = v.medida
      let valorBajo = null

      if (v.medida_baja) {
        valorFormateado = `${v.medida}/${v.medida_baja}`
        valorBajo = v.medida_baja
      }

      return {
        nombre: v.signo.nombre,
        valor: v.medida,
        valorBajo: valorBajo,
        valorFormateado: valorFormateado,
        unidad: v.signo.unidad,
      }
    })
})

const chartData = computed(() => {
  if (!props.controls || props.controls.length === 0) return []
  const signosAExcluir = ['Altura', 'Peso']
  const dataAgrupada = {}
  const controlesInvertidos = [...props.controls].reverse()

  controlesInvertidos.forEach((control) => {
    if (!control.user) return

    control.valores.forEach((valor) => {
      const nombreSigno = valor.signo.nombre
      if (!dataAgrupada[nombreSigno]) {
        dataAgrupada[nombreSigno] = { data: [], alertPoints: [], unidad: valor.signo.unidad }
      }

      const usuarioNombre = `${control.user.nombre} ${control.user.apellidos}`
      const usuarioRol = control.user.rol ? control.user.rol.nombre : 'Sin Rol'
      const observacion = control.observaciones

      const xValue = new Date(control.fecha_control).getTime()
      const yValue = parseFloat(valor.medida)

      const commonPointData = {
        x: xValue,
        y: yValue,
        user: usuarioNombre,
        rol: usuarioRol,
        observacion: observacion,
        valorBajo: valor.medida_baja ? parseFloat(valor.medida_baja) : null,
      }

      dataAgrupada[nombreSigno].data.push(commonPointData)

      const rango = rangosNormales[nombreSigno]
      if (rango && (yValue < rango.min || yValue > rango.max)) {
        dataAgrupada[nombreSigno].alertPoints.push(commonPointData)
      } else {
        dataAgrupada[nombreSigno].alertPoints.push({ x: xValue, y: null })
      }
    })
  })

  return Object.keys(dataAgrupada)
    .filter((signoNombre) => !signosAExcluir.includes(signoNombre))
    .map((signoNombre) => ({
      signoNombre,
      unidad: dataAgrupada[signoNombre].unidad,
      series: [
        { name: signoNombre, data: dataAgrupada[signoNombre].data },
        { name: 'Alerta', data: dataAgrupada[signoNombre].alertPoints, type: 'scatter' },
      ],
    }))
})
</script>

<style scoped>
/* (Mismo CSS que el componente anterior) */
.signos-vitales-readonly-container {
  width: 100%;
  background: #f8fafc;
  padding: 24px;
  border-radius: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.empty-icon {
  color: #cbd5e1;
  margin-bottom: 24px;
}

.empty-text h3 {
  font-size: 1.5rem;
  color: #475569;
  margin: 0 0 8px 0;
}

.empty-text p {
  color: #94a3b8;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInUp 0.5s ease-out backwards;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
}

.stat-card-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.stat-card-body {
  padding: 20px;
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-unidad {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
  margin-bottom: 12px;
}

.stat-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-normal {
  background: #d1fae5;
  color: #065f46;
}

.status-alto {
  background: #fee2e2;
  color: #991b1b;
}

.status-bajo {
  background: #fef3c7;
  color: #92400e;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.chart-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInUp 0.5s ease-out backwards;
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
}

.chart-card-header {
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
}

.chart-icon {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.chart-badge {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.chart-card-body {
  padding: 24px;
  background: #fafafa;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .signos-vitales-readonly-container {
    padding: 16px;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
