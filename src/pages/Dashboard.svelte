<script lang="ts">
  import DashboardHome from './HomePage.svelte';
  import { getUseSiYuanDays, getRealUseSiYuanDays } from '../core/day-count';
  import { getDocCountAll } from '../core/doc-count';
  import { getMonthWordCountData, getWeekWordCountData, getWordCountALl, getWordCountByYearData } from '../core/word-count';
  import { getTagCountTotal } from '../core/tag-counts';
  import { Logger } from '@/utils/mlog';
  import DashboardPlugin from '../index';
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
      const [days, realDays, docCount, wordCount, tagCount] = await Promise.all([
        getUseSiYuanDays(),
        getRealUseSiYuanDays(),
        getDocCountAll(plugin),
        getWordCountALl(plugin),
        getTagCountTotal(plugin)
      ]);
      
      stats = {
        days: realDays,
        daysPercent: Math.round((realDays / days) * 100),
        documents: docCount,
        words: wordCount,
        tags: tagCount
      };
    } catch (err) {
      Logger.error('get word count error'+ err);
    }
  })();

  async function getYearData(year: number) {
    try {
      return await getWordCountByYearData(year, plugin);
    } catch (err) {
      Logger.error('get year data error'+ err);
      return {
        labels: [
          plugin.i18n.January, 
          plugin.i18n.February, 
          plugin.i18n.March, 
          plugin.i18n.April, 
          plugin.i18n.May, 
          plugin.i18n.June, 
          plugin.i18n.July, 
          plugin.i18n.August, 
          plugin.i18n.September, 
          plugin.i18n.October, 
          plugin.i18n.November, 
          plugin.i18n.December
        ],
        values: new Array(12).fill(0)
      };
    }
  }

  async function getMonthData(year: number, month: number) {
    try {
      return await getMonthWordCountData(year,month);
    } catch (err) {
      Logger.error('getMonthData failed:'+ err);
        const daysInMonth = new Date(year, month, 0).getDate();
        return {
            labels: Array.from({length: daysInMonth}, (_, i) => `${i + 1}`),
            values: new Array(daysInMonth).fill(0)
        };
    }
  }

  async function getWeekData() {
    try {
      return await getWeekWordCountData(plugin);
    } catch (err) {
      Logger.error('getWeekData failed:'+ err);
      return {
            labels: [
              plugin.i18n.mondays, 
              plugin.i18n.tuesdays, 
              plugin.i18n.wednesdays, 
              plugin.i18n.thursdays, 
              plugin.i18n.fridays, 
              plugin.i18n.saturdays, 
              plugin.i18n.sundays
            ],
            values: new Array(7).fill(0)
        };
    }
  }
  
  const wordStatisticsData = {
    getYearData,
    getMonthData,
    getWeekData
  };
</script>

<DashboardHome 
  plugin={plugin}
  stats={stats} 
  data={wordStatisticsData} 
/>