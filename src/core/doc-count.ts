import { sql } from '../api';
import { format } from 'date-fns';
import { Logger } from '../utils/mlog';
/**
 * get all doc count
 * @author jzman 
 * @returns 
 */
export async function getDocCountAll() {
	var sqlStr = 'select * from blocks where type = "d" limit 999999999';
	const res = await sql(sqlStr);
	return res.length ? res.length : 0;
}
/**
 * get doc count by box id.
 * @author jzman
 * @param boxId box id.
 * @returns 
 */
export async function getDocCountAllByBoxId(boxId: string) {
	var sqlStr = 'select * from blocks where type = "d" and box = "' + boxId + '" limit 999999999';
	const res = await sql(sqlStr);
	return res;
}

/**
 * get doc count for created or updated by last month
 * @author jzman
 * @param isCreated crated or updated
 * @returns 
 */
export async function getDocCountLastMonth(isCreated: boolean) {
	const today = new Date();
	const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
	const lastMonthStartDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
	const lastMonthEndDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59);
	const lastMonthStart = format(lastMonthStartDate, 'yyyyMMddHHmmss');
	const lastMonthEnd = format(lastMonthEndDate, 'yyyyMMddHHmmss');
	Logger.debug("getDocCountLastMonthCreated > lastMonthStart: " + lastMonthStart + ", lastMonthEnd: " + lastMonthEnd);
	const condition = isCreated ? 'created' : 'updated';
	var sqlStr = 'select * from blocks b where b.type = "d" and b.' + condition + ' >= "' + lastMonth + '" and b.' + (condition) + ' < "' + lastMonthEnd + '" limit 999999999';
	const res = await sql(sqlStr);
	return res;
}

/**
 * get doc count for created or updated by year
 * @author jzman
 * @param isCreated crated or updated
 * @param year year
 * @returns 
 */
export async function getDocCountByYear(isCreated: boolean, year: number) {
	const firstDate = new Date(year, 0, 1);
	const lastDate = new Date(year, 11, 31, 23, 59, 59);
	const firstDay = format(firstDate, 'yyyyMMddHHmmss');
	const lastDay = format(lastDate, 'yyyyMMddHHmmss');
	Logger.debug("getDocCountCreatedByYear > firstDay: " + firstDay + ", lastDay: " + lastDay);
	const condition = isCreated ? 'created' : 'updated';
	var sqlStr = 'select * from blocks b where b.type = "d" and b.' + condition + ' >= "' + firstDay + '" and b.' + (condition) + ' < "' + lastDay + '" limit 999999999';
	const res = await sql(sqlStr);
	return res;
}

/**
 * get doc count for created or updated by year and month
 * @author jzman
 * @param isCreated created or updated
 * @param year year
 * @param month if month is 5,then the month is may.
 * @returns 
 */
export async function getDocCountByYearAndMonth(isCreated: boolean, year: number, month: number) {
	const firstDate = new Date(year, month - 1, 1);
	const lastDate = new Date(year, month, 0, 23, 59, 59);
	const firstDay = format(firstDate, 'yyyyMMddHHmmss');
	const lastDay = format(lastDate, 'yyyyMMddHHmmss');
	Logger.debug("getDocCountUpdatedByYear > firstDay: " + firstDay + ", lastDay: " + lastDay);
	const condition = isCreated ? 'created' : 'updated';
	var sqlStr = 'select * from blocks b where b.type = "d" and b.' + condition + ' >= "' + firstDay + '" and b.' + (condition) + ' <= "' + lastDay + '" limit 999999999';
	Logger.debug("getDocCountUpdatedByYear > sqlStr: " + sqlStr);
	const res = await sql(sqlStr);
	return res;
}