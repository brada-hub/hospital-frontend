<template>
  <div>
    <div class="row q-col-gutter-md q-mb-lg">
      <div v-for="card in statCards" :key="card.nombre" class="col-12 col-sm-6 col-md-4 col-lg-2">
        <q-card flat bordered class="stat-card">
          <q-card-section>
            <div class="stat-label">{{ card.nombre }}</div>
            <div class="stat-value">{{ card.valor }}</div>
            <div class="stat-unidad">{{ card.unidad }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div v-for="chart in chartData" :key="chart.signoNombre" class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium">{{ chart.signoNombre }}</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <vue-apex-charts
              type="line"
              height="250"
              :options="getChartOptions(chart.signoNombre, chart.unidad)"
              :series="chart.series"
            ></vue-apex-charts>
          </q-card-section>
        </q-card>
      </div>
    </div>
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
})

const rangosNormales = {
  'Frecuencia Cardíaca': { min: 60, max: 100 },
  'Frecuencia Respiratoria': { min: 12, max: 20 },
  'Presión Arterial': { min: 90, max: 120 }, // Asumiendo solo la Sistólica
  'Saturación de Oxígeno': { min: 95, max: 100 },
  Temperatura: { min: 36.5, max: 37.5 },
  'Glucosa Capilar': { min: 70, max: 140 },
}

const ejesY = {
  'Frecuencia Cardíaca': { min: 40, max: 180 },
  'Frecuencia Respiratoria': { min: 0, max: 40 },
  'Presión Arterial': { min: 60, max: 200 },
  'Saturación de Oxígeno': { min: 80, max: 101 }, // Ajustado para ver valores críticos
  Temperatura: { min: 30, max: 42 }, // Ajustado para ver valores críticos
  'Glucosa Capilar': { min: 40, max: 250 },
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
          borderColor: '#000',
          fillColor: '#00E396',
          opacity: 0.2,
          label: {
            borderColor: '#00E396',
            style: { color: '#fff', background: '#00E396' },
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
      height: 250,
      type: 'line',
      zoom: { enabled: false },
      toolbar: { show: true, tools: { download: true, pan: false, zoom: false, reset: true } },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3, colors: ['#2196F3'] }, // La línea principal siempre azul
    markers: {
      size: 5,
      colors: ['#2196F3', '#F44336'], // Primer color para la serie principal, segundo para la de alerta
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: { size: 7 },
    },
    xaxis: {
      type: 'datetime',
      labels: { formatter: (value) => format(new Date(value), 'dd/MM HH:mm') },
    },
    yaxis: {
      min: eje ? eje.min : undefined,
      max: eje ? eje.max : undefined,
    },
    tooltip: {
      x: { formatter: (value) => format(new Date(value), 'dd/MM/yyyy HH:mm') },
      y: {
        formatter: function (value, { dataPointIndex, w }) {
          // Asegúrate de tomar los datos de la primera serie (la línea principal) para el tooltip
          const dataPoint = w.globals.initialSeries[0].data[dataPointIndex] || {}
          const usuario = dataPoint.user || 'No disponible'
          const rol = dataPoint.rol || ''
          const observacion = dataPoint.observacion

          let observacionHtml = ''
          if (observacion) {
            observacionHtml = `<div class="q-mt-sm text-caption text-grey-8" style="font-style: italic;">Obs: ${observacion}</div>`
          }

          return `
            <div>
              <span class="text-h6">${value}</span> <span class="text-grey-7">${unit}</span>
              <div class="q-mt-xs text-caption text-grey-8">
                Registrado por: <strong>${usuario}</strong> (${rol})
              </div>
              ${observacionHtml}
            </div>
          `
        },
      },
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
    .map((v) => ({ nombre: v.signo.nombre, valor: v.medida, unidad: v.signo.unidad }))
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
        // Ahora tendremos dos arrays de datos: uno para la línea y otro para los puntos de alerta
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
      }

      // Siempre añadir a la serie de la línea principal
      dataAgrupada[nombreSigno].data.push(commonPointData)

      // Si el valor está fuera de rango, añadir a la serie de puntos de alerta
      const rango = rangosNormales[nombreSigno]
      if (rango && (yValue < rango.min || yValue > rango.max)) {
        dataAgrupada[nombreSigno].alertPoints.push(commonPointData)
      } else {
        // Si está dentro de rango, añadimos un punto con y: null para que no se dibuje el marcador rojo
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
        { name: signoNombre, data: dataAgrupada[signoNombre].data }, // Serie de la línea (azul)
        { name: 'Alerta', data: dataAgrupada[signoNombre].alertPoints, type: 'scatter' }, // Serie de puntos de alerta (rojos)
      ],
    }))
})
</script>

<style scoped>
.stat-card {
  text-align: center;
  border-left: 4px solid var(--q-primary);
  height: 100%;
}
.stat-label {
  font-size: 0.8rem;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: 500;
}
.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1.2;
  color: #343a40;
}
.stat-unidad {
  font-size: 0.9rem;
  color: #6c757d;
}
</style>
