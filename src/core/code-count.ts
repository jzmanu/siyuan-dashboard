import { sql } from '../api';
import { Logger } from '../utils/mlog';
import { LIMIT_MAX } from '@/base/Config';
import DashboardPlugin from '../index';

export async function getCodeBlockCount(plugin: DashboardPlugin): Promise<number> {
    try {
        const notebooksCondition = await plugin.getNotebooksCondition();
        const sqlStr = `select count(*) as total from blocks where type = "c" and ${notebooksCondition}`;
        const res = await sql(sqlStr);
        return res[0]?.total ?? 0;
    } catch (err) {
        Logger.error('getCodeBlockCount failed: ' + err);
        return 0;
    }
}

export async function getCodeLinesCount(plugin: DashboardPlugin): Promise<number> {
    try {
        const notebooksCondition = await plugin.getNotebooksCondition();
        const sqlStr = `select content from blocks where type = "c" and ${notebooksCondition} limit ${LIMIT_MAX}`;
        const res = await sql(sqlStr);
        if (!res || res.length === 0) return 0;
        return res.reduce((sum: number, row: { content: string }) => {
            if (!row.content) return sum;
            return sum + row.content.split('\n').length;
        }, 0);
    } catch (err) {
        Logger.error('getCodeLinesCount failed: ' + err);
        return 0;
    }
}
