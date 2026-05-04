import { differenceInDays, parse } from 'date-fns';
import { sql } from '../api';
import { DEFAULT_DATE_FORMAT, LIMIT_MAX } from '@/base/Config';
import { Logger } from '@/utils/mlog';
import DashboardPlugin from '..';

/**
 * get use siyuan days from first day to now.
 */
export async function getUseSiYuanDays(plugin: DashboardPlugin) {
	const notebooksCondition = await plugin.getNotebooksCondition();
	var sqlStr = `select created from blocks where type = "d" and ${notebooksCondition} order by created asc limit 1`;
	return sql(sqlStr).then((res) => {
		if(res != null && res.length > 0 && res[0].created){
			let firstUseSiYuanDate = parse(res[0].created, DEFAULT_DATE_FORMAT, new Date());
			let days = differenceInDays(new Date(), firstUseSiYuanDate);
			return days;
		}else{
			return 0;  
		}
	}).catch((err) => {
		throw new Error("getUseSiYuanDays > err:"+err);
	});
}

/**
 * get first use siyuan date.
 */
export async function getFirstUseSiYuanDay() {
	var sqlStr = 'select created from blocks where type = "d" order by created asc limit 1';
	return sql(sqlStr).then((res) => {
		if(res != null && res.length > 0 && res[0].created){
			let firsCreated = res[0].created;
			return firsCreated;
		}else{
			return 0;  
		}
	}).catch((err) => {
		throw new Error("getFirstUseSiYuanDay > err:"+err);
	});
}

/**
 * get real use siyuan days.
 * @returns Promise<number> real use days
 */
export async function getRealUseSiYuanDays(plugin: DashboardPlugin): Promise<number> {
    try {
        const notebooksCondition = await plugin.getNotebooksCondition();
        // query document's created and updated time
        const sqlStr = `
            select created, updated
            from blocks
            where type = "d"
            and ${notebooksCondition}
            order by created asc
            limit ${LIMIT_MAX}
        `;
        const res = await sql(sqlStr);
        // use Set to remove duplicate and count effective use days
        const activeDays = new Set<string>();
        if(res != null && res.length > 0){
			res.forEach(doc => {
				const createdDay = doc.created.substring(0, 8);
				const updatedDay = doc.updated.substring(0, 8);
				activeDays.add(createdDay);
				activeDays.add(updatedDay);
			});
			return activeDays.size;
		}else{
			return 0;
		}
    } catch (err) {
		Logger.error("getRealUseSiYuanDays failed: " + err);
    }
}

/**
 * get active dates by year (considering both created and updated time)
 * @param year - target year
 * @param notebooksCondition - notebooks condition for SQL query
 * @returns Promise<string[]> active dates array (format: YYYYMMDD)
 */
export async function getActiveDaysByYear(
	year: number,
	notebooksCondition: string
): Promise<string[]> {
	try {
		const targetStr = year.toString();
		const sqlStr = `
			select created, updated
			from blocks
			where type = "d"
			and (
				created like "${targetStr}%"
				or updated like "${targetStr}%"
			)
			and ${notebooksCondition || '1=1'}
			limit ${LIMIT_MAX}`;
		Logger.debug(`getActiveDaysByYear > sqlStr: ${sqlStr}`);
		const res = await sql(sqlStr);
		Logger.debug(`getActiveDaysByYear > query result count: ${res?.length || 0}`);

		// 使用 Set 去重,合并 created 和 updated 的日期
		const activeDaysSet = new Set<string>();
		if (res && res.length > 0) {
			res.forEach((row: { created: string; updated: string }) => {
				if (row.created && row.created.startsWith(targetStr)) {
					activeDaysSet.add(row.created.substring(0, 8));
				}
				if (row.updated && row.updated.startsWith(targetStr)) {
					activeDaysSet.add(row.updated.substring(0, 8));
				}
			});
		}

		const dates = Array.from(activeDaysSet).sort();
		Logger.debug(`getActiveDaysByYear > dates count: ${dates.length}`);
		return dates;
	} catch (err) {
		Logger.error('getActiveDaysByYear failed: ' + err);
		return [];
	}
}

/**
 * calculate longest streak from active dates
 * @param dates - sorted active dates array (YYYYMMDD format)
 * @returns longest streak length
 */
export function calculateLongestStreak(dates: string[]): number {
	if (dates.length === 0) return 0;

	let longestStreak = 1;
	let currentStreak = 1;

	for (let i = 1; i < dates.length; i++) {
		const diffDays = differenceInDays(parseYYYYMMDD(dates[i]), parseYYYYMMDD(dates[i - 1]));

		if (diffDays === 1) {
			currentStreak++;
			longestStreak = Math.max(longestStreak, currentStreak);
		} else {
			currentStreak = 1;
		}
	}

	return longestStreak;
}

/**
 * calculate all streaks from active dates
 * @param dates - sorted active dates array (YYYYMMDD format)
 * @param minDays - minimum days to include in result (default: 3)
 * @returns array of streak periods with length and date range
 */
export function calculateAllStreaks(
	dates: string[],
	minDays: number = 3
): Array<{ length: number; startDate: string; endDate: string }> {
	if (dates.length === 0) return [];

	const streaks: Array<{ length: number; startDate: string; endDate: string }> = [];
	let currentStreakStart = dates[0];
	let currentStreakLength = 1;

	for (let i = 1; i < dates.length; i++) {
		const diffDays = differenceInDays(parseYYYYMMDD(dates[i]), parseYYYYMMDD(dates[i - 1]));

		if (diffDays === 1) {
			// 连续,继续累加
			currentStreakLength++;
		} else {
			// 不连续,保存上一个连续段(如果满足最小天数要求)
			if (currentStreakLength >= minDays) {
				streaks.push({
					length: currentStreakLength,
					startDate: currentStreakStart,
					endDate: dates[i - 1]
				});
			}
			// 开始新的连续段
			currentStreakStart = dates[i];
			currentStreakLength = 1;
		}
	}

	// 处理最后一个连续段
	if (currentStreakLength >= minDays) {
		streaks.push({
			length: currentStreakLength,
			startDate: currentStreakStart,
			endDate: dates[dates.length - 1]
		});
	}

	// 按长度降序排序
	streaks.sort((a, b) => b.length - a.length);

	return streaks;
}

function parseYYYYMMDD(dateStr: string): Date {
	return new Date(
		parseInt(dateStr.substring(0, 4)),
		parseInt(dateStr.substring(4, 6)) - 1,
		parseInt(dateStr.substring(6, 8))
	);
}
