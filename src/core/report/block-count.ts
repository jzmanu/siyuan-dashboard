import { sql } from '../../api';
import { Logger } from '../../utils/mlog';

/**
 * get block count by year
 * @author jzman
 * @param year
 * @param notebooksCondition
 * @returns
 */
export async function getBlockCountByYear(
  year: number,
  notebooksCondition: string
): Promise<number> {
  try {
    const targetStr = year.toString();
    const sqlStr = `
      select count(*) as total
      from blocks
      where created like "${targetStr}%"
      and ${notebooksCondition || '1=1'}
    `;
    Logger.debug(`getBlockCountByYear > sqlStr: ${sqlStr}`);
    const res = await sql(sqlStr);
    const count = res[0]?.total || 0;
    Logger.debug(`getBlockCountByYear > count: ${count}`);
    return count;
  } catch (err) {
    Logger.error('getBlockCountByYear failed: ' + err);
    return 0;
  }
}
