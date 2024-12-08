<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import DashboardPlugin from '../index';
  export let plugin: DashboardPlugin; 
  export let data = {
    labels: [
      plugin.i18n.mondays, 
      plugin.i18n.tuesdays, 
      plugin.i18n.wednesdays, 
      plugin.i18n.thursdays, 
      plugin.i18n.fridays, 
      plugin.i18n.saturdays, 
      plugin.i18n.sundays
    ],
    values: [150, 180, 220, 190, 170, 250, 200]
  };
  
  let canvas: HTMLCanvasElement;
  let chart: Chart;

  $: if (data && chart) {
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.values;
    chart.update();
  }

  onMount(() => {
    chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: plugin.i18n.wordStats,
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