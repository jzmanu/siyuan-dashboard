<script lang="ts">
  import { getBaseStatisticsData, getWordStatisticsData } from '../services/stats-service';
  import { Logger } from '../utils/mlog';
  import DashboardPlugin from '../index';
  import DashboardHome from './HomePage.svelte';
  export let plugin: DashboardPlugin; 
  let stats = {
    days: 0,
    daysPercent: 0,
    documents: 0,
    words: 0,
    tags: 0
  };

  (async () => {
    try {
      stats = await getBaseStatisticsData(plugin);
    } catch (err) {
      Logger.error('get word count error'+ err);
    }
  })();
  let wordStatisticsData = getWordStatisticsData(plugin);

  async function refreshData() {
      try {
        stats = await getBaseStatisticsData(plugin);
        wordStatisticsData = getWordStatisticsData(plugin);
      } catch (err) {
        Logger.error('refreshData > refresh data error: ' + err);
      }
  }
</script>

<DashboardHome 
  plugin={plugin}
  stats={stats} 
  data={wordStatisticsData} 
  on:event-notebook-selection-closed={refreshData}
/>