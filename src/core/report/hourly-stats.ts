import { sql } from '../../api';
import { Logger } from '../../utils/mlog';

/**
 * get hourly stats by year
 * @author jzman
 * @param year
 * @param notebooksCondition
 * @returns
 */
export async function getHourlyStatsByYear(
  year: number,
  notebooksCondition: string
): Promise<{ hour: number; count: number }[]> {
  try {
    const targetStr = year.toString();
    const sqlStr = `
      select substr(created, 9, 2) as hour, count(*) as count
      from blocks
      where type = "d"
      and created like "${targetStr}%"
      and ${notebooksCondition || '1=1'}
      group by hour
      order by hour
    `;
    Logger.debug(`getHourlyStatsByYear > sqlStr: ${sqlStr}`);
    const res = await sql(sqlStr);
    const stats = res.map((row: any) => ({
      hour: parseInt(row.hour),
      count: row.count
    }));
    Logger.debug(`getHourlyStatsByYear > stats count: ${stats.length}`);
    return stats;
  } catch (err) {
    Logger.error('getHourlyStatsByYear failed: ' + err);
    return [];
  }
}
