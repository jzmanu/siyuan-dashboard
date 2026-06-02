import { sql, getTreeStat } from '../api';
import { Logger } from '../utils/mlog';
import { format } from 'date-fns';
import { LIMIT_MAX } from '@/base/Config';
import DashboardPlugin from '../index';

// Ported from siyuan-note/siyuan lute/util/rune.go WordCount
// https://github.com/siyuan-note/siyuan/blob/master/util/rune.go
function countWords(text: string): number {
    let wordCount = 0;
    const words = text.split(/\s+/).filter(s => s.length > 0);
    for (const word of words) {
        wordCount += wordCountOfSegment(word);
    }
    return wordCount;
}

// Count words in a whitespace-separated segment.
// Non-ASCII (CJK etc.) characters each count as 1 word;
// consecutive ASCII characters count as 1 word;
// switching between ASCII and non-ASCII increments word count.
function wordCountOfSegment(str: string): number {
    const runes = [...str];
    const length = runes.length;
    if (length < 1) return 0;
    let count = 1;
    let isAscii = runes[0].codePointAt(0)! < 128;
    for (let i = 1; i < length; i++) {
        const code = runes[i].codePointAt(0)!;
        if (code >= 128) {
            count++;
            isAscii = false;
            continue;
        }
        if ((code < 128) === isAscii) continue;
        count++;
        isAscii = !isAscii;
    }
    return count;
}

function getTypeCondition(plugin: DashboardPlugin): string {
    const types = ['"p"', '"h"'];
    if (plugin.statsToggleConfig.enableListStats) types.push('"i"');
    if (plugin.statsToggleConfig.enableBlockquoteStats) types.push('"b"');
    return `type in (${types.join(', ')})`;
}

async function sumWordCount(sqlStr: string): Promise<number> {
    const res = await sql(sqlStr);
    if (!res || res.length === 0) return 0;
    return res.reduce((sum: number, row: { content: string; markdown: string }) => {
        if (isMediaBlock(row.markdown)) return sum;
        return sum + countWords(row.content || '');
    }, 0);
}

// Skip blocks that represent media (images, embeds) whose content field is OCR text, not authored text.
function isMediaBlock(markdown: string): boolean {
    const md = (markdown || '').trim();
    if (!md) return false;
    // pure image: ![alt](url)
    if (/^!\[.*\]\(.*\)$/.test(md)) return true;
    // pure embed: !{url}
    if (/^!\{.*\}$/.test(md)) return true;
    return false;
}

/**
 * get word count all.
 * @returns Promise<number>
 * @author jzman
 */
export async function getWordCountALl(plugin: DashboardPlugin): Promise<number> {
    try {
        const notebooksCondition = await plugin.getNotebooksCondition();
        const typeCond = getTypeCondition(plugin);
        const sqlStr = `select sum(length(content)) as total from blocks where ${typeCond} and ${notebooksCondition}`;
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
export async function getWordCountByYear(year: number, plugin: DashboardPlugin): Promise<number> {
    try {
        const notebooksCondition = await plugin.getNotebooksCondition();
        const targetStr = format(new Date(year, 0), 'yyyy');
        const typeCond = getTypeCondition(plugin);
        const sqlStr = `select sum(length(content)) as total from blocks where ${typeCond} and created like "${targetStr}%" and ${notebooksCondition}`;
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
export async function getWordCountByYearData(year: number, plugin: DashboardPlugin): Promise<{labels: string[], values: number[]}> {
    try {
        const values: number[] = [];
        for (let month = 1; month <= 12; month++) {
            const count = await getMonthWordCount(year, month, plugin);
            values.push(count);
        }
        return {
            labels: [
                plugin.i18n.January, 
                plugin.i18n.February, 
                plugin.i18n.March, 
                plugin.i18n.April, 
                plugin.i18n.May, 
                plugin.i18n.June, 
                plugin.i18n.July, 
                plugin.i18n.August, 
                plugin.i18n.September, 
                plugin.i18n.October, 
                plugin.i18n.November, 
                plugin.i18n.December
            ],
            values: values
        };
    } catch (err) {
        Logger.error('getWordCountByYearData failed:'+ err);
        return {
            labels: [
                plugin.i18n.January, 
                plugin.i18n.February, 
                plugin.i18n.March, 
                plugin.i18n.April, 
                plugin.i18n.May, 
                plugin.i18n.June, 
                plugin.i18n.July, 
                plugin.i18n.August, 
                plugin.i18n.September, 
                plugin.i18n.October, 
                plugin.i18n.November, 
                plugin.i18n.December
            ],
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
async function getMonthWordCount(year: number, month: number, plugin: DashboardPlugin): Promise<number> {
    const notebooksCondition = await plugin.getNotebooksCondition();
    const targetDate = new Date(year, month - 1);
    const targetStr = format(targetDate, 'yyyyMM');
    Logger.debug('getMonthWordCount > year:' + year + ' month:' + month+",targetStr:"+targetStr);
    const typeCond = getTypeCondition(plugin);
    const sqlStr = `select sum(length(content)) as total from blocks where ${typeCond} and created like "${targetStr}%" and ${notebooksCondition}`;
    const res = await sql(sqlStr);
    return res[0]?.total || 0;
}

/**
 * get word count data for specific month with daily data
 * @param year 
 * @param month 
 * @returns Promise<{labels: string[], values: number[]}>
 */
export async function getMonthWordCountData(year: number, month: number, plugin: DashboardPlugin): Promise<{labels: string[], values: number[]}> {
    Logger.debug('getMonthWordCountData > year:' + year + ' month:' + month);
    try {
        const notebooksCondition = await plugin.getNotebooksCondition();
        const daysInMonth = new Date(year, month, 0).getDate();
        const values = new Array(daysInMonth).fill(0);
        const labels = Array.from({length: daysInMonth}, (_, i) => `${i + 1}`);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayStr = format(new Date(year, month - 1, day), 'yyyyMMdd');
            const sqlStr = `select sum(length(content)) as total from blocks where ${getTypeCondition(plugin)} and created like "${dayStr}%" and ${notebooksCondition}`;
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
export async function getWeekWordCountData(plugin: DashboardPlugin): Promise<{labels: string[], values: number[]}> {
    Logger.debug('getWeekWordCountData');
    try {
        const notebooksCondition = await plugin.getNotebooksCondition();
        const today = new Date();
        const values = new Array(7).fill(0);
        const labels = [
            plugin.i18n.mondays, 
            plugin.i18n.tuesdays, 
            plugin.i18n.wednesdays, 
            plugin.i18n.thursdays, 
            plugin.i18n.fridays, 
            plugin.i18n.saturdays, 
            plugin.i18n.sundays
        ];
        
        const monday = new Date(today);
        monday.setDate(today.getDate() - (today.getDay() || 7) + 1);
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(monday);
            currentDate.setDate(monday.getDate() + i);
            const dayStr = format(currentDate, 'yyyyMMdd');
            const sqlStr = `select sum(length(content)) as total from blocks where ${getTypeCondition(plugin)} and created like "${dayStr}%" and ${notebooksCondition}`;
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
            labels: [
                plugin.i18n.mondays, 
                plugin.i18n.tuesdays, 
                plugin.i18n.wednesdays, 
                plugin.i18n.thursdays, 
                plugin.i18n.fridays, 
                plugin.i18n.saturdays, 
                plugin.i18n.sundays
            ],
            values: new Array(7).fill(0)
        };
    }
}

/**
 * get word count today.
 * @returns Promise<number> today's word count
 * @author jzman
 */
export async function getWordCountToday(plugin: DashboardPlugin): Promise<number> {
    try {
        const notebooksCondition = await plugin.getNotebooksCondition();
        const today = new Date();
        const todayStr = format(today, 'yyyyMMdd');
        const sqlStr = `select sum(length(content)) as total from blocks where type = "p" and created like "${todayStr}%" and ${notebooksCondition}`;
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

/**
 * Get total word count via SiYuan getTreeStat API.
 * Calls per document in batches of 16, sums wordCount or runeCount.
 */
export async function getWordCountTotal(plugin: DashboardPlugin): Promise<number> {
    try {
        // 获取笔记本过滤条件
        const notebooksCondition = await plugin.getNotebooksCondition();
        if (!notebooksCondition) return 0;

        // 查询所有已开启笔记本下的文档ID
        const res = await sql(`select id from blocks where type = "d" and ${notebooksCondition} limit ${LIMIT_MAX}`);
        if (!res || res.length === 0) return 0;

        const docIds = res.map((row: { id: string }) => row.id);
        Logger.debug('getWordCountTotal > docIds count: ' + docIds.length + ', ids: ' + JSON.stringify(docIds.slice(0, 5)));

        let total = 0;
        const BATCH = 16;
        // 分批并发调用getTreeStat，避免瞬间请求过多
        for (let i = 0; i < docIds.length; i += BATCH) {
            const chunk = docIds.slice(i, i + BATCH);
            const results = await Promise.all(chunk.map(id => getTreeStat(id)));
            for (let j = 0; j < results.length; j++) {
                const r = results[j];
                // Logger.debug('getWordCountTotal > getTreeStat(' + chunk[j] + ') = ' + JSON.stringify(r));
                if (!r?.stat) continue;
                total += r.stat.wordCount;
            }
        }
        Logger.debug('getWordCountTotal > total: ' + total);
        return total;
    } catch (err) {
        Logger.error('getWordCountTotal failed: ' + err);
        return 0;
    }
}

// ========== 字数统计（中英混合分词） ==========

export async function getActualWordCountAll(plugin: DashboardPlugin): Promise<number> {
    try {
        const notebooksCondition = await plugin.getNotebooksCondition();
        const typeCond = getTypeCondition(plugin);
        const sqlStr = `select content, markdown from blocks where ${typeCond} and ${notebooksCondition} limit ${LIMIT_MAX}`;
        return await sumWordCount(sqlStr);
    } catch (err) {
        Logger.error('getActualWordCountAll failed: ' + err);
        return 0;
    }
}

export async function getActualWordCountByYearData(year: number, plugin: DashboardPlugin): Promise<{ labels: string[], values: number[] }> {
    try {
        const values: number[] = [];
        for (let month = 1; month <= 12; month++) {
            const notebooksCondition = await plugin.getNotebooksCondition();
            const targetStr = format(new Date(year, month - 1), 'yyyyMM');
            const sqlStr = `select content, markdown from blocks where ${getTypeCondition(plugin)} and created like "${targetStr}%" and ${notebooksCondition} limit ${LIMIT_MAX}`;
            const count = await sumWordCount(sqlStr);
            values.push(count);
        }
        return {
            labels: [
                plugin.i18n.January, plugin.i18n.February, plugin.i18n.March,
                plugin.i18n.April, plugin.i18n.May, plugin.i18n.June,
                plugin.i18n.July, plugin.i18n.August, plugin.i18n.September,
                plugin.i18n.October, plugin.i18n.November, plugin.i18n.December
            ],
            values
        };
    } catch (err) {
        Logger.error('getActualWordCountByYearData failed: ' + err);
        return {
            labels: [
                plugin.i18n.January, plugin.i18n.February, plugin.i18n.March,
                plugin.i18n.April, plugin.i18n.May, plugin.i18n.June,
                plugin.i18n.July, plugin.i18n.August, plugin.i18n.September,
                plugin.i18n.October, plugin.i18n.November, plugin.i18n.December
            ],
            values: new Array(12).fill(0)
        };
    }
}

export async function getActualMonthWordCountData(year: number, month: number, plugin: DashboardPlugin): Promise<{ labels: string[], values: number[] }> {
    try {
        const notebooksCondition = await plugin.getNotebooksCondition();
        const daysInMonth = new Date(year, month, 0).getDate();
        const values = new Array(daysInMonth).fill(0);
        const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

        for (let day = 1; day <= daysInMonth; day++) {
            const dayStr = format(new Date(year, month - 1, day), 'yyyyMMdd');
            const sqlStr = `select content, markdown from blocks where ${getTypeCondition(plugin)} and created like "${dayStr}%" and ${notebooksCondition} limit ${LIMIT_MAX}`;
            values[day - 1] = await sumWordCount(sqlStr);
        }

        return { labels, values };
    } catch (err) {
        Logger.error('getActualMonthWordCountData failed: ' + err);
        const daysInMonth = new Date(year, month, 0).getDate();
        return {
            labels: Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
            values: new Array(daysInMonth).fill(0)
        };
    }
}

/**
 * Get word count data for this week (Monday to Sunday) with actual word counting.
 */
export async function getActualWeekWordCountData(plugin: DashboardPlugin): Promise<{ labels: string[], values: number[] }> {
    try {
        const notebooksCondition = await plugin.getNotebooksCondition();
        const today = new Date();
        const values = new Array(7).fill(0);
        const labels = [
            plugin.i18n.mondays, plugin.i18n.tuesdays, plugin.i18n.wednesdays,
            plugin.i18n.thursdays, plugin.i18n.fridays, plugin.i18n.saturdays,
            plugin.i18n.sundays
        ];

        // 计算本周周一日期作为一周的起始
        const monday = new Date(today);
        monday.setDate(today.getDate() - (today.getDay() || 7) + 1);

        // 逐天查询周一到周日的字数
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(monday);
            currentDate.setDate(monday.getDate() + i);
            const dayStr = format(currentDate, 'yyyyMMdd');
            const sqlStr = `select content, markdown from blocks where ${getTypeCondition(plugin)} and created like "${dayStr}%" and ${notebooksCondition} limit ${LIMIT_MAX}`;
            values[i] = await sumWordCount(sqlStr);
        }
        return { labels, values };
    } catch (err) {
        Logger.error('getActualWeekWordCountData failed: ' + err);
        return {
            labels: [
                plugin.i18n.mondays, plugin.i18n.tuesdays, plugin.i18n.wednesdays,
                plugin.i18n.thursdays, plugin.i18n.fridays, plugin.i18n.saturdays,
                plugin.i18n.sundays
            ],
            values: new Array(7).fill(0)
        };
    }
}