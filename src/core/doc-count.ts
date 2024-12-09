import { sql } from '../api';
import { Logger } from '../utils/mlog';
import DashboardPlugin from '../index';
/**
 * get all doc count
 * @author jzman 
 * @returns 
 */
export async function getDocCountAll(plugin: DashboardPlugin) {
    try {
        const notebooksCondition = await plugin.getNotebooksCondition();
        const sqlStr = `select count(*) as total from blocks where type = "d" and ${notebooksCondition}`;
        Logger.debug(`getDocCountAll > sqlStr: ${sqlStr}`);
        const res = await sql(sqlStr);
        const count = res[0]?.total || 0;
        return count;
    } catch (err) {
        Logger.error('getDocCountAll failed: ' + err);
        return 0;
    }
}