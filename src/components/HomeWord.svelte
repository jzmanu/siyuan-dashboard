<script lang="ts">
    import YearWord from './YearWord.svelte';
    import MonthWord from './MonthWord.svelte';
    import WeekWord from './WeekWord.svelte';
    
    export let data: {
      getYearData: (year: number) => Promise< {
        labels: string[];
        values: number[];
      }>;
      getMonthData: (year: number, month: number) => Promise< {
        labels: string[];
        values: number[];
      }>;
      getWeekData: () => Promise< {
        labels: string[];
        values: number[];
      }>;
    };
    
    let activeTab = '年';
    const tabs = ['年', '月', '周'];
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    let year = currentYear;
    let month = currentMonth;
    
    function handleTabChange(tab: string) {
      activeTab = tab;
      year = currentYear;
      month = currentMonth;
    }
    
    function prevYear() {
      year--;
    }
    
    function nextYear() {
      if (year < currentYear) {
        year++;
      }
    }
    
    function prevMonth() {
      if (month === 1) {
        year--;
        month = 12;
      } else {
        month--;
      }
    }
    
    function nextMonth() {
      if (month === 12) {
        if (year < currentYear) {
          year++;
          month = 1;
        }
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        month++;
      }
    }
    
    $: statsTitle = activeTab === '年' ? '年度总字数' : 
                    activeTab === '月' ? '月度总字数' : '周总字数';
    $: avgTitle = activeTab === '年' ? '月平均字数' : 
                  activeTab === '月' ? '日平均字数' : '日均字数';
    
    let yearData = {
      labels: [],
      values: []
    };
    
    let monthData = {
      labels: [],
      values: []
    };

    let weekData = {
      labels: [],
      values: []
    };
    
    $: {
      data.getYearData(year).then(newData => {
        yearData = newData;
      });
    }
    
    $: {
      data.getMonthData(year, month).then(newData => {
        monthData = newData;
      });
    }

    $: {
      data.getWeekData().then(newData => {
        weekData = newData;
      });
    }
    
    $: totalStats = activeTab === '年' ? 
      yearData.values.reduce((a, b) => a + b, 0) : 
      activeTab === '月' ?
      monthData.values.reduce((a, b) => a + b, 0) :
      weekData.values.reduce((a, b) => a + b, 0);
      
    $: avgStats = activeTab === '年' ? 
      Math.round(totalStats / 12) : 
      activeTab === '月' ?
      Math.round(totalStats / monthData.values.length) :
      Math.round(totalStats / 7);
    
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
</script>

<div class="analytics-container">
  <div class="left-section">
    <h3 class="section-title">字数统计</h3>
    <div class="stats-section">
      <div class="general-stats">
        <div class="stat-box">
          <h3>{statsTitle}</h3>
          <div class="stat-value">
            {totalStats}
          </div>
        </div>
        
        <div class="stat-box">
          <h3>{avgTitle}</h3>
          <div class="stat-value">
            {avgStats}
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="chart-section">
    <div class="tab-controls">
      <div class="year-selector">
        {#if activeTab === '年'}
          <span class="year-text">{year}年</span>
          <div class="year-controls">
            <button class="year-btn" on:click={prevYear}>&lt;</button>
            <button class="year-btn" on:click={nextYear} disabled={year >= currentYear}>&gt;</button>
          </div>
        {:else if activeTab === '月'}
          <span class="year-text">{year}年{month}月</span>
          <div class="year-controls">
            <button class="year-btn" on:click={prevMonth}>&lt;</button>
            <button class="year-btn" on:click={nextMonth} 
              disabled={year === currentYear && month >= currentMonth}>&gt;</button>
          </div>
        {:else}
          <span class="year-text">{formattedDate}</span>
          <div class="year-controls">
            <button class="year-btn disabled" disabled>&lt;</button>
            <button class="year-btn disabled" disabled>&gt;</button>
          </div>
        {/if}
      </div>
      {#each tabs as tab}
        <button 
          class="tab-btn" 
          class:active={activeTab === tab}
          on:click={() => handleTabChange(tab)}
        >
          {tab}
        </button>
      {/each}
    </div>
    
    <div class="chart">
      {#if activeTab === '年'}
        <YearWord data={yearData} />
      {:else if activeTab === '月'}
        <MonthWord data={monthData} />
      {:else}
        <WeekWord data={weekData} />
      {/if}
    </div>
  </div>
</div>

<style>
  .analytics-container {
    background: var(--b3-theme-background);
    border-radius: 12px;
    padding: 20px;
    margin-top: 20px;
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 20px;
    height: 400px;
  }
  
  .left-section {
    display: flex;
    flex-direction: column;
    height: 360px;
    text-align: center;
  }
  
  :global(html[data-theme-mode="dark"]) .section-title {
    color: #a1a1b2;
    font-size: 20px;
    font-weight: 500;
    height: 20px;
    padding-left: 40px;
    margin-top: 15px;
    margin-bottom: 20px;
  }

  :global(html[data-theme-mode="light"]) .section-title {
    color: #555555;
    font-size: 20px;
    font-weight: 500;
    height: 20px;
    padding-left: 40px;
    margin-top: 15px;
    margin-bottom: 20px;
  }
  
  .stats-section {
    flex: 1;
    display: flex;
    align-items: flex-end;
  }
  
  .general-stats {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 300px;
    width: 100%;
    padding: 0;
  }
  
  :global(html[data-theme-mode="dark"]) .stat-box {
    background: linear-gradient(45deg, #40403f, #474740);
    padding: 15px;
    border-radius: 8px;
    height: 110px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 15px;
    width: 130px;
  }

  :global(html[data-theme-mode="light"]) .stat-box {
    background: linear-gradient(45deg, #7484f0, #6d46eb);
    padding: 15px;
    border-radius: 8px;
    height: 110px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 15px;
    width: 130px;
  }
  
  :global(html[data-theme-mode="dark"]) .stat-box h3 {
    color: #a1a1b2;
    font-size: 16px;
    margin-bottom: 10px;
    text-align: center;
  }

  :global(html[data-theme-mode="light"]) .stat-box h3 {
    color: #ffffff;
    font-size: 16px;
    margin-bottom: 10px;
    text-align: center;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: white;
    text-align: center;
  }
  
  .chart-section {
    padding: 0;
    margin-left: 40px;
    width: 100%;
    height: 360px;
  }
  
  .tab-controls {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-right: 20px;
    height: 40px;
    margin-bottom: 20px;
    align-items: center;
  }
  
  :global(html[data-theme-mode="dark"]) .tab-btn {
    background: transparent;
    border: none;
    color: #a1a1b2;
    padding: 8px 16px;
    cursor: pointer;
    border-radius: 4px;
  }

  :global(html[data-theme-mode="light"]) .tab-btn {
    background: transparent;
    border: none;
    color: #555555;
    padding: 8px 16px;
    cursor: pointer;
    border-radius: 4px;
  }
  
  :global(html[data-theme-mode="dark"]) .tab-btn.active {
    background: linear-gradient(45deg, #40403f, #474740);
    color: white;
  }

  :global(html[data-theme-mode="light"]) .tab-btn.active {
    background: linear-gradient(45deg, #7484f0, #6d46eb);
    color: white;
  }
  
  .chart {
    height: 300px;
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  :global(.chart canvas) {
    width: 100% !important;
    height: 100% !important;
  }
  
  .year-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: auto;
    width: 200px;
    justify-content: space-between;
  }

  .year-controls {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 70px;
    justify-content: center;
  }
  
  :global(html[data-theme-mode="dark"]) .year-text {
    color: #a1a1b2;
    font-size: 16px;
    font-weight: 500;
    text-align: left;
    width: 120px;
  }

  :global(html[data-theme-mode="light"]) .year-text {
    color: #555555;
    font-size: 16px;
    font-weight: 500;
    text-align: left;
    width: 120px;
  }
  
  .year-btn {
    background: transparent;
    border: none;
    color: #a1a1b2;
    cursor: pointer;
    padding: 4px 8px;
    font-size: 16px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .year-btn:hover {
    background: #323248;
    color: white;
  }
  
  .year-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .year-btn:disabled:hover {
    background: transparent;
    color: #a1a1b2;
  }
  
  .year-btn.disabled {
    opacity: 0.3;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  .year-btn.disabled:hover {
    background: transparent;
    color: #a1a1b2;
  }
</style>