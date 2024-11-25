<script lang="ts">
  import DashboardHome from './HomePage.svelte';
  import { getUseSiYuanDays, getRealUseSiYuanDays } from '../core/day-count';
  import { getDocCountAll } from '../core/doc-count';
  import { getMonthWordCountData, getWeekWordCountData, getWordCountALl, getWordCountByYearData } from '../core/word-count';
  import { getTagCountTotal } from '../core/tag-counts';
  import { Logger } from '@/utils/mlog';
  
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
        getDocCountAll(),
        getWordCountALl(),
        getTagCountTotal()
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
      return await getWordCountByYearData(year);
    } catch (err) {
      Logger.error('get year data error'+ err);
      return {
        labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
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
      return await getWeekWordCountData();
    } catch (err) {
      Logger.error('getWeekData failed:'+ err);
      return {
            labels: ['一', '二', '三', '四', '五', '六', '日'],
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

<DashboardHome {stats} data={wordStatisticsData} />
