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
