/**
 * 连续天数热力图数据处理模块
 * @module streak-heatmap
 */

import { addDays, parse } from 'date-fns';
import { STREAK_CATEGORIES, getCategoryByDays, getCategoryIndex } from './streak-categories';
import { Logger } from '../../utils/mlog';

/**
 * 热力图数据点接口
 */
export interface HeatmapDataPoint {
	month: number; // 月份 (0-11)
	categoryIndex: number; // 分类索引 (0-8)
	date: string; // 具体日期 YYYYMMDD
	dayIndex: number; // 在连续段中的天数索引
	streakIndex: number; // 在allStreaks中的索引
	categoryName: string; // 分类名称
	streakLength: number; // 连续段总长度
}

/**
 * 将单个连续段展开为每日数据点
 * @param streak 连续段对象
 * @param streakIndex 在allStreaks中的索引
 * @returns 每日数据点数组
 */
function expandStreakToDailyData(
	streak: { length: number; startDate: string; endDate: string },
	streakIndex: number
): HeatmapDataPoint[] {
	const dailyData: HeatmapDataPoint[] = [];

	// 获取分类
	const category = getCategoryByDays(streak.length);
	if (!category) {
		Logger.debug(`expandStreakToDailyData > no category for days: ${streak.length}`);
		return dailyData;
	}

	const categoryIndex = getCategoryIndex(category.id);

	// 解析开始日期
	let currentDate = parse(streak.startDate, 'yyyyMMdd', new Date());
	const endDate = parse(streak.endDate, 'yyyyMMdd', new Date());

	// 为每一天生成一个数据点
	let dayIndex = 0;
	while (currentDate <= endDate) {
		const dateStr = currentDate.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
		const month = currentDate.getMonth(); // 0-11

		dailyData.push({
			month,
			categoryIndex,
			date: dateStr,
			dayIndex,
			streakIndex,
			categoryName: category.name,
			streakLength: streak.length
		});

		// 下一天
		currentDate = addDays(currentDate, 1);
		dayIndex++;
	}

	return dailyData;
}

/**
 * 将allStreaks转换为热力图数据（按天展开）
 * @param allStreaks 所有连续时间段
 * @returns 热力图数据数组
 */
export function transformStreaksToHeatmapData(
	allStreaks: Array<{ length: number; startDate: string; endDate: string }>
): HeatmapDataPoint[] {
	if (!allStreaks || allStreaks.length === 0) {
		Logger.debug('transformStreaksToHeatmapData > no streaks data');
		return [];
	}

	const heatmapData: HeatmapDataPoint[] = [];

	// 遍历每个连续段，展开为每日数据
	allStreaks.forEach((streak, index) => {
		const dailyData = expandStreakToDailyData(streak, index);
		heatmapData.push(...dailyData);
	});

	Logger.debug(
		`transformStreaksToHeatmapData > transformed ${heatmapData.length} data points from ${allStreaks.length} streaks`
	);
	return heatmapData;
}

/**
 * 获取热力图X轴标签（月份）
 * @param locale 语言环境 ('zh-CN' 或 'en-US')
 * @returns 月份标签数组
 */
export function getMonthLabels(locale: string = 'zh-CN'): string[] {
	if (locale === 'en-US') {
		return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	}
	return ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
}

/**
 * 获取热力图Y轴标签（分类名称）
 * @param locale 语言环境 ('zh-CN' 或 'en-US')
 * @returns 分类标签数组
 */
export function getCategoryLabels(locale: string = 'zh-CN'): string[] {
	return STREAK_CATEGORIES.map((cat) => (locale === 'en-US' ? cat.nameEn : cat.name));
}

/**
 * 计算每个分类的统计信息
 * @param heatmapData 热力图数据
 * @returns Map<分类索引, {count: 次数, maxDays: 最大天数}>
 */
export function calculateCategoryStats(
	heatmapData: HeatmapDataPoint[]
): Map<number, { count: number; maxDays: number }> {
	const stats = new Map<number, { count: number; maxDays: number }>();

	heatmapData.forEach((point) => {
		const current = stats.get(point.categoryIndex) || { count: 0, maxDays: 0 };
		stats.set(point.categoryIndex, {
			count: current.count + 1,
			maxDays: Math.max(current.maxDays, point.streakLength)
		});
	});

	return stats;
}
