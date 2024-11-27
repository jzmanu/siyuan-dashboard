<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  
  export let data = {
    labels: ['一', '二', '三', '四', '五', '六', '日'],
    values: [150, 180, 220, 190, 170, 250, 200]
  };
  
  let canvas: HTMLCanvasElement;
  let chart: Chart;

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
          barThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
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
              color: '#a1a1b2'
            }
          }
        }
      }
    });

    return () => {
      chart.destroy();
    };
  });
</script>

<canvas bind:this={canvas}></canvas> 