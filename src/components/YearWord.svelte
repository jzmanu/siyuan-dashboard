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
      chart.update();
    }
  }

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [{
            label: '字数统计',
            data: data.values,
            backgroundColor: '#6478FF',
            borderRadius: 4,
            barThickness: 30
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
                font: {
                  family: 'Arial',
                  size: 12
                }
              }
            }
          }
        }
      });
    }

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

<canvas bind:this={canvas}></canvas>

<style>
  canvas {
    width: 100% !important;
    height: 100% !important;
  }
</style> 