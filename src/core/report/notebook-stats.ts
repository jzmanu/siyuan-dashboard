import { sql } from '../../api';
import { Logger } from '../../utils/mlog';

/**
 * get top 3 notebooks by year
 * @author jzman
 * @param year
 * @param notebooksCondition
 * @returns
 */
export async function getTopNotebooksByYear(
  year: number,
  notebooksCondition: string
): Promise<{ box: string; name: string; count: number }[]> {
  try {
    const targetStr = year.toString();
    const sqlStr = `
      select box, count(*) as count
      from blocks
      where type = "d"
      and created like "${targetStr}%"
      and ${notebooksCondition || '1=1'}
      group by box
      order by count desc
      limit 3
    `;
    Logger.debug(`getTopNotebooksByYear > sqlStr: ${sqlStr}`);
    const stats = await sql(sqlStr);

    return stats.map((row: any) => ({
      box: row.box,
      name: row.box,
      count: row.count
    }));
  } catch (err) {
    Logger.error('getTopNotebooksByYear failed: ' + err);
    return [];
  }
}
