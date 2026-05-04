import { sql } from '../../api';
import { Logger } from '../../utils/mlog';
import type { StayUpLateComparison } from '../../types/report';

/**
 * get stay up late records by year (records created between 0-6 AM)
 * @author jzman
 * @param year
 * @param notebooksCondition
 * @returns
 */
export async function getStayUpLateRecordsByYear(
  year: number,
  notebooksCondition: string
): Promise<{ id: string; content: string; created: string; hpath: string }[]> {
  try {
    const targetStr = year.toString();
    const sqlStr = `
      select id, content, created, hpath
      from blocks
      where type = "d"
      and created like "${targetStr}%"
      and substr(created, 9, 2) between "00" and "04"
      and ${notebooksCondition || '1=1'}
      order by created desc
      limit 10
    `;
    Logger.debug(`getStayUpLateRecordsByYear > sqlStr: ${sqlStr}`);
    const res = await sql(sqlStr);
    Logger.debug(`getStayUpLateRecordsByYear > records count: ${res.length}`);
    res.forEach((record, index) => {
      Logger.debug(`getStayUpLateRecordsByYear > record ${index}: ${JSON.stringify(record)}`);
    });
    return res;
  } catch (err) {
    Logger.error('getStayUpLateRecordsByYear failed: ' + err);
    return [];
  }
}

/**
 * get stay up late created count by year (total count, not limited)
 * @author jzman
 * @param year
 * @param notebooksCondition
 * @returns
 */
export async function getStayUpLateCreatedCountByYear(
  year: number,
  notebooksCondition: string
): Promise<number> {
  try {
    const targetStr = year.toString();
    const sqlStr = `
      select count(*) as total
      from blocks
      where type = "d"
      and created like "${targetStr}%"
      and substr(created, 9, 2) between "00" and "04"
      and ${notebooksCondition || '1=1'}
    `;
    Logger.debug(`getStayUpLateCreatedCountByYear > sqlStr: ${sqlStr}`);
    const res = await sql(sqlStr);
    const count = res[0]?.total || 0;
    Logger.debug(`getStayUpLateCreatedCountByYear > count: ${count}`);
    return count;
  } catch (err) {
    Logger.error('getStayUpLateCreatedCountByYear failed: ' + err);
    return 0;
  }
}

/**
 * get stay up late updated count by year (total count, not limited)
 * @author jzman
 * @param year
 * @param notebooksCondition
 * @returns
 */
export async function getStayUpLateUpdatedCountByYear(
  year: number,
  notebooksCondition: string
): Promise<number> {
  try {
    const targetStr = year.toString();
    const sqlStr = `
      select count(*) as total
      from blocks
      where type = "d"
      and updated like "${targetStr}%"
      and substr(updated, 9, 2) between "00" and "04"
      and ${notebooksCondition || '1=1'}
    `;
    Logger.debug(`getStayUpLateUpdatedCountByYear > sqlStr: ${sqlStr}`);
    const res = await sql(sqlStr);
    const count = res[0]?.total || 0;
    Logger.debug(`getStayUpLateUpdatedCountByYear > count: ${count}`);
    return count;
  } catch (err) {
    Logger.error('getStayUpLateUpdatedCountByYear failed: ' + err);
    return 0;
  }
}

/**
 * get stay up late updated records by year (limited to 10)
 * @author jzman
 * @param year
 * @param notebooksCondition
 * @returns
 */
export async function getStayUpLateUpdatedRecordsByYear(
  year: number,
  notebooksCondition: string
): Promise<{ id: string; content: string; updated: string; hpath: string }[]> {
  try {
    const targetStr = year.toString();
    const sqlStr = `
      select id, content, updated, hpath
      from blocks
      where type = "d"
      and updated like "${targetStr}%"
      and substr(updated, 9, 2) between "00" and "04"
      and ${notebooksCondition || '1=1'}
      order by updated desc
      limit 10
    `;
    Logger.debug(`getStayUpLateUpdatedRecordsByYear > sqlStr: ${sqlStr}`);
    const res = await sql(sqlStr);
    Logger.debug(`getStayUpLateUpdatedRecordsByYear > records count: ${res.length}`);
    res.forEach((record, index) => {
      Logger.debug(`getStayUpLateUpdatedRecordsByYear > record ${index}: ${JSON.stringify(record)}`);
    });
    return res;
  } catch (err) {
    Logger.error('getStayUpLateUpdatedRecordsByYear failed: ' + err);
    return [];
  }
}

/**
 * calculate stay up late comparison between two years
 * @author jzman
 * @param currentCreated 当前年凌晨创建次数
 * @param currentUpdated 当前年凌晨更新次数
 * @param previousCreated 去年凌晨创建次数
 * @param previousUpdated 去年凌晨更新次数
 * @returns 对比数据
 */
export function calculateStayUpLateComparison(
  currentCreated: number,
  currentUpdated: number,
  previousCreated: number,
  previousUpdated: number
): StayUpLateComparison {
  try {
    const currentTotal = currentCreated + currentUpdated;
    const previousTotal = previousCreated + previousUpdated;

    Logger.debug(`calculateStayUpLateComparison > currentCreated: ${currentCreated}, currentUpdated: ${currentUpdated}, currentTotal: ${currentTotal}`);
    Logger.debug(`calculateStayUpLateComparison > previousCreated: ${previousCreated}, previousUpdated: ${previousUpdated}, previousTotal: ${previousTotal}`);

    // 去年没有数据
    if (previousTotal === 0) {
      return {
        hasComparison: false,
        currentTotal,
        previousTotal: 0,
        changePercent: 0,
        changeType: 'same',
        message: '不舍今夜的星光，但为了去赶明天更远的路，请把梦充好电——晚安，追光的人。'
      };
    }

    // 计算变化百分比
    const changePercent = previousTotal > 0
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : 0;

    Logger.debug(`calculateStayUpLateComparison > calculation: (${currentTotal} - ${previousTotal}) / ${previousTotal} * 100 = ${changePercent}%`);

    // 确定变化类型
    let changeType: 'increase' | 'decrease' | 'same';
    if (changePercent > 0) {
      changeType = 'increase';
    } else if (changePercent < 0) {
      changeType = 'decrease';
    } else {
      changeType = 'same';
    }

    Logger.debug(`calculateStayUpLateComparison > current: ${currentTotal}, previous: ${previousTotal}, change: ${changePercent}%`);

    return {
      hasComparison: true,
      currentTotal,
      previousTotal,
      changePercent,
      changeType
    };
  } catch (err) {
    Logger.error('calculateStayUpLateComparison failed: ' + err);
    // 返回默认值
    return {
      hasComparison: false,
      currentTotal: currentCreated + currentUpdated,
      previousTotal: 0,
      changePercent: 0,
      changeType: 'same',
      message: '不舍今夜的星光，但为了去赶明天更远的路，请把梦充好电——晚安，追光的人。'
    };
  }
}
