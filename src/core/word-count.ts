import { sql } from '../api';
import { Logger } from '../utils/mlog';
import { format } from 'date-fns';
/**
 * get word count all.
 * @returns Promise<number>
 * @author jzman
 */
export async function getWordCountALl(): Promise<number> {
    try {
        const sqlStr = 'select sum(length(content)) as total from blocks where type = "p" and box != "20210808180117-czj9bvb"';
        const res = await sql(sqlStr);
        const count = res[0]?.total || 0;
        Logger.debug('getWordCountALl > count:' + count);
        return count;
    } catch (err) {
        Logger.error('getWordCountALl failed:'+ err);
        return 0;
    }
}

/**
 * get word count by year.
 * @param year 
 * @returns Promise<number>
 */
export async function getWordCountByYear(year: number): Promise<number> {
    try {
        const targetStr = format(new Date(year, 0), 'yyyy');
        const sqlStr = 'select sum(length(content)) as total from blocks where type = "p" and created like "' + targetStr + '%" and box != "20210808180117-czj9bvb"';
        const res = await sql(sqlStr);
        const count = res[0]?.total || 0;
        Logger.debug('getWordCountByYear > count:' + count);
        return count;
    } catch (err) {
        Logger.error('getWordCountByYear failed:'+ err);
        return 0;
    }
}

/**
 * get word count by year with monthly data.
 * @param year 
 * @returns Promise<{labels: string[], values: number[]}>
 * @author jzman
 */
export async function getWordCountByYearData(year: number): Promise<{labels: string[], values: number[]}> {
    try {
        const values: number[] = [];
        for (let month = 1; month <= 12; month++) {
            const count = await getMonthWordCount(year, month);
            values.push(count);
        }
        return {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            values: values
        };
    } catch (err) {
        Logger.error('getWordCountByYearData failed:'+ err);
        return {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            values: new Array(12).fill(0)
        };
    }
}

/**
 * get word count for specific month
 * @param year 
 * @param month 
 * @returns Promise<number>
 */
async function getMonthWordCount(year: number, month: number): Promise<number> {
    const targetDate = new Date(year, month - 1);
    const targetStr = format(targetDate, 'yyyyMM');
    Logger.debug('getMonthWordCount > year:' + year + ' month:' + month+",targetStr:"+targetStr);
    const sqlStr = 'select sum(length(content)) as total from blocks where type = "p" and created like "' + targetStr + '%" and box != "20210808180117-czj9bvb"';
    const res = await sql(sqlStr);
    return res[0]?.total || 0;
}

/**
 * get word count data for specific month with daily data
 * @param year 
 * @param month 
 * @returns Promise<{labels: string[], values: number[]}>
 */
export async function getMonthWordCountData(year: number, month: number): Promise<{labels: string[], values: number[]}> {
    Logger.debug('getMonthWordCountData > year:' + year + ' month:' + month);
    try {
        const daysInMonth = new Date(year, month, 0).getDate();
        const values = new Array(daysInMonth).fill(0);
        const labels = Array.from({length: daysInMonth}, (_, i) => `${i + 1}`);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayStr = format(new Date(year, month - 1, day), 'yyyyMMdd');
            const sqlStr = 'select sum(length(content)) as total from blocks where type = "p" and created like "' + dayStr + '%" and box != "20210808180117-czj9bvb"';
            const res = await sql(sqlStr);
            values[day - 1] = res[0]?.total || 0;
        }

        return {
            labels,
            values
        };
    } catch (err) {
        Logger.error('getMonthWordCountData failed:'+ err);
        const daysInMonth = new Date(year, month, 0).getDate();
        return {
            labels: Array.from({length: daysInMonth}, (_, i) => `${i + 1}`),
            values: new Array(daysInMonth).fill(0)
        };
    }
}
/**
 * get week word count data.
 * @returns Promise<{labels: string[], values: number[]}>
 */
export async function getWeekWordCountData(): Promise<{labels: string[], values: number[]}> {
    Logger.debug('getWeekWordCountData');
    try {
        const today = new Date();
        const values = new Array(7).fill(0);
        const labels = ['一', '二', '三', '四', '五', '六', '日'];
        
        const monday = new Date(today);
        monday.setDate(today.getDate() - (today.getDay() || 7) + 1);
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(monday);
            currentDate.setDate(monday.getDate() + i);
            const dayStr = format(currentDate, 'yyyyMMdd');
            
            const sqlStr = 'select sum(length(content)) as total from blocks where type = "p" and created like "' + dayStr + '%" and box != "20210808180117-czj9bvb"';
            const res = await sql(sqlStr);
            values[i] = res[0]?.total || 0;
        }
        return {
            labels,
            values
        };
    } catch (err) {
        Logger.error('getWeekWordCountData failed:'+ err);
        return {
            labels: ['一', '二', '三', '四', '五', '六', '日'],
            values: new Array(7).fill(0)
        };
    }
}

/**
 * get word count today.
 * @returns Promise<number> today's word count
 * @author jzman
 */
export async function getWordCountToday(): Promise<number> {
    try {
        const today = new Date();
        const todayStr = format(today, 'yyyyMMdd');
        const sqlStr = `select sum(length(content)) as total from blocks where type = "p" and created like "${todayStr}%" and box != "20210808180117-czj9bvb"`;
        Logger.debug('getWordCountToday > sql:' + sqlStr);
        const res = await sql(sqlStr);
        const count = res[0]?.total ?? 0;
        Logger.debug('getWordCountToday > count:' + count);
        return count;
    } catch (err) {
        Logger.error('getWordCountToday failed: ' + err);
        return 0;
    }
}
/**
 * get word count by box id.
 * @param boxId box id
 * @returns Promise<number> word count
 * @author jzman
 */
export async function getWordCountByBoxId(boxId: string): Promise<number> {
    try {
        const sqlStr = `select sum(length(content)) as total from blocks where type = "p" and box = "${boxId}"`;
        const res = await sql(sqlStr);
        const count = res[0]?.total ?? 0;
        Logger.debug('getWordCountByBoxId > count:' + count);
        return count;
    } catch (err) {
        Logger.error('getWordCountByBoxId failed: ' + err);
        return 0;
    }
}