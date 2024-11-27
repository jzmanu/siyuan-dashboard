<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import Chart from 'chart.js/auto';
  
  export let data: {
    labels: string[];
    values: number[];
  };
  
  let canvas: HTMLCanvasElement;
  let chart: Chart;

  function updateChart() {
    if (chart) {
      chart.data.labels = data.labels;
      chart.data.datasets[0].data = data.values;
      chart.update('none');
    }
  }

  onMount(() => {
    chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: '字数统计',
          data: data.values,
          backgroundColor: '#6478FF',
          borderRadius: 4,
          barThickness: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#a1a1b2'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#a1a1b2',
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0
            }
          }
        }
      }
    });

    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  });

  afterUpdate(() => {
    updateChart();
  });
</script>

<div class="chart-container">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
    height: 100%;
    padding-right: 20px;
    box-sizing: border-box;
  }

  canvas {
    width: 100% !important;
    height: 100% !important;
  }
</style> 