/**
 * MVR 年报导出工具
 */

import { Logger } from './mlog';
import type { Report } from '../types/report.d';

/**
 * 导出年报为图片
 */
export async function exportMVRAsImage(
  elementId: string,
  reportData: Report
): Promise<void> {
  try {
    // 动态导入 html2canvas（懒加载）
    const html2canvas = await import('html2canvas');

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('未找到年报元素');
    }

    Logger.debug('exportMVRAsImage > 开始生成图片...');

    const canvas = await html2canvas.default(element, {
      backgroundColor: '#ffffff',
      scale: 2,  // 高清导出
      logging: false,
      useCORS: true,
      allowTaint: true
    });

    // 转换为图片并下载
    canvas.toBlob((blob) => {
      if (!blob) {
        Logger.error('exportMVRAsImage > 生成图片失败');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `siyuan-mvr-${reportData.year}-${Date.now()}.png`;
      link.href = url;
      link.click();

      // 清理
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);

      Logger.debug('exportMVRAsImage > 图片导出成功');
    }, 'image/png');

  } catch (err) {
    Logger.error('exportMVRAsImage > 导出失败: ' + err);
    throw err;
  }
}

/**
 * 导出年报数据为JSON
 */
export function exportMVRAsJSON(reportData: Report): void {
  try {
    const dataStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `siyuan-mvr-${reportData.year}-${Date.now()}.json`;
    link.href = url;
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    Logger.debug('exportMVRAsJSON > JSON导出成功');
  } catch (err) {
    Logger.error('exportMVRAsJSON > 导出失败: ' + err);
    throw err;
  }
}

/**
 * 导出年报为Markdown
 */
export function exportMVRAsMarkdown(reportData: Report): void {
  try {
    let markdown = `# ${reportData.year} 年度知识花园报告\n\n`;

    markdown += `## 核心指标\n\n`;
    markdown += `- 活跃天数：${reportData.activeDays} 天\n`;
    markdown += `- 总字数：${reportData.totalWords.toLocaleString()} 字\n`;
    markdown += `- 总块数：${reportData.totalBlocks.toLocaleString()} 个\n`;
    markdown += `- 平均每天：${reportData.avgWordsPerDay.toLocaleString()} 字\n\n`;

    markdown += `## 记录节奏\n\n`;
    markdown += `你的记录类型：**${reportData.rhythmType}**\n\n`;

    markdown += `## 内容倾向\n\n`;
    if (reportData.topNotebooks.length > 0) {
      markdown += `Top 3 笔记本：\n\n`;
      reportData.topNotebooks.forEach((nb, index) => {
        const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        markdown += `${rank} ${nb.name}：${nb.count} 篇 (${nb.percentage}%)\n`;
      });
      markdown += `\n`;
    }

    markdown += `## 最长连续记录\n\n`;
    markdown += `你曾连续记录了 **${reportData.longestStreak}** 天\n\n`;

    markdown += `## 凌晨记录\n\n`;
    if (reportData.latestNightRecord.hasLateRecord) {
      markdown += `最晚的一次记录：${reportData.latestNightRecord.formattedDateTime}\n\n`;
      if (reportData.latestNightRecord.title) {
        markdown += `文档：${reportData.latestNightRecord.title}\n\n`;
      }
      markdown += `> ${reportData.latestNightRecord.message}\n\n`;
    } else {
      markdown += `这一年，你很懂得照顾自己，没有在凌晨0-5点记录。\n\n`;
    }

    markdown += `## 年度总结\n\n`;
    markdown += `${reportData.year} 年，你是一位 **${reportData.rhythmType}**，`;
    markdown += `在「${reportData.topNotebooks[0]?.name || '未知'}」上留下了最多痕迹。\n\n`;

    markdown += `---\n\n`;
    markdown += `*由 SiYuan Dashboard 插件生成*`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `siyuan-mvr-${reportData.year}-${Date.now()}.md`;
    link.href = url;
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    Logger.debug('exportMVRAsMarkdown > Markdown导出成功');
  } catch (err) {
    Logger.error('exportMVRAsMarkdown > 导出失败: ' + err);
    throw err;
  }
}
