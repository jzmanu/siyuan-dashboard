import { sql } from '../api';
import { Logger } from '../utils/mlog';
import DashboardPlugin from '../index';
/**
 * get all tag count.
 * @author jzman 
 * @returns 
 */
export async function getTagCountTotal(plugin: DashboardPlugin) {
    try {
        const notebooksCondition = await plugin.getNotebooksCondition();
        const sqlStr = `
            select count(distinct tag) as total 
            from blocks 
            where tag is not null 
            and length(tag) > 0 
            and ${notebooksCondition}
        `;
        Logger.debug(`getTagCountTotal > sqlStr: ${sqlStr}`);
        const res = await sql(sqlStr);
        const count = res[0]?.total ?? 0;
        return count;
    } catch (err) {
        Logger.error('getTagCountTotal failed: ' + err.message);
        return 0;
    }
}