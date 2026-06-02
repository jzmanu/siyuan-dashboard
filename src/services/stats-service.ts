import { getUseSiYuanDays, getRealUseSiYuanDays } from '../core/day-count';
import { getDocCountAll } from '../core/doc-count';
import { getWordCountByYearData, getMonthWordCountData, getWeekWordCountData, getActualWordCountByYearData, getActualMonthWordCountData, getActualWeekWordCountData, getWordCountTotal } from '../core/word-count';
import { getCodeBlockCount, getCodeLinesCount } from '../core/code-count';
import { getTagCountTotal } from '../core/tag-counts';
import { Logger } from '../utils/mlog';
import type DashboardPlugin from '../index';

export interface Stats {
  days: number;
  daysPercent: number;
  documents: number;
  words: number;
  codeBlocks: number;
  codeLines: number;
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
    const config = plugin.statsToggleConfig;

    const [days, realDays, docCount, tagCount] = await Promise.all([
      getUseSiYuanDays(plugin),
      getRealUseSiYuanDays(plugin),
      getDocCountAll(plugin),
      getTagCountTotal(plugin)
    ]);

    const wordCount = await getWordCountTotal(plugin);

    let [codeBlocks, codeLines] = [0, 0];
    if (config.enableCodeStats) {
      [codeBlocks, codeLines] = await Promise.all([
        getCodeBlockCount(plugin),
        getCodeLinesCount(plugin)
      ]);
    }

    let percent = days === 0 ? 0 : Math.round((realDays / days) * 100);
    return {
      days: realDays,
      daysPercent: percent,
      documents: docCount,
      words: wordCount,
      codeBlocks,
      codeLines,
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
  const useActualWordCount = plugin.statsToggleConfig.enableWordCount;
  return {
    getYearData: async (year: number) => {
      try {
        return useActualWordCount
          ? await getActualWordCountByYearData(year, plugin)
          : await getWordCountByYearData(year, plugin);
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
        return useActualWordCount
          ? await getActualMonthWordCountData(year, month, plugin)
          : await getMonthWordCountData(year, month, plugin);
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
        return useActualWordCount
          ? await getActualWeekWordCountData(plugin)
          : await getWeekWordCountData(plugin);
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