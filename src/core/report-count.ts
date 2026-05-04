/**
 * Report Data Collection
 * @author jzman
 */

export { getActiveDaysByYear, calculateLongestStreak, calculateAllStreaks } from './day-count';
export { getHourlyStatsByYear } from './report/hourly-stats';
export { getTopNotebooksByYear } from './report/notebook-stats';
export {
  getStayUpLateRecordsByYear,
  getStayUpLateUpdatedRecordsByYear,
  getStayUpLateCreatedCountByYear,
  getStayUpLateUpdatedCountByYear
} from './report/stay-up-late-records';
export { getBlockCountByYear } from './report/block-count';
export { analyzeRecordRhythm } from './report/rhythm-analyzer';
export { composeReportData } from './report/report-composer';
export {
  transformStreaksToHeatmapData,
  getMonthLabels,
  getCategoryLabels,
  calculateCategoryStats
} from './report/streak-heatmap';
export { STREAK_CATEGORIES, getCategoryByDays, getCategoryIndex } from './report/streak-categories';

export type { Report } from '../types/report';
export type { HeatmapDataPoint } from './report/streak-heatmap';
export type { StreakCategory } from './report/streak-categories';
