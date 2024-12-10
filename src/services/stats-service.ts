import { getUseSiYuanDays, getRealUseSiYuanDays } from '../core/day-count';
import { getDocCountAll } from '../core/doc-count';
import { getWordCountALl, getWordCountByYearData, getMonthWordCountData, getWeekWordCountData } from '../core/word-count';
import { getTagCountTotal } from '../core/tag-counts';
import { Logger } from '../utils/mlog';
import type DashboardPlugin from '../index';

export interface Stats {
  days: number;
  daysPercent: number;
  documents: number;
  words: number;
  tags: number;
}

export interface WordStatisticsData {
  getYearData: (year: number) => Promise<{
    labels: string[];
    values: number[];
  }>;
  getMonthData: (year: number, month: number) => Promise<{
    labels: string[];
    values: number[];
  }>;
  getWeekData: () => Promise<{
    labels: string[];
    values: number[];
  }>;
}

/**
 * get base statistics data
 */
export async function getBaseStatisticsData(plugin: DashboardPlugin): Promise<Stats> {
  try {
    const [days, realDays, docCount, wordCount, tagCount] = await Promise.all([
      getUseSiYuanDays(plugin),
      getRealUseSiYuanDays(plugin),
      getDocCountAll(plugin),
      getWordCountALl(plugin),
      getTagCountTotal(plugin)
    ]);
    let percent = Math.round((realDays / days) * 100);
    if(days == 0){
      percent = 0;
    }
    return {
      days: realDays,
      daysPercent: percent,
      documents: docCount,
      words: wordCount,
      tags: tagCount
    };
  } catch (err) {
    Logger.error('getStatsService > Failed to get statistics: ' + err);
    throw err;
  }
}

/**
 * 获取字数统计数据服务
 */
export function getWordStatisticsData(plugin: DashboardPlugin): WordStatisticsData {
  return {
    getYearData: async (year: number) => {
      try {
        return await getWordCountByYearData(year, plugin);
      } catch (err) {
        Logger.error('getWordStatisticsData > Failed to get year data: ' + err);
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
    },
    getMonthData: async (year: number, month: number) => {
      try {
        return await getMonthWordCountData(year, month, plugin);
      } catch (err) {
        Logger.error('getWordStatisticsData > Failed to get month data: ' + err);
        const daysInMonth = new Date(year, month, 0).getDate();
        return {
          labels: Array.from({length: daysInMonth}, (_, i) => `${i + 1}`),
          values: new Array(daysInMonth).fill(0)
        };
      }
    },
    getWeekData: async () => {
      try {
        return await getWeekWordCountData(plugin);
      } catch (err) {
        Logger.error('getWordStatisticsData > Failed to get week data: ' + err);
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
  };
} 