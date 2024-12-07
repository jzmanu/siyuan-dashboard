<script lang="ts">
    import YearWord from './YearWord.svelte';
    import MonthWord from './MonthWord.svelte';
    import WeekWord from './WeekWord.svelte';
    import { Plugin } from "siyuan";
    export let plugin: Plugin; 
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

    const monthNames = [
        'Jan', 
        'Feb', 
        'Mar', 
        'Apr', 
        'May', 
        'Jun',
        'Jul', 
        'Aug', 
        'Sep', 
        'Oct', 
        'Nov', 
        'Dec'
    ];
    
    let activeTab = plugin.i18n.week;
    const tabs = [plugin.i18n.year, plugin.i18n.month, plugin.i18n.week];
    
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
    
    $: statsTitle = activeTab === plugin.i18n.year ? plugin.i18n.yearTotalWords : 
                    activeTab === plugin.i18n.month ? plugin.i18n.monthTotalWords : plugin.i18n.weekTotalWords;
    $: avgTitle = activeTab === plugin.i18n.year ? plugin.i18n.yearAvgWords : 
                  activeTab === plugin.i18n.month ? plugin.i18n.monthAvgWords : plugin.i18n.weekAvgWords;
    
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
    
    $: totalStats = activeTab === plugin.i18n.year ? 
      yearData.values.reduce((a, b) => a + b, 0) : 
      activeTab === plugin.i18n.month ?
      monthData.values.reduce((a, b) => a + b, 0) :
      weekData.values.reduce((a, b) => a + b, 0);
      
    $: avgStats = activeTab === plugin.i18n.year ? 
      Math.round(totalStats / 12) : 
      activeTab === plugin.i18n.month ?
      Math.round(totalStats / monthData.values.length) :
      Math.round(totalStats / 7);

    /**
     * format year for different language
     * @param year year
     */
    function formatYear(year: number){
      if(plugin.i18n.year === 'Year'){
        return `${year}`;
      }
      return `${year} ${plugin.i18n.year}`;
    }
    /**
     * format year and month for different language
     * @param year year
     * @param month month
     */
    function formatYearMonth(year: number, month: number) {
      if (plugin.i18n.year === 'Year') {
        return `${monthNames[month - 1]} ${year}`;
      }
      return `${year} ${plugin.i18n.year} ${month} ${plugin.i18n.month}`;
    }

    /**
     * format year, month and day for different language
     */
    function formatYearMonthDay() {
      const currentDate = new Date();
      if (plugin.i18n.year === 'Year') {
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getDay()+1}, ${currentDate.getFullYear()}`;
      }
      return `${currentDate.getFullYear()} ${plugin.i18n.year} ${currentDate.getMonth() + 1} ${plugin.i18n.month} ${currentDate.getDate()} ${plugin.i18n.day}`;
    }
</script>

<div class="analytics-container">
  <div class="left-section">
    <h3 class="section-title">{plugin.i18n.wordStats}</h3>
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
        {#if activeTab === plugin.i18n.year}
          <span class="year-text">
            {formatYear(year)}
          </span>
          <div class="year-controls">
            <button class="year-btn" on:click={prevYear}>&lt;</button>
            <button class="year-btn" on:click={nextYear} disabled={year >= currentYear}>&gt;</button>
          </div>
        {:else if activeTab === plugin.i18n.month}
          <span class="year-text">
            {formatYearMonth(year, month)}
          </span>
          <div class="year-controls">
            <button class="year-btn" on:click={prevMonth}>&lt;</button>
            <button class="year-btn" on:click={nextMonth} 
              disabled={year === currentYear && month >= currentMonth}>&gt;</button>
          </div>
        {:else}
          <span class="year-text">{formatYearMonthDay()}</span>
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
      {#if activeTab === plugin.i18n.year}
        <YearWord 
          plugin={plugin} 
          data={yearData} 
        />
        {:else if activeTab === plugin.i18n.month}
        <MonthWord 
          plugin={plugin} 
          data={monthData} 
        />
      {:else}
        <WeekWord 
          plugin={plugin} 
          data={weekData} 
        />
      {/if}
    </div>
  </div>
</div>

<style>
  .analytics-container {
    background: var(--b3-theme-background);
    border-radius: 12px;
    padding: 20px 40px 20px 20px;
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
    padding-right: 50px;
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
    padding-right: 40px;
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