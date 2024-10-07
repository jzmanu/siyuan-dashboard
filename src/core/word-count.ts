import { sql } from '../api';
import { WordCallback } from './word-callback';
import { Logger } from '../utils/mlog';
import { format } from 'date-fns';
/**
 * get word count all.
 * @param callback 
 * @author jzman
 */
export function getWordCountALl(callback: WordCallback) {
    getSQLWordCountAll().then(res => {
        calculateWordCount(res, callback);
    })
}
/**
 * get word count today.
 * @param callback 
 * @author jzman
 */
export function getWordCountToday(callback: WordCallback) {
    getSQLWordCountToday().then(res => {
        calculateWordCount(res, callback);
    })
}
/**
 * get word count by box id.
 * @param boxId 
 * @param callback 
 * @author jzman
 */
export function getWordCountByBoxId(boxId: string, callback: WordCallback) {
    getSQLWordCountByBoxId(boxId).then(res => {
        calculateWordCount(res, callback);
    })
}

/**
 * get word count by year.
 * @param year 
 * @param callback 
 * @author jzman
 */
export async function getWordCountByYear(year: number, callback: WordCallback) {
    getSQLWordCountByYear(year).then(res => {
        calculateWordCount(res, callback);
    })
}
/**
 * get word count by year and month.
 * @param year 
 * @param month 
 * @param callback 
 * @author jzman
 */
export async function getWordCountByYearAndMonth(year: number, month: number, callback: WordCallback) {
    getSQLWordCountByYearAndMonth(year, month).then(res => {
        calculateWordCount(res, callback);
    })
}

function calculateWordCount(res: any[], callback: WordCallback) {
    var count = 0;
    res.forEach(item => {
        count += item.length;
    });
    Logger.debug('calculateWordCount > count:' + count);
    if (callback) {
        callback.onGetWordsSuccess(count);
    }
}

async function getSQLWordCountAll() {
    var sqlStr = 'select * from blocks where type = "p" limit 999999999';
    const res = await sql(sqlStr);
    return res;
}

async function getSQLWordCountToday() {
    const today = new Date();
    const todayStr = format(today, 'yyyyMMdd');
    var sqlStr = 'select * from blocks b where b.type = "p" and b.updated like "' + todayStr + '%" limit 999999999';
    Logger.debug('getSQLWordCountToday > sql:' + sqlStr);
    const res = await sql(sqlStr);
    return res;
}

async function getSQLWordCountByBoxId(boxId: string) {
    var sqlStr = 'select * from blocks where type = "p" and box = "' + boxId + '" limit 999999999';
    const res = await sql(sqlStr);
    return res;
}

async function getSQLWordCountByYear(year: number) {
    const targetDate = new Date(year);
    const targetStr = format(targetDate, 'yyyy');
    var sqlStr = 'select * from blocks b where b.type = "p" and b.updated like "' + targetStr + '%" limit 999999999';
    const res = await sql(sqlStr);
    return res;
}

async function getSQLWordCountByYearAndMonth(year: number, month: number) {
    const targetDate = new Date(year, month);
    const targetStr = format(targetDate, 'yyyyMM');
    var sqlStr = 'select * from blocks b where b.type = "p" and b.updated like "' + targetStr + '%" limit 999999999';
    const res = await sql(sqlStr);
    return res;
}