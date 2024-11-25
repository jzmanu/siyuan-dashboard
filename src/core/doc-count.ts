import { sql } from '../api';
import { Logger } from '../utils/mlog';
/**
 * get all doc count
 * @author jzman 
 * @returns 
 */
export async function getDocCountAll() {
    try {
        const sqlStr = 'select count(*) as total from blocks where type = "d" and box != "20210808180117-czj9bvb"';
        const res = await sql(sqlStr);
        const count = res[0]?.total || 0;
        return count;
    } catch (err) {
        Logger.error('getDocCountAll failed: ' + err);
        return 0;
    }
}