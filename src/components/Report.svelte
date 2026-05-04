<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import Chart from "chart.js/auto";
  import * as echarts from "echarts";
  import {
    composeReportData,
    transformStreaksToHeatmapData,
    getMonthLabels,
    getCategoryLabels,
    STREAK_CATEGORIES,
    getCategoryByDays,
    getCategoryIndex,
    type Report,
    type HeatmapDataPoint,
  } from "../core/report-count";
  import DashboardPlugin from "../index";
  import { Logger } from "../utils/mlog";
  import {
    exportMVRAsImage,
    exportMVRAsJSON,
    exportMVRAsMarkdown,
  } from "../utils/export";

  export let plugin: DashboardPlugin;
  export let year: number = new Date().getFullYear();

  let currentPage = 0;
  let reportData: Report | null = null;
  let isLoading = true;
  let error: string | null = null;
  let showToast = false;
  let toastMessage = "";
  let toastType: "success" | "error" = "success";

  // 图表实例
  let rhythmChart: Chart | null = null;
  let rhythmCanvas: HTMLCanvasElement;
  let streakHeatmap: echarts.ECharts | null = null;
  let heatmapContainer: HTMLDivElement;

  // 标记已初始化的页面
  let lastInitializedPage = -1;

  onMount(async () => {
    await loadReportData();
  });

  onDestroy(() => {
    if (rhythmChart) {
      rhythmChart.destroy();
    }
    if (streakHeatmap) {
      streakHeatmap.dispose();
    }
  });

  // 使用响应式语句处理页面切换后的图表初始化
  $: if (reportData) {
    (async () => {
      await tick(); // 等待 DOM 更新

      // 第3页：记录节奏图表
      if (currentPage === 2 && lastInitializedPage !== 2) {
        const initChart = () => {
          if (rhythmCanvas) {
            initRhythmChart();
            lastInitializedPage = 2;
          } else {
            requestAnimationFrame(initChart);
          }
        };
        requestAnimationFrame(initChart);
      }

      // 第5页：连续记录热力图
      if (currentPage === 4 && lastInitializedPage !== 4) {
        const initHeatmap = () => {
          if (heatmapContainer) {
            initStreakHeatmap();
            lastInitializedPage = 4;
          } else {
            requestAnimationFrame(initHeatmap);
          }
        };
        requestAnimationFrame(initHeatmap);
      }

      // 重置标记（当离开需要图表的页面时）
      if (currentPage !== 2 && currentPage !== 4) {
        lastInitializedPage = -1;
      }
    })();
  }

  async function loadReportData() {
    try {
      isLoading = true;
      error = null;
      reportData = await composeReportData(year, plugin);
      Logger.debug("loadReportData > reportData:", reportData);
      if (!reportData) {
        error = "未能加载年报数据";
      }
    } catch (err) {
      Logger.error("loadReportData > Failed to load report data: " + err);
      error = "加载年报数据失败，请重试";
    } finally {
      isLoading = false;
    }
  }

  async function nextPage() {
    if (currentPage < 6) {
      currentPage++;
    }
  }

  async function prevPage() {
    if (currentPage > 0) {
      currentPage--;
    }
  }

  async function goToPage(pageIndex: number) {
    if (pageIndex >= 0 && pageIndex <= 6) {
      currentPage = pageIndex;
    }
  }

  function initRhythmChart() {
    if (!rhythmCanvas || !reportData) return;

    // 销毁旧图表
    if (rhythmChart) {
      rhythmChart.destroy();
    }

    // 准备数据（24小时）
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const stat = reportData!.hourlyStats.find((s) => s.hour === i);
      return stat ? stat.count : 0;
    });

    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    rhythmChart = new Chart(rhythmCanvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "创建次数",
            data: hourlyData,
            backgroundColor: (context) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return "rgba(102, 126, 234, 0.8)";
              const gradient = ctx.createLinearGradient(
                0,
                chartArea.bottom,
                0,
                chartArea.top,
              );
              gradient.addColorStop(0, "rgba(102, 126, 234, 0.4)");
              gradient.addColorStop(1, "rgba(118, 75, 162, 0.9)");
              return gradient;
            },
            borderRadius: 4,
            barThickness: 20,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: "easeOutQuart",
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(26, 26, 46, 0.9)",
            titleColor: "#f0f0f0",
            bodyColor: "#c0c0c0",
            borderColor: "rgba(102, 126, 234, 0.3)",
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#c0c0c0",
              font: { size: 11 },
            },
            grid: {
              color: "rgba(255, 255, 255, 0.06)",
              drawBorder: false,
            },
          },
          x: {
            grid: { display: false, drawBorder: false },
            ticks: {
              color: "#c0c0c0",
              font: { size: 10 },
              maxRotation: 0,
              minRotation: 0,
            },
          },
        },
      },
    });
  }

  // 节奏统计辅助函数
  function getPeakHour(): string {
    if (!reportData?.hourlyStats || reportData.hourlyStats.length === 0)
      return "--:00";
    const peak = reportData.hourlyStats.reduce(
      (max, stat) => (stat.count > max.count ? stat : max),
      reportData.hourlyStats[0],
    );
    return `${peak.hour}:00`;
  }

  function getTotalRecords(): number {
    if (!reportData?.hourlyStats) return 0;
    return reportData.hourlyStats.reduce((sum, stat) => sum + stat.count, 0);
  }

  function getActiveHours(): number {
    if (!reportData?.hourlyStats) return 0;
    return reportData.hourlyStats.filter((stat) => stat.count > 0).length;
  }

  function getRhythmDescription(): string {
    if (!reportData?.rhythmType) return "";
    const type = reportData.rhythmType;

    if (type.includes("夜猫子")) {
      return "深夜的灵感更为活跃，在安静的环境下思维更加敏锐。";
    } else if (type.includes("早起")) {
      return "清晨时光是你创作的黄金期，朝气蓬勃开启新的一天。";
    } else if (type.includes("规律")) {
      return "你的作息非常规律，每个时间段都保持着稳定的创作习惯。";
    } else if (type.includes("灵活")) {
      return "你的创作时间自由灵活，灵感来临时随时记录。";
    } else {
      return "你有独特的节奏，在特定时段展现出创作活力。";
    }
  }

  function initStreakHeatmap() {
    if (!heatmapContainer || !reportData?.allStreaks) return;

    // 销毁旧图表
    if (streakHeatmap) {
      streakHeatmap.dispose();
    }

    // 获取当前语言
    const currentLocale = plugin.i18n.currentLocale || "zh-CN";

    // 直接使用 allStreaks
    const allStreaks = reportData.allStreaks;

    Logger.debug(`initStreakHeatmap > allStreaks count: ${allStreaks.length}`);

    // 构建散点图数据：每个连续段是一个数据点
    const chartData = allStreaks.map((streak, index) => {
      const category = getCategoryByDays(streak.length);
      const categoryIndex = category ? getCategoryIndex(category.id) : -1;
      const month = parseInt(streak.startDate.substring(4, 6)) - 1;

      Logger.debug(
        `streak ${index}: length=${streak.length}, categoryIndex=${categoryIndex}, month=${month}`,
      );

      return {
        name: `${streak.startDate}-${streak.endDate}`,
        value: [month, categoryIndex, streak.length],
        itemStyle: {
          color: category ? category.color : "#ccc",
        },
        startDate: streak.startDate,
        endDate: streak.endDate,
        categoryName: category ? category.name : "",
        streakLength: streak.length,
      };
    });

    Logger.debug(
      `initStreakHeatmap > chartData sample: ${JSON.stringify(chartData.slice(0, 2))}`,
    );

    // 初始化 ECharts
    streakHeatmap = echarts.init(heatmapContainer);

    // 根据屏幕宽度响应式调整
    const isMobile = window.innerWidth < 768;
    // 竖轴标签宽度约 130px，需要足够的空间
    const gridLeft = isMobile ? 140 : 150;

    const option = {
      tooltip: {
        position: "top",
        backgroundColor: "rgba(26, 26, 46, 0.95)",
        borderColor: "rgba(102, 126, 234, 0.3)",
        borderWidth: 1,
        textStyle: { color: "#f0f0f0" },
        formatter: (params: any) => {
          const data = params.data;
          const startDate = formatDateString(data.startDate);
          const endDate = formatDateString(data.endDate);
          const categoryName = data.categoryName;
          const streakLength = data.streakLength;
          const month = getMonthLabels(currentLocale)[data.value[0]];

          return `
            <div style="padding: 8px; min-width: 150px;">
              <div style="font-weight: bold; margin-bottom: 6px; color: #a896ff;">
                ${categoryName}
              </div>
              <div style="margin-bottom: 4px;">📅 ${month} ${startDate} - ${endDate}</div>
              <div style="color: #9ca3af;">🔥 连续 ${streakLength} 天</div>
            </div>
          `;
        },
      },
      grid: {
        height: "80%",
        top: "6%",
        left: gridLeft, // 响应式左边距
        right: "3%",
        bottom: "10%",
      },
      xAxis: {
        type: "category",
        data: getMonthLabels(currentLocale),
        splitArea: { show: true },
        axisLabel: {
          color: "#c0c0c0",
          fontSize: 12,
          margin: 10,
        },
        axisLine: {
          lineStyle: { color: "rgba(255, 255, 255, 0.1)" },
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "category",
        data: getCategoryLabels(currentLocale),
        splitArea: { show: true },
        axisLabel: {
          color: "#c0c0c0",
          fontSize: 11,
          margin: 10,
          align: "right",
          formatter: (value: string, index: number) => {
            // 在分类名称后面添加天数范围
            const category = STREAK_CATEGORIES[index];
            if (!category) return value;

            const rangeText = category.maxDays
              ? `${category.minDays}-${category.maxDays}天`
              : `${category.minDays}天+`;

            // 使用富文本实现两端对齐
            return `{a|${value}}{b|${rangeText}}`;
          },
          rich: {
            a: {
              width: 80,
              align: "left",
              padding: [0, 2, 0, 0],
            },
            b: {
              width: 60,
              align: "right",
              color: "#9ca3af",
              padding: [0, 0, 0, 0],
            },
          },
        },
        axisLine: {
          lineStyle: { color: "rgba(255, 255, 255, 0.1)" },
        },
        splitLine: { show: false },
      },
      series: [
        {
          type: "scatter",
          coordinateSystem: "cartesian2d",
          symbolSize: (value: any, data: any) => {
            // value 是 [monthIndex, categoryIndex, streakLength]
            if (!value || !Array.isArray(value)) return 25;
            const days = value[2];
            // 范围：3天-61天
            // 目标：3天约30px，61天约135px
            const baseSize = 18;
            const sizePerDay = 1.9;
            return baseSize + days * sizePerDay;
          },
          data: chartData,
          label: {
            show: false,
          },
          itemStyle: {
            borderRadius: 4,
            borderColor: "rgba(255, 255, 255, 0.3)",
            borderWidth: 1,
            opacity: 0.8,
            emphasis: {
              shadowBlur: 10,
              shadowColor: "rgba(102, 126, 234, 0.5)",
              borderColor: "#fff",
              borderWidth: 2,
              opacity: 1,
            },
          },
        },
      ],
    };

    streakHeatmap.setOption(option);

    // 监听窗口大小变化
    const resizeHandler = () => streakHeatmap?.resize();
    window.addEventListener("resize", resizeHandler);
  }

  function formatDateString(dateStr: string): string {
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));
    return `${month}月${day}日`;
  }

  function showToastMessage(
    message: string,
    type: "success" | "error" = "success",
  ) {
    toastMessage = message;
    toastType = type;
    showToast = true;
    setTimeout(() => {
      showToast = false;
    }, 3000);
  }

  async function handleExportImage() {
    if (!reportData) return;
    try {
      await exportMVRAsImage("mvr-report-container", reportData);
      showToastMessage("图片保存成功");
    } catch (err) {
      Logger.error("导出图片失败: " + err);
      showToastMessage("导出图片失败，请重试", "error");
    }
  }

  function handleExportJSON() {
    if (!reportData) return;
    try {
      exportMVRAsJSON(reportData);
      showToastMessage("JSON 导出成功");
    } catch (err) {
      Logger.error("导出JSON失败: " + err);
      showToastMessage("导出JSON失败，请重试", "error");
    }
  }

  function handleExportMarkdown() {
    if (!reportData) return;
    try {
      exportMVRAsMarkdown(reportData);
      showToastMessage("Markdown 导出成功");
    } catch (err) {
      Logger.error("导出Markdown失败: " + err);
      showToastMessage("导出Markdown失败，请重试", "error");
    }
  }

  // 键盘导航
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      nextPage();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevPage();
    }
  }

  // 指示器点的键盘事件处理
  function handleDotKeydown(e: KeyboardEvent, pageIndex: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToPage(pageIndex);
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="mvr-report-container" id="mvr-report-container">
  <!-- Toast 提示 -->
  {#if showToast}
    <div class="toast {toastType}" role="alert" aria-live="polite">
      <svg
        class="toast-icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      >
        {#if toastType === "success"}
          <polyline points="20 6 9 17 4 12"></polyline>
        {:else}
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        {/if}
      </svg>
      <span>{toastMessage}</span>
    </div>
  {/if}

  {#if isLoading}
    <div class="loading">
      <div class="spinner"></div>
      <p>正在生成年报...</p>
    </div>
  {:else if error}
    <div class="error">
      <svg
        class="error-icon"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>{error}</p>
      <button class="retry-btn" on:click|stopPropagation={loadReportData}
        >重试</button
      >
    </div>
  {:else if reportData}
    <div class="mvr-report">
      {#if currentPage === 0}
        <!-- 第1页：年度封面 -->
        <div class="page cover-page">
          <div class="year-circle">
            <span class="year">{reportData.year}</span>
          </div>
          <h1>快来看看你的年度回忆...</h1>
          <p class="subtitle">
            每一篇笔记，每一篇思考，从不是年份的注脚,是你与时光对谈的精神年轮，刻着「如何成为自己」的秘密。
          </p>
          <div class="start-container">
            <button
              class="start-arrow-btn"
              on:click|stopPropagation={nextPage}
              aria-label="开始探索"
            >
              <svg
                class="arrow-icon"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <p class="start-text">开始回顾</p>
            <p class="hint-text">按 → 键或点击继续</p>
          </div>
        </div>
      {:else if currentPage === 1}
        <!-- 第2页：时间投入 -->
        <div class="page time-investment-page">
          <h2>这一年你来过多少次</h2>
          <div class="main-stat">
            <span class="number">{reportData.activeDays}</span>
            <span class="label">天里留下了记录</span>
          </div>
          <div class="sub-stats">
            <div class="stat-item">
              <span class="value">{reportData.totalWords.toLocaleString()}</span
              >
              <span class="label">字</span>
            </div>
            <div class="stat-item">
              <span class="value"
                >{reportData.totalBlocks.toLocaleString()}</span
              >
              <span class="label">块</span>
            </div>
            <div class="stat-item">
              <span class="value"
                >{reportData.avgWordsPerDay.toLocaleString()}</span
              >
              <span class="label">平均/天</span>
            </div>
          </div>
          <p class="emotion-text">并不是每天，但你从未离开太久。</p>
          <div class="nav-section">
            <!-- 左侧箭头 - 固定在左侧 -->
            <button
              class="nav-arrow prev-arrow"
              on:click|stopPropagation={prevPage}
              aria-label="上一页"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <!-- 中间指示器 -->
            {#if currentPage > 0 && currentPage < 6}
              <div class="page-indicator">
                {#each Array(6) as _, i}
                  <div
                    class="dot"
                    class:active={i === currentPage - 1}
                    on:click|stopPropagation={() => goToPage(i + 1)}
                    on:keydown|stopPropagation={(e) =>
                      handleDotKeydown(e, i + 1)}
                    role="button"
                    tabindex="0"
                    aria-label="跳转到第 {i + 1} 页"
                  ></div>
                {/each}
              </div>
            {/if}
            <!-- 右侧箭头 - 固定在右侧 -->
            <button
              class="nav-arrow next-arrow"
              on:click|stopPropagation={nextPage}
              aria-label="下一页"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      {:else if currentPage === 2}
        <!-- 第3页：记录节奏 -->
        <div class="page rhythm-page">
          <h2>你的记录节奏</h2>

          <!-- 统计卡片 -->
          <div class="rhythm-stats">
            <div class="stat-card">
              <div class="stat-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{getPeakHour()}</div>
                <div class="stat-label">年度最活跃时段</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{getTotalRecords()}</div>
                <div class="stat-label">年度创建文档总数</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M23 6l-9.5 9.5-5-5L1 18" />
                  <path d="M17 6h6v6" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{getActiveHours()}</div>
                <div class="stat-label">活跃小时数</div>
              </div>
            </div>
          </div>

          <!-- 图表 -->
          <div class="chart-container">
            <canvas bind:this={rhythmCanvas}></canvas>
          </div>

          <!-- 节奏类型卡片 -->
          <div class="rhythm-type-card">
            <div class="rhythm-content">
              <span class="rhythm-label">你的节奏类型是</span>
              <span class="rhythm-name">{reportData.rhythmType}</span>
              <p class="rhythm-description">{getRhythmDescription()}</p>
            </div>
          </div>

          <div class="nav-section">
            <!-- 左侧箭头 - 固定在左侧 -->
            <button
              class="nav-arrow prev-arrow"
              on:click|stopPropagation={prevPage}
              aria-label="上一页"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <!-- 中间指示器 -->
            {#if currentPage > 0 && currentPage < 6}
              <div class="page-indicator">
                {#each Array(6) as _, i}
                  <div
                    class="dot"
                    class:active={i === currentPage - 1}
                    on:click|stopPropagation={() => goToPage(i + 1)}
                    on:keydown|stopPropagation={(e) =>
                      handleDotKeydown(e, i + 1)}
                    role="button"
                    tabindex="0"
                    aria-label="跳转到第 {i + 1} 页"
                  ></div>
                {/each}
              </div>
            {/if}
            <!-- 右侧箭头 - 固定在右侧 -->
            <button
              class="nav-arrow next-arrow"
              on:click|stopPropagation={nextPage}
              aria-label="下一页"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      {:else if currentPage === 3}
        <!-- 第4页：内容倾向 -->
        <div class="page content-focus-page">
          <h2>你在记录什么</h2>
          <div class="top-notebooks">
            {#each reportData.topNotebooks as notebook, index}
              <div class="notebook-item">
                <div class="notebook-header">
                  <div class="rank-badge">
                    <div class="rank-icon">
                      {#if index === 0}
                        <svg viewBox="0 0 24 24" fill="#FFD700">
                          <path
                            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          />
                        </svg>
                      {:else if index === 1}
                        <svg viewBox="0 0 24 24" fill="#C0C0C0">
                          <path
                            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          />
                        </svg>
                      {:else if index === 2}
                        <svg viewBox="0 0 24 24" fill="#CD7F32">
                          <path
                            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          />
                        </svg>
                      {:else}
                        <span class="rank-number">{index + 1}</span>
                      {/if}
                    </div>
                  </div>
                  <div class="notebook-info">
                    <div class="name-row">
                      <span class="name">{notebook.name}</span>
                      <span class="percentage">{notebook.percentage}%</span>
                    </div>
                  </div>
                </div>
                <div class="progress-bar-container">
                  <div
                    class="progress-bar"
                    style="width: {notebook.percentage}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
          <p class="emotion-text">这一年，你最常回到这些主题。</p>
          <div class="nav-section">
            <!-- 左侧箭头 - 固定在左侧 -->
            <button
              class="nav-arrow prev-arrow"
              on:click|stopPropagation={prevPage}
              aria-label="上一页"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <!-- 中间指示器 -->
            {#if currentPage > 0 && currentPage < 6}
              <div class="page-indicator">
                {#each Array(6) as _, i}
                  <div
                    class="dot"
                    class:active={i === currentPage - 1}
                    on:click|stopPropagation={() => goToPage(i + 1)}
                    on:keydown|stopPropagation={(e) =>
                      handleDotKeydown(e, i + 1)}
                    role="button"
                    tabindex="0"
                    aria-label="跳转到第 {i + 1} 页"
                  ></div>
                {/each}
              </div>
            {/if}
            <!-- 右侧箭头 - 固定在右侧 -->
            <button
              class="nav-arrow next-arrow"
              on:click|stopPropagation={nextPage}
              aria-label="下一页"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      {:else if currentPage === 4}
        <!-- 第5页：连续天数分类热力图 -->
        <div class="page streak-page">
          <h2>连续记录分布</h2>
          <!-- 散点图容器 -->
          <div class="streak-heatmap-section">
            <div bind:this={heatmapContainer} class="heatmap-chart"></div>
          </div>
          <p class="emotion-text">每一次坚持，都是在向更好的自己靠近。</p>
          <!-- 统计信息 -->
          <p class="streak-summary-text">
            全年共有 <strong>{reportData.allStreaks?.length || 0}</strong>
            段连续记录(≥3天)， 最长连续记录
            <strong>{reportData.longestStreak}</strong> 天
          </p>
          <!-- 导航按钮 -->
          <div class="nav-section">
            <!-- 左侧箭头 - 固定在左侧 -->
            <button
              class="nav-arrow prev-arrow"
              on:click|stopPropagation={prevPage}
              aria-label="上一页"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <!-- 中间指示器 -->
            {#if currentPage > 0 && currentPage < 6}
              <div class="page-indicator">
                {#each Array(6) as _, i}
                  <div
                    class="dot"
                    class:active={i === currentPage - 1}
                    on:click|stopPropagation={() => goToPage(i + 1)}
                    on:keydown|stopPropagation={(e) =>
                      handleDotKeydown(e, i + 1)}
                    role="button"
                    tabindex="0"
                    aria-label="跳转到第 {i + 1} 页"
                  ></div>
                {/each}
              </div>
            {/if}
            <!-- 右侧箭头 - 固定在右侧 -->
            <button
              class="nav-arrow next-arrow"
              on:click|stopPropagation={nextPage}
              aria-label="下一页"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      {:else if currentPage === 5}
        <!-- 第6页：星光下的夜猫子 -->
        <div class="page late-night-page">
          <h2>星光下的夜猫子</h2>

          <!-- 内容区域：列表或空状态 -->
          <div
            class="night-content-area"
            class:has-content={reportData.stayUpLateRecord.hasLateRecord}
          >
            {#if reportData.stayUpLateRecord.hasLateRecord}
              <div class="night-columns">
                <!-- 左侧：凌晨创建 -->
                {#if reportData.stayUpLateRecord.createdRecords?.length > 0}
                  <div class="night-column left-column">
                    <p class="section-summary">
                      {reportData.stayUpLateRecord.createdMessage}
                    </p>
                    <div class="night-records-list">
                      {#each reportData.stayUpLateRecord.createdRecords as record, index}
                        <div class="night-record-item created">
                          <div class="record-index">{index + 1}</div>
                          <div class="record-content">
                            <div class="record-time">
                              {record.formattedDateTime}
                            </div>
                            {#if record.title}
                              <div class="record-title">{record.title}</div>
                            {:else}
                              <div class="record-no-title">(无标题)</div>
                            {/if}
                          </div>
                          <div class="record-badge created-badge">创建</div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- 中间分隔线 -->
                {#if reportData.stayUpLateRecord.createdRecords?.length > 0 && reportData.stayUpLateRecord.updatedRecords?.length > 0}
                  <div class="vertical-divider"></div>
                {/if}

                <!-- 右侧：凌晨更新 -->
                {#if reportData.stayUpLateRecord.updatedRecords?.length > 0}
                  <div class="night-column right-column">
                    <p class="section-summary">
                      {reportData.stayUpLateRecord.updatedMessage}
                    </p>
                    <div class="night-records-list">
                      {#each reportData.stayUpLateRecord.updatedRecords as record, index}
                        <div class="night-record-item updated">
                          <div class="record-index">{index + 1}</div>
                          <div class="record-content">
                            <div class="record-time">
                              {record.formattedDateTime}
                            </div>
                            {#if record.title}
                              <div class="record-title">{record.title}</div>
                            {:else}
                              <div class="record-no-title">(无标题)</div>
                            {/if}
                          </div>
                          <div class="record-badge updated-badge">更新</div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {:else}
              <!-- 优化的空状态 -->
              <div class="no-night-record">
                <div class="moon-stars-decoration">
                  <svg
                    class="moon-icon"
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                    ></path>
                  </svg>
                  <svg
                    class="star-icon star-1"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="#FFD700"
                  >
                    <path
                      d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8 7.6z"
                    />
                  </svg>
                  <svg
                    class="star-icon star-2"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#C0C0C0"
                  >
                    <path
                      d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8 7.6z"
                    />
                  </svg>
                  <svg
                    class="star-icon star-3"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="#CD7F32"
                  >
                    <path
                      d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8 7.6z"
                    />
                  </svg>
                </div>
                <div class="message">没有熬夜记录</div>
                <p class="emotion-text">
                  这一年，你很懂得照顾自己，没有在凌晨0-4点记录。早睡早起身体好！🌞
                </p>
              </div>
            {/if}
          </div>

          <!-- 底部固定区域：熬夜指数 + 导航 -->
          <div class="bottom-fixed-area">
            <!-- 熬夜指数 -->
            {#if reportData.stayUpLateRecord.comparison}
              <div class="stay-up-late-comparison">
                {#if reportData.stayUpLateRecord.comparison.hasComparison}
                  <!-- 显示对比数据 -->
                  <div class="comparison-percentages">
                    <span>{reportData.year}年熬夜{reportData.stayUpLateRecord.comparison.currentTotal}次,</span>
                    <span>{reportData.year - 1}年熬夜{reportData.stayUpLateRecord.comparison.previousTotal}次，</span>
                    {#if reportData.stayUpLateRecord.comparison.changeType === "increase"}
                      <span class="change-text">熬夜指数增加</span>
                      <span class="change-value increase">
                        ↑{Math.abs(
                          reportData.stayUpLateRecord.comparison.changePercent,
                        )}%
                      </span>
                    {:else if reportData.stayUpLateRecord.comparison.changeType === "decrease"}
                      <span class="change-text">熬夜指数下降</span>
                      <span class="change-value decrease">
                        ↓{Math.abs(
                          reportData.stayUpLateRecord.comparison.changePercent,
                        )}%
                      </span>
                    {:else}
                      <span class="change-text">熬夜指数持平</span>
                    {/if}
                  </div>
                  <!-- 熬夜指数评语 -->
                  <div class="comparison-comment">
                    {#if reportData.stayUpLateRecord.comparison.changeType === "increase"}
                      <p>
                        星光不问赶路人，时光不负有心人。但在追逐梦想的路上，也请记得给身体充充电——毕竟，明天的精彩需要充沛的精力去创造。💪
                      </p>
                    {:else if reportData.stayUpLateRecord.comparison.changeType === "decrease"}
                      <p>
                        很高兴看到你更懂得照顾自己了！规律的作息是长期战斗的基石，愿你继续保持这份对健康的珍视。🌙
                      </p>
                    {:else}
                      <p>
                        作息节奏保持稳定，这本身就是一种难得的坚持。愿你在每一个平凡的日子里，都能找到属于自己的节奏。⭐
                      </p>
                    {/if}
                  </div>
                {:else}
                  <!-- 去年无数据，显示温馨提示 -->
                  <div class="comparison-message">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                      ></path>
                    </svg>
                    <p>{reportData.stayUpLateRecord.comparison.message}</p>
                  </div>
                {/if}
              </div>
            {/if}
            <!-- 导航区域 -->
            <div class="nav-section">
              <!-- 左侧箭头 - 固定在左侧 -->
              <button
                class="nav-arrow prev-arrow"
                on:click|stopPropagation={prevPage}
                aria-label="上一页"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <!-- 中间指示器 -->
              {#if currentPage > 0 && currentPage < 6}
                <div class="page-indicator">
                  {#each Array(6) as _, i}
                    <div
                      class="dot"
                      class:active={i === currentPage - 1}
                      on:click|stopPropagation={() => goToPage(i + 1)}
                      on:keydown|stopPropagation={(e) =>
                        handleDotKeydown(e, i + 1)}
                      role="button"
                      tabindex="0"
                      aria-label="跳转到第 {i + 1} 页"
                    ></div>
                  {/each}
                </div>
              {/if}
              <!-- 右侧箭头 - 固定在右侧 -->
              <button
                class="nav-arrow next-arrow"
                on:click|stopPropagation={nextPage}
                aria-label="下一页"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      {:else}
        <!-- 第7页：年度总结 -->
        <div class="page summary-page">
          <h2>年度总结</h2>
          <div class="summary-text">
            <p>{reportData.year} 年，你是一位</p>
            <p class="highlight">{reportData.rhythmType}</p>
            <p>
              在「{reportData.topNotebooks[0]?.name ||
                "未知"}」上留下了最多痕迹。
            </p>
          </div>
          <div class="actions">
            <button
              class="export-btn primary"
              on:click|stopPropagation={handleExportImage}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              保存图片
            </button>
            <button
              class="export-btn secondary"
              on:click|stopPropagation={handleExportMarkdown}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                ></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              Markdown
            </button>
            <button
              class="export-btn secondary"
              on:click|stopPropagation={handleExportJSON}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              JSON
            </button>
          </div>
          <div class="nav-section">
            <!-- 左侧箭头 - 固定在左侧 -->
            <button
              class="nav-arrow prev-arrow"
              on:click|stopPropagation={prevPage}
              aria-label="上一页"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <!-- 中间指示器 -->
            {#if currentPage > 0 && currentPage < 6}
              <div class="page-indicator">
                {#each Array(6) as _, i}
                  <div class="dot" class:active={i === currentPage - 1}></div>
                {/each}
              </div>
            {:else if currentPage === 6}
              <!-- 最后一页也显示页码指示器 -->
              <div class="page-indicator">
                {#each Array(6) as _, i}
                  <div
                    class="dot"
                    class:active={i === 5}
                    on:click|stopPropagation={() => goToPage(i + 1)}
                    on:keydown|stopPropagation={(e) =>
                      handleDotKeydown(e, i + 1)}
                    role="button"
                    tabindex="0"
                    aria-label="跳转到第 {i + 1} 页"
                  ></div>
                {/each}
              </div>
            {/if}
            <!-- 右侧箭头 - 固定在右侧，最后一页禁用 -->
            <button
              class="nav-arrow next-arrow"
              disabled
              aria-label="下一页"
              aria-disabled="true"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;
  }

  /* Toast 提示 */
  .toast {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.25rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(12px);
    pointer-events: none;
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .toast.success {
    background: rgba(16, 185, 129, 0.95);
    color: white;
  }

  .toast.error {
    background: rgba(239, 68, 68, 0.95);
    color: white;
  }

  /* 导航区域容器 */
  .nav-section {
    position: relative; /* 相对定位，作为箭头绝对定位的参考 */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: auto;
    padding-top: 1.5rem; /* 增加顶部内边距，与内容保持距离 */
    padding-bottom: 0.5rem; /* 底部内边距，确保不贴边 */
    width: 100%;
    align-self: stretch; /* 关键：让 nav-section 占满父元素的全宽，继承 page 的 padding */
    min-height: 60px; /* 确保有足够高度容纳箭头和指示器 */
  }

  /* 导航箭头按钮 - 纯箭头，无背景，固定在左右两侧 */
  .nav-arrow {
    position: absolute; /* 绝对定位，固定在窗口两侧 */
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: auto;
    height: auto;
    border: none;
    background: transparent; /* 透明背景 */
    color: #ffffff; /* 白色箭头 */
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    padding: 8px; /* 增加点击区域 */
    z-index: 10; /* 确保箭头在指示器上方 */
  }

  /* 左侧箭头 */
  .prev-arrow {
    left: -8px; /* 贴左边缘，继承 page 的 padding（减去箭头自身的 padding） */
  }

  /* 右侧箭头 */
  .next-arrow {
    right: -8px; /* 贴右边缘，继承 page 的 padding（减去箭头自身的 padding） */
  }

  .nav-arrow:hover {
    transform: translateY(-50%) scale(1.2); /* 保持垂直居中并放大 */
    opacity: 0.8;
  }

  /* 箭头图标样式 */
  .nav-arrow svg {
    width: 32px; /* 增大箭头图标 */
    height: 32px;
    stroke-width: 3; /* 增加线条粗细 */
  }

  .nav-arrow:active:not(:disabled) {
    transform: translateY(-50%) scale(0.9); /* 保持垂直居中并缩小 */
  }

  /* 禁用状态 */
  .nav-arrow:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .nav-arrow:disabled:hover {
    transform: translateY(-50%); /* 保持垂直居中，不缩放 */
    opacity: 0.3;
  }

  /* 焦点状态（可访问性） */
  .nav-arrow:focus:not(:disabled) {
    outline: 2px solid rgba(102, 126, 234, 0.6);
    outline-offset: 2px;
  }

  .nav-arrow:focus:not(:focus-visible) {
    outline: none; /* 鼠标点击时不显示焦点，键盘导航时显示 */
  }

  /* 下一页箭头 - 使用红色以区分 */
  .next-arrow {
    color: #ff6b6b; /* 红色箭头 */
  }

  .next-arrow:focus:not(:disabled) {
    outline-color: rgba(233, 69, 96, 0.6);
  }

  /* 页码指示器 - 居中显示 */
  .page-indicator {
    display: flex;
    gap: 0.6rem; /* 稍微增加点之间的间距 */
    justify-content: center;
    align-items: center;
    position: relative; /* 相对定位，自然居中 */
    z-index: 1; /* 在箭头下方 */
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
  }

  .dot:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: scale(1.1);
  }

  .dot.active {
    background: rgba(102, 126, 234, 0.95);
    transform: scale(1.3); /* 稍微增大激活状态的点 */
    box-shadow: 0 0 8px rgba(102, 126, 234, 0.5); /* 添加发光效果 */
  }

  /* 焦点状态(可访问性) */
  .dot:focus:not(:active) {
    outline: 2px solid rgba(102, 126, 234, 0.6);
    outline-offset: 2px;
  }

  .dot:focus-visible {
    outline: 2px solid rgba(102, 126, 234, 0.6);
    outline-offset: 2px;
  }

  .mvr-report-container {
    width: var(--mvr-report-width, 900px);
    height: var(--mvr-report-height, 750px);
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    overflow: hidden;
    position: relative;
  }

  .mvr-report-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at 20% 50%,
        rgba(120, 119, 198, 0.1) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 80%,
        rgba(78, 205, 196, 0.1) 0%,
        transparent 50%
      );
    animation: gradientMove 15s ease infinite;
  }

  @keyframes gradientMove {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }

  .loading,
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    color: #e5e7eb;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .error-icon {
    color: #ef4444;
  }

  .retry-btn {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .retry-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: #818cf8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .mvr-report {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
  }

  .page {
    flex: 1;
    padding: 1.5rem 2.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow-y: auto;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(40px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  h2 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #f3f4f6;
    letter-spacing: 0.5px;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .main-stat {
    margin: 1.5rem 0;
  }

  .main-stat .number {
    font-size: 2.8rem;
    font-weight: 700;
    background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: block;
    line-height: 1.2; /* 确保数字完整显示，防止上半部分被截取 */
    padding-top: 0.2rem; /* 为数字上半部分预留空间 */
    margin-bottom: 0.5rem;
    overflow: visible; /* 确保数字不被截取 */
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .main-stat .label {
    font-size: 1.3rem;
    color: #d1d5db;
    font-weight: 400;
  }

  .sub-stats {
    display: flex;
    gap: 1rem;
    margin: 1.5rem 0;
    flex-wrap: wrap;
    justify-content: center;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    min-width: 90px;
    transition: transform 0.3s ease;
  }

  .stat-item:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.06);
  }

  .stat-item .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f3f4f6;
    margin-bottom: 0.5rem;
  }

  .stat-item .label {
    font-size: 0.75rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .emotion-text {
    font-size: 0.95rem;
    color: #d1d5db;
    margin: 1.5rem 0;
    line-height: 1.6;
    font-style: italic;
    font-weight: 300;
    max-width: 85%;
  }

  button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .next-btn {
    background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
  }

  .next-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(233, 69, 96, 0.6);
  }

  .prev-btn {
    background: rgba(255, 255, 255, 0.08);
    color: #e5e7eb;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .prev-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
  }

  /* 第1页：封面 */
  .year-circle {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #e94560 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    box-shadow:
      0 20px 60px rgba(102, 126, 234, 0.4),
      inset 0 2px 10px rgba(255, 255, 255, 0.2);
    animation: float 3s ease-in-out infinite;
    position: relative;
  }

  .year-circle::before {
    content: "";
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #e94560 100%);
    opacity: 0.3;
    filter: blur(20px);
    z-index: -1;
    animation: pulseGlow 2s ease-in-out infinite;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  @keyframes pulseGlow {
    0%,
    100% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.05);
    }
  }
  .year {
    font-size: 2.5rem;
    font-weight: 800;
    color: white;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .cover-page h1 {
    font-size: 1.3rem;
    color: #f3f4f6;
    margin-bottom: 0.8rem;
    font-weight: 600;
  }

  .subtitle {
    color: #9ca3af;
    font-size: 0.95rem;
    margin: 1.5rem auto 1.5rem auto;
    padding: 0 1rem;
    line-height: 1.6;
    text-align: center;
    display: block;
  }

  /* 开始按钮容器 */
  .start-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem; /* 增加元素之间的间距 */
  }

  /* 箭头按钮 - 单独显示 */
  .start-arrow-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.2) 0%,
      rgba(118, 75, 162, 0.2) 100%
    );
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 50%;
    color: #f3f4f6;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
  }

  .start-arrow-btn:hover {
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.3) 0%,
      rgba(118, 75, 162, 0.3) 100%
    );
    border-color: rgba(102, 126, 234, 0.5);
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.25);
    transform: translateX(4px);
  }

  .start-arrow-btn:active {
    transform: scale(0.95) translateX(4px);
  }

  .start-arrow-btn .arrow-icon {
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .start-arrow-btn:hover .arrow-icon {
    transform: translateX(4px);
  }

  /* 开始探索文字 */
  .start-text {
    color: #f3f4f6;
    font-size: 1.1rem;
    font-weight: 500;
    letter-spacing: 1px;
    margin: 0;
  }

  /* 提示文字 */
  .hint-text {
    color: #6b7280;
    font-size: 0.8rem;
    font-weight: 400;
    letter-spacing: 0.5px;
    opacity: 0.8;
    margin: 0;
  }

  /* 第3页：图表 */
  .chart-container {
    width: 100%;
    height: 190px;
    margin: 1rem 0;
    padding: 1rem 1rem;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* 统计卡片 */
  .rhythm-stats {
    align-self: stretch;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    margin-top: 1.5rem;
    padding: 0;
    animation: fadeInUp 0.6s ease-out 0.1s backwards;
  }

  .rhythm-stats .stat-card {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: default;
  }

  .rhythm-stats .stat-card:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(102, 126, 234, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
  }

  .rhythm-stats .stat-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.2) 0%,
      rgba(118, 75, 162, 0.2) 100%
    );
    border-radius: 8px;
    color: #667eea;
  }

  .rhythm-stats .stat-icon svg {
    width: 20px;
    height: 20px;
  }

  .rhythm-stats .stat-content {
    text-align: center;
  }

  .rhythm-stats .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f3f4f6;
    line-height: 1.2;
  }

  .rhythm-stats .stat-label {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.25rem;
  }

  .rhythm-content {
    flex: 1;
    min-width: 0;
  }

  .rhythm-label {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .rhythm-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #f3f4f6;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .rhythm-description {
    font-size: 1.1rem;
    color: #d1d5db;
    margin: 1rem 0;
    font-weight: 400;
    line-height: 1.6;
    text-align: center;
  }

  /* 动画 */
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 第4页：笔记本 */
  .top-notebooks {
    width: 100%;
    max-width: 550px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .notebook-item {
    padding: 1.25rem 1.5rem;
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: slideInUp 0.5s ease-out backwards;
    cursor: default;
  }

  .notebook-item:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(102, 126, 234, 0.4);
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.2),
      0 0 40px rgba(102, 126, 234, 0.1);
    transform: scale(1.02);
  }

  // 依次入场动画
  @for $i from 1 through 10 {
    .notebook-item:nth-child(#{$i}) {
      animation-delay: #{$i * 0.1}s;
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .notebook-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .rank-badge {
    position: relative;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .rank-icon {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rank-icon svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 2px 8px rgba(255, 215, 0, 0.4));
  }

  .rank-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #9ca3af;
  }

  .notebook-info {
    flex: 1;
    min-width: 0;
  }

  .name-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .name {
    font-weight: 600;
    font-size: 1.1rem;
    color: #f3f4f6;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .percentage {
    font-weight: 700;
    font-size: 1.2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    flex-shrink: 0;
  }

  .progress-bar-container {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
    position: relative;
    animation: progressGrow 1s ease-out forwards;
    transform-origin: left;
  }

  .progress-bar::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 100%
    );
    animation: shimmer 2s infinite;
  }

  @keyframes progressGrow {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  /* 排名颜色特殊处理 */
  .notebook-item:nth-child(1) .progress-bar {
    background: linear-gradient(90deg, #ffd700 0%, #ffa500 100%);
  }

  .notebook-item:nth-child(2) .progress-bar {
    background: linear-gradient(90deg, #c0c0c0 0%, #a8a8a8 100%);
  }

  .notebook-item:nth-child(3) .progress-bar {
    background: linear-gradient(90deg, #cd7f32 0%, #b8860b 100%);
  }

  /* 第5页：连续记录分布 */
  .streak-summary-text {
    font-size: 1.1rem;
    color: #d1d5db;
    margin: 1rem 0;
    font-weight: 400;
    line-height: 1.6;
    text-align: center;
  }

  .streak-summary-text strong {
    color: #f093fb;
    font-weight: 600;
  }

  /* 第6页：凌晨记录 */
  .summary-text {
    text-align: center;
    font-size: 1rem;
    color: #d1d5db;
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .night-records-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    max-height: 420px;
    overflow-y: auto;
    padding: 0;
  }

  /* 左右两列布局容器 */
  .night-columns {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
    padding: 0;
    max-width: 100%; /* 使用 max-width 而非 width，防止溢出 */
    overflow: hidden; /* 防止内容溢出 */
  }

  /* 单列容器 */
  .night-column {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  /* 左列 */
  .left-column {
    flex: 1;
  }

  /* 右列 */
  .right-column {
    flex: 1;
  }

  /* 垂直分隔线 */
  .vertical-divider {
    width: 1px;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 100%
    );
    align-self: stretch;
    margin: 0 0;
  }

  .night-section {
    margin-bottom: 0;
  }

  .section-summary {
    font-size: 0.95rem;
    color: #d1d5db;
    text-align: center;
    margin: 0 0 1rem 0;
    padding: 0;
    line-height: 1.5;
    font-weight: 500;
  }

  .section-divider {
    display: none; /* 隐藏水平分隔线 */
  }

  .night-record-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.7rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(79, 172, 254, 0.15);
    border-radius: 10px;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  /* 创建记录 - 蓝色主题 */
  .night-record-item.created {
    border-color: rgba(79, 172, 254, 0.15);
  }

  .night-record-item.created::before {
    background: linear-gradient(180deg, #4facfe 0%, #00f2fe 100%);
  }

  .night-record-item.created:hover {
    background: rgba(79, 172, 254, 0.08);
    border-color: rgba(79, 172, 254, 0.3);
  }

  .night-record-item.created .record-index {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    box-shadow: 0 2px 8px rgba(79, 172, 254, 0.3);
  }

  .night-record-item.created .record-time {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* 更新记录 - 橙色主题 */
  .night-record-item.updated {
    border-color: rgba(251, 146, 60, 0.15);
  }

  .night-record-item.updated::before {
    background: linear-gradient(180deg, #fb923c 0%, #f97316 100%);
  }

  .night-record-item.updated:hover {
    background: rgba(251, 146, 60, 0.08);
    border-color: rgba(251, 146, 60, 0.3);
  }

  .night-record-item.updated .record-index {
    background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
    box-shadow: 0 2px 8px rgba(251, 146, 60, 0.3);
  }

  .night-record-item.updated .record-time {
    background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .night-record-item::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 40%;
    width: 3px;
    opacity: 0.6;
    transition: all 0.2s ease;
  }

  .night-record-item:hover::before {
    opacity: 1;
    height: 50%;
  }

  .record-index {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1f2937;
    font-weight: 700;
    font-size: 0.85rem;
    border-radius: 8px;
  }

  .record-content {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .record-time {
    font-size: 0.95rem;
    font-weight: 700;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    flex-shrink: 0;
  }

  .record-title {
    font-size: 0.9rem;
    color: #e5e7eb;
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    text-align: left;
  }

  .record-no-title {
    font-size: 0.85rem;
    color: #6b7280;
    font-style: italic;
    flex: 1;
  }

  .record-badge {
    flex-shrink: 0;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .record-badge.created-badge {
    background: rgba(79, 172, 254, 0.2);
    color: #4facfe;
  }

  .record-badge.updated-badge {
    background: rgba(251, 146, 60, 0.2);
    color: #fb923c;
  }

  .no-night-record svg {
    color: #a78bfa;
    opacity: 0.6;
  }

  .no-night-record .message {
    font-size: 1.1rem;
    color: #d1d5db;
    font-weight: 500;
  }

  /* 第6页布局优化样式 */
  .late-night-page {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .night-content-area {
    flex: 1; /* 占据所有可用空间 */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    width: 100%;
    align-self: stretch;
    max-width: 100%;
    overflow-x: hidden;
    overflow-y: auto; /* 内容区域可滚动 */
  }

  /* 当有内容时，从顶部开始 */
  .night-content-area.has-content {
    justify-content: flex-start;
  }

  /* 底部固定区域：熬夜指数 + 导航 */
  .bottom-fixed-area {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    width: 100%;
    align-self: center;
    padding: 0 0.5rem;
  }

  /* 熬夜指数在底部固定区域内 */
  .stay-up-late-comparison {
    margin: 0.5rem 0 0.25rem;
    padding: 0;
    width: 100%;
    animation: slideInBottom 0.5s ease-out;
  }

  /* 导航区域保持原有样式 */
  .bottom-fixed-area .nav-section {
    margin: 0;
    padding: 0.5rem 0;
  }

  @keyframes slideInBottom {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 空状态装饰样式 */
  .moon-stars-decoration {
    position: relative;
    width: 120px;
    height: 120px;
    margin-bottom: 1.5rem;
  }

  .moon-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #fbbf24;
    animation: moonGlow 3s ease-in-out infinite;
  }

  @keyframes moonGlow {
    0%,
    100% {
      filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.3));
    }
    50% {
      filter: drop-shadow(0 0 30px rgba(251, 191, 36, 0.5));
    }
  }

  .star-icon {
    position: absolute;
    animation: twinkle 2s ease-in-out infinite;
  }

  .star-1 {
    top: 10px;
    right: 0;
    animation-delay: 0s;
  }

  .star-2 {
    bottom: 20px;
    left: 10px;
    animation-delay: 0.5s;
  }

  .star-3 {
    top: 50%;
    left: -10px;
    animation-delay: 1s;
  }

  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.3;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .no-night-record {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .no-night-record .moon-stars-decoration {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .emotion-text {
    font-size: 0.9rem;
    color: #9ca3af;
    line-height: 1.6;
    margin-top: 0.5rem;
    max-width: 400px;
  }

  /* 第7页：总结 */
  .summary-page .summary-text {
    margin: 1rem 0;
  }

  .summary-text p {
    font-size: 1rem;
    color: #d1d5db;
    margin: 0.5rem 0;
    line-height: 1.6;
  }

  .summary-text .highlight {
    font-size: 1.3rem;
    font-weight: 700;
    background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 1rem 0;
    animation: pulse 2s ease-in-out infinite;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
    margin: 2rem 0;
  }

  .export-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .export-btn.primary {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  }

  .export-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
  }

  .export-btn.secondary {
    background: rgba(255, 255, 255, 0.06);
    color: #e5e7eb;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .export-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .comparison-message {
    padding: 0.35rem 0;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .comparison-percentages {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #9ca3af;
    text-align: center;
  }

  .comparison-percentages span {
    font-size: 1.1rem;
    color: #d1d5db;
    margin: 1rem 0;
    font-weight: 400;
    line-height: 1.6;
    text-align: center;
  }

  .comparison-comment {
    padding: 0.75rem 1rem 1rem;
    text-align: center;
  }

  .comparison-comment p {
    margin: 0;
    font-size: 0.85rem;
    color: #9ca3af;
    line-height: 1.6;
    font-style: italic;
  }

  .change-text {
    font-size: 0.875rem;
    font-weight: 400;
    color: #9ca3af;
    letter-spacing: 0.3px;
  }

  .change-value {
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
  }

  .change-value.increase {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .change-value.decrease {
    background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .change-value.same {
    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 1.2rem;
  }

  .comparison-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
  }

  .comparison-message svg {
    color: #a78bfa;
    opacity: 0.6;
    flex-shrink: 0;
  }

  .comparison-message p {
    font-size: 0.95rem;
    color: #d1d5db;
    line-height: 1.6;
    margin: 0;
    font-style: italic;
    font-weight: 300;
  }

  /* 响应式 */
  @media (max-width: 768px) {
    .page {
      padding: 1.5rem 1rem;
    }

    h2 {
      font-size: 1.1rem;
    }

    .main-stat .number {
      font-size: 2.5rem;
      line-height: 1.2; /* 确保移动端数字完整显示 */
      padding-top: 0.2rem;
    }

    .main-stat .label {
      font-size: 1rem;
    }

    .year-circle {
      width: 120px;
      height: 120px;
    }

    .year {
      font-size: 2.2rem;
    }

    .cover-page h1 {
      font-size: 1.2rem;
    }

    /* 移动端导航优化 */
    .nav-section {
      min-height: 50px; /* 移动端减小高度 */
    }

    .nav-arrow {
      padding: 6px; /* 移动端减小点击区域 */
    }

    /* 移动端箭头位置调整 */
    .prev-arrow {
      left: 1rem; /* 移动端距离左侧更近 */
    }

    .next-arrow {
      right: 1rem; /* 移动端距离右侧更近 */
    }

    .nav-arrow svg {
      width: 28px; /* 移动端箭头图标 */
      height: 28px;
    }

    .page-indicator {
      gap: 0.5rem; /* 移动端减小点之间的间距 */
    }

    .chart-container {
      height: 180px;
    }

    /* 第3页移动端适配 */
    .rhythm-stats {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .rhythm-stats .stat-card {
      padding: 0.75rem 0.5rem;
    }

    .rhythm-stats .stat-icon {
      width: 32px;
      height: 32px;
    }

    .rhythm-stats .stat-icon svg {
      width: 16px;
      height: 16px;
    }

    .rhythm-stats .stat-value {
      font-size: 1rem;
    }

    .rhythm-stats .stat-label {
      font-size: 0.7rem;
    }

    .rhythm-name {
      font-size: 1rem;
    }

    .rhythm-description {
      font-size: 1.1rem;
      color: #d1d5db;
      margin: 1rem 0;
      font-weight: 400;
      line-height: 1.6;
      text-align: center;
    }

    .actions {
      flex-direction: column;
      width: 100%;
    }

    .actions button {
      width: 100%;
      justify-content: center;
    }

    /* 熬夜指数对比移动端样式 */
    .stay-up-late-comparison {
      padding: 0.875rem 0;
      margin-top: 1rem;
    }

    .comparison-percentages {
      font-size: 0.8rem;
      flex-wrap: wrap;
    }

    .change-text {
      font-size: 0.8rem;
    }

    .change-value {
      font-size: 1rem;
    }

    .comparison-comment {
      padding: 0.6rem 0 0;
    }

    .comparison-comment p {
      font-size: 0.8rem;
    }

    .comparison-message p {
      font-size: 0.85rem;
    }

    /* 第6页布局优化响应式 */
    .late-night-page {
      height: 100%;
    }

    .stay-up-late-comparison {
      margin: 0.5rem 0.5rem 0.25rem; /* 移动端也保持0.5rem左右margin */
    }

    .bottom-fixed-area .nav-section {
      padding: 0.4rem 0; /* 移动端减小内边距 */
    }

    .moon-stars-decoration {
      width: 100px;
      height: 100px;
    }

    .moon-icon {
      width: 64px !important;
      height: 64px !important;
    }

    .emotion-text {
      max-width: 300px;
      font-size: 0.85rem;
    }
  }

  /* 减弱动画 */
  @media (prefers-reduced-motion: reduce) {
    .mvr-report-container::before,
    .year-circle,
    .main-stat .number,
    .summary-text .highlight {
      animation: none;
    }

    .page {
      animation: none;
    }

    button {
      transition: none;
    }

    .stay-up-late-comparison,
    .comparison-icon svg {
      animation: none;
      transition: none;
    }
    .mvr-report-container::before,
    .year-circle,
    .main-stat .number,
    .summary-text .highlight {
      animation: none;
    }

    .page {
      animation: none;
    }

    button {
      transition: none;
    }
  }

  /* 第5页：连续天数热力图 */
  .streak-page {
    /* 继承 .page 的基础样式 */
    padding: 1.5rem 2.5rem;

    h2 {
      margin-bottom: 0.8rem; /* 减少标题下边距 */
    }

    .streak-heatmap-section {
      margin: 0.8rem 0;
      width: 100%;
      max-width: 900px;
    }

    .heatmap-chart {
      width: 100%;
      height: 420px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0.8rem;
    }

    .emotion-text {
      margin: 0.8rem 0; /* 减少间距 */
    }

    .streak-summary-text {
      max-width: 800px;
      margin: 0.5rem 0 1rem 0; /* 减少上边距 */
    }
  }

  /* 移动端适配 */
  @media (max-width: 768px) {
    .streak-page {
      .heatmap-chart {
        height: 350px;
      }
    }
  }
</style>
