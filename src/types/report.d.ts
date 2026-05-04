/**
 * MVR (Minimum Viable Report) 年报类型定义
 *
 * 设计理念：最小可行 × 只追求趣味性 × 不承担长期维护成本
 */

/**
 * MVR年报数据结构
 */
export interface Report {
  year: number;

  // 时间投入统计
  activeDays: number;
  totalWords: number;
  totalBlocks: number;
  avgWordsPerDay: number;

  // 记录节奏分析
  hourlyStats: HourlyStat[];
  rhythmType: RhythmType;

  // 内容倾向统计
  topNotebooks: NotebookStat[];

  // 连续记录统计
  longestStreak: number;
  streakPeriod?: StreakPeriod;
  allStreaks?: Array<{ length: number; startDate: string; endDate: string }>; // 所有连续时间段(≥3天)

  // 熬夜记录数据
  stayUpLateRecord: StayUpLateRecord;
}

/**
 * 按小时统计数据
 */
export interface HourlyStat {
  hour: number;  // 0-23
  count: number; // 记录次数
}

/**
 * 记录节奏类型
 */
export type RhythmType =
  | '夜猫型记录者'
  | '早起型记录者'
  | '工作型记录者'
  | '稳定型记录者'
  | '碎片型记录者';

/**
 * 笔记本统计
 */
export interface NotebookStat {
  name: string;      // 笔记本ID或名称
  count: number;     // 文档数量
  percentage: number; // 百分比
}

/**
 * 连续记录时间段
 */
export interface StreakPeriod {
  start: string; // 开始日期 YYYYMMDD
  end: string;   // 结束日期 YYYYMMDD
}

/**
 * 熬夜记录数据
 */
export interface StayUpLateRecord {
  hasLateRecord: boolean;
  createdRecords?: NightRecord[];    // 凌晨创建的记录列表（最多10条）
  updatedRecords?: NightRecord[];    // 凌晨更新的记录列表（最多10条）
  createdMessage?: string;           // 创建部分的总结文案（显示全部次数）
  updatedMessage?: string;           // 更新部分的总结文案（显示全部次数）
  comparison?: StayUpLateComparison;  // 熬夜指数对比数据
}

/**
 * 熬夜对比数据
 */
export interface StayUpLateComparison {
  hasComparison: boolean;           // 是否有对比数据（去年是否存在数据）
  currentTotal: number;             // 当前年熬夜总次数
  previousTotal: number;            // 去年熬夜总次数
  changePercent: number;            // 变化百分比（正数=增加，负数=下降）
  changeType: 'increase' | 'decrease' | 'same';  // 变化类型
  message?: string;                 // 对比文案（去年无数据时使用）
}

/**
 * 单条熬夜记录
 */
export interface NightRecord {
  date: string;               // 格式：20250315
  time: string;               // 格式：0342
  title?: string;             // 文档标题
  content?: string;           // 文档内容片段
  formattedDateTime: string;  // 格式化后的时间：3月15日 凌晨3:42
}
