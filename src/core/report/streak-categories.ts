/**
 * 连续天数分类配置
 * @module streak-categories
 */

/**
 * 连续天数分类接口
 */
export interface StreakCategory {
	id: string; // 唯一标识
	name: string; // 中文名称
	nameEn: string; // 英文名称
	minDays: number; // 最小天数
	maxDays: number | null; // 最大天数 (null表示无上限)
	color: string; // 热力图颜色（紫色主题）
	description: string; // 描述文案
}

/**
 * 连续天数分类配置
 * 使用项目现有的紫色主题色系（#6478FF → #764ba2）
 */
export const STREAK_CATEGORIES: StreakCategory[] = [
	{
		id: 'spark',
		name: '星火',
		nameEn: 'Spark',
		minDays: 3,
		maxDays: 4,
		color: '#b8b0ff',
		description: '点燃：决心初现，如星火点亮夜空'
	},
	{
		id: 'ice-breaker',
		name: '破冰',
		nameEn: 'Ice Breaker',
		minDays: 5,
		maxDays: 6,
		color: '#a896ff',
		description: '启航：打破沉寂，船只离港，开始航行'
	},
	{
		id: 'tide',
		name: '潮汐',
		nameEn: 'Tide',
		minDays: 7,
		maxDays: 10,
		color: '#9886ff',
		description: '规律：如潮汐般找到第一个稳定节奏'
	},
	{
		id: 'at-helm',
		name: '舵手',
		nameEn: 'At Helm',
		minDays: 11,
		maxDays: 14,
		color: '#8876ff',
		description: '掌控：亲手握住方向盘，航向清晰'
	},
	{
		id: 'deep-dive',
		name: '深潜',
		nameEn: 'Deep Dive',
		minDays: 15,
		maxDays: 21,
		color: '#7866ff',
		description: '专注：深入水下，远离风浪，探索深处'
	},
	{
		id: 'trade-winds',
		name: '信风',
		nameEn: 'Trade Winds',
		minDays: 22,
		maxDays: 30,
		color: '#6c56f5',
		description: '顺势：借助稳定的信风，航行轻松而顺畅'
	},
	{
		id: 'flywheel',
		name: '飞轮',
		nameEn: 'Flywheel',
		minDays: 31,
		maxDays: 45,
		color: '#667eea',
		description: '自驱：巨大轮盘凭借惯性加速旋转，势不可挡'
	},
	{
		id: 'open-sea',
		name: '远洋',
		nameEn: 'Open Sea',
		minDays: 46,
		maxDays: 60,
		color: '#6245e0',
		description: '航行：置身无边海洋，航线已成，心流绵长'
	},
	{
		id: 'symbiosis',
		name: '共生',
		nameEn: 'Symbiosis',
		minDays: 61,
		maxDays: null,
		color: '#764ba2',
		description: '融合：你与航船、海洋融为一体，抵达全新的生态'
	}
];

/**
 * 根据天数获取对应的分类
 * @param days 连续天数
 * @returns 对应的分类，如果找不到则返回 null
 */
export function getCategoryByDays(days: number): StreakCategory | null {
	return (
		STREAK_CATEGORIES.find(
			(cat) => days >= cat.minDays && (cat.maxDays === null || days <= cat.maxDays)
		) || null
	);
}

/**
 * 获取分类在数组中的索引
 * @param categoryId 分类ID
 * @returns 索引位置，如果找不到则返回 -1
 */
export function getCategoryIndex(categoryId: string): number {
	return STREAK_CATEGORIES.findIndex((cat) => cat.id === categoryId);
}
