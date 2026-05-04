import { Logger } from '../../utils/mlog';

/**
 * analyze record rhythm type
 * @author jzman
 * @param hourlyStats
 * @returns
 */
export function analyzeRecordRhythm(
  hourlyStats: { hour: number; count: number }[]
): string {
  try {
    if (!hourlyStats || hourlyStats.length === 0) {
      return '稳定型记录者';
    }

    const peakHour = hourlyStats.reduce((max, stat) =>
      stat.count > max.count ? stat : max
    , hourlyStats[0]).hour;

    if (peakHour >= 22 || peakHour <= 5) return '夜猫型记录者';
    if (peakHour >= 6 && peakHour <= 9) return '早起型记录者';
    if (peakHour >= 9 && peakHour <= 17) return '工作型记录者';

    const counts = hourlyStats.map(s => s.count);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, count) =>
      sum + Math.pow(count - mean, 2), 0) / counts.length;

    if (variance < mean * 0.5) return '稳定型记录者';

    return '碎片型记录者';
  } catch (err) {
    Logger.error('analyzeRecordRhythm failed: ' + err);
    return '稳定型记录者';
  }
}
