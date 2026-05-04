import { Logger } from '../../utils/mlog';
import DashboardPlugin from '../../index';
import { getWordCountByYear } from '../word-count';
import { getActiveDaysByYear, calculateLongestStreak, calculateAllStreaks } from '../day-count';
import { getHourlyStatsByYear } from './hourly-stats';
import { getTopNotebooksByYear } from './notebook-stats';
import {
  getStayUpLateRecordsByYear,
  getStayUpLateUpdatedRecordsByYear,
  getStayUpLateCreatedCountByYear,
  getStayUpLateUpdatedCountByYear,
  calculateStayUpLateComparison
} from './stay-up-late-records';
import { getBlockCountByYear } from './block-count';
import { analyzeRecordRhythm } from './rhythm-analyzer';
import { lsNotebooks } from '../../api';
import type { Report } from '../../types/report';

/**
 * compose report data by year
 * @author jzman
 * @param year
 * @param plugin
 * @returns
 */
export async function composeReportData(
  year: number,
  plugin: DashboardPlugin
): Promise<Report | null> {
  try {
    const notebooksCondition = await plugin.getNotebooksCondition();

    // Parallel data fetching
    const [
      activeDates,
      hourlyStats,
      topNotebooks,
      nightCreatedRecords,
      nightUpdatedRecords,
      nightCreatedCount,
      nightUpdatedCount,
      lastYearCreatedCount,
      lastYearUpdatedCount,
      totalBlocks,
      totalWords
    ] = await Promise.all([
      getActiveDaysByYear(year, notebooksCondition),
      getHourlyStatsByYear(year, notebooksCondition),
      getTopNotebooksByYear(year, notebooksCondition),
      getStayUpLateRecordsByYear(year, notebooksCondition),
      getStayUpLateUpdatedRecordsByYear(year, notebooksCondition),
      getStayUpLateCreatedCountByYear(year, notebooksCondition),
      getStayUpLateUpdatedCountByYear(year, notebooksCondition),
      getStayUpLateCreatedCountByYear(year - 1, notebooksCondition),
      getStayUpLateUpdatedCountByYear(year - 1, notebooksCondition),
      getBlockCountByYear(year, notebooksCondition),
      getWordCountByYear(year, plugin)
    ]);

    // Calculate derived metrics
    const longestStreak = calculateLongestStreak(activeDates);
    const allStreaks = calculateAllStreaks(activeDates, 3); // 获取所有≥3天的连续段
    const rhythmType: any = analyzeRecordRhythm(hourlyStats);
    const avgWordsPerDay = activeDates.length > 0 ? Math.round(totalWords / activeDates.length) : 0;

    // Get notebook names
    const notebooksRes = await lsNotebooks();
    const notebookMap = new Map(notebooksRes.notebooks.map((nb: any) => [nb.id, nb.name]));

    // Calculate notebook percentages with real names
    const totalCount = topNotebooks.reduce((sum: number, nb: any) => sum + nb.count, 0);
    const notebooksWithPercentage = topNotebooks.map((nb: any) => ({
      name: notebookMap.get(nb.box) || nb.name,
      count: nb.count,
      percentage: totalCount > 0 ? Math.round((nb.count / totalCount) * 100) : 0
    }));

    // Analyze stay up late record
    const stayUpLateRecord = analyzeStayUpLateRecord(
      nightCreatedRecords,
      nightUpdatedRecords,
      nightCreatedCount,
      nightUpdatedCount,
      lastYearCreatedCount,
      lastYearUpdatedCount
    );

    const report: Report = {
      year,
      activeDays: activeDates.length,
      longestStreak,
      totalBlocks,
      totalWords,
      avgWordsPerDay,
      rhythmType,
      hourlyStats,
      topNotebooks: notebooksWithPercentage,
      stayUpLateRecord,
      allStreaks // 新增: 所有连续时间段(≥3天)
    };

    Logger.debug(`composeReportData > report for year ${year} completed`);
    return report;
  } catch (err) {
    Logger.error('composeReportData failed: ' + err);
    return null;
  }
}

/**
 * analyze stay up late records
 * @author jzman
 * @param createdRecords
 * @param updatedRecords
 * @param createdCount
 * @param updatedCount
 * @param lastYearCreatedCount 去年创建次数
 * @param lastYearUpdatedCount 去年更新次数
 * @returns
 */
function analyzeStayUpLateRecord(
  createdRecords: any[],
  updatedRecords: any[],
  createdCount: number,
  updatedCount: number,
  lastYearCreatedCount?: number,
  lastYearUpdatedCount?: number
): any {
  const hasCreated = createdRecords && createdRecords.length > 0 && createdCount > 0;
  const hasUpdated = updatedRecords && updatedRecords.length > 0 && updatedCount > 0;

  if (!hasCreated && !hasUpdated) {
    return {
      hasLateRecord: false,
      createdRecords: [],
      updatedRecords: [],
      createdMessage: '这一年，你没有在凌晨创建文档。早睡早起身体好！🌞',
      updatedMessage: '这一年，你没有在凌晨更新文档。早睡早起身体好！🌞'
    };
  }

  // 处理创建记录
  const processedCreated = hasCreated ? createdRecords.map((record) => ({
    ...formatRecord(record.created, record.content),
    recordType: 'created' as const
  })) : [];

  // 处理更新记录
  const processedUpdated = hasUpdated ? updatedRecords.map((record) => ({
    ...formatRecord(record.updated, record.content),
    recordType: 'updated' as const
  })) : [];

  // 生成各自的总结文案（使用全部次数）
  const createdMessage = hasCreated
    ? `这一年，你有 ${createdCount} 次在凌晨创建文档。`
    : '这一年，你没有在凌晨创建文档。';

  const updatedMessage = hasUpdated
    ? `这一年，你有 ${updatedCount} 次在凌晨更新文档。`
    : '这一年，你没有在凌晨更新文档。';

  // 计算对比数据
  const comparison = calculateStayUpLateComparison(
    createdCount,
    updatedCount,
    lastYearCreatedCount || 0,
    lastYearUpdatedCount || 0
  );

  return {
    hasLateRecord: true,
    createdRecords: processedCreated,
    updatedRecords: processedUpdated,
    createdMessage,
    updatedMessage,
    comparison
  };
}

/**
 * format record datetime and extract title
 * @author jzman
 * @param timeStr
 * @param content
 * @returns
 */
function formatRecord(timeStr: string, content: string) {
  // 提取日期时间并格式化
  const dateStr = timeStr.substring(0, 8);
  const timeOnly = timeStr.substring(8, 12);
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));
  const hour = parseInt(timeOnly.substring(0, 2));
  const minute = parseInt(timeOnly.substring(2, 4));

  return {
    date: dateStr,
    time: timeOnly,
    title: extractTitle(content) || undefined,
    content: content?.substring(0, 100),
    formattedDateTime: `${month}月${day}日 凌晨${hour}:${minute.toString().padStart(2, '0')}`
  };
}

/**
 * extract title from content
 * @author jzman
 * @param content
 * @returns
 */
function extractTitle(content: string): string | null {
  if (!content) return null;

  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Remove markdown heading symbols
    const title = firstLine.replace(/^#+\s*/, '').trim();
    // Limit title length
    if (title.length > 0 && title.length < 100) {
      return title.substring(0, 50);
    }
  }
  return null;
}
