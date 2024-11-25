import { sql } from '../api';
import { Logger } from '../utils/mlog';
/**
 * get all tag count.
 * @author jzman 
 * @returns 
 */
export async function getTagCountTotal() {
    try {
        const sqlStr = `
            select count(distinct tag) as total 
            from blocks 
            where tag is not null 
            and length(tag) > 0 
            and box != "20210808180117-czj9bvb"
        `;
        const res = await sql(sqlStr);
        const count = res[0]?.total ?? 0;
        return count;
    } catch (err) {
        Logger.error('getTagCountTotal failed: ' + err.message);
        return 0;
    }
}