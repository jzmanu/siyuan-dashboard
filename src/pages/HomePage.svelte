<script lang="ts">
  import { onMount } from 'svelte';
  import HomeWord from '../components/HomeWord.svelte';
  import PopupDialog from '../components/AboutDialog.svelte';
  import { Logger } from '../utils/mlog';
  import { Plugin } from "siyuan";
  export let plugin: Plugin; 
  export let stats: {
    days: number;
    daysPercent: number;
    documents: number;
    words: number;
    tags: number;
  };
  export let data: any;
  
  let poem = '';
  
  onMount(async () => {
    try {
      const response = await fetch('https://v1.jinrishici.com/all.txt');
      poem = await response.text();
    } catch (error) {
      Logger.debug('getPoem failed:'+ error);
    }
  });

  let showPopup = false;
  
  function handleHelpClick() {
    showPopup = !showPopup;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.help-button') && !target.closest('.popup-container')) {
      showPopup = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="content">
  <div class="title-container">
    <div class="flex-spacer"></div>
    <h2 class="section-title">{plugin.i18n.dashboard}</h2>
    <div class="flex-spacer"></div>
    <div class="help-button-container">
      <button class="help-button" on:click={handleHelpClick}>
        <svg class="iconAbout" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M579.534628 100.4549c51.650357 2.830465 91.234911 47.115064 88.410586 98.9138-2.823302 51.794643-46.985104 91.488691-98.636484 88.658226-51.653427-2.830465-91.234911-47.117111-88.411609-98.9138C483.720422 137.315412 527.881201 97.622388 579.534628 100.4549zM346.952478 476.020554c0 0 181.473121-133.343961 240.850463-107.345844 59.374272 26.000164-20.908192 190.372815-26.762527 214.69271-5.853311 24.321942-43.48642 210.497155 80.285534 107.343797 0 0 61.884442-41.09393-26.762527 53.671387-88.647993 94.764294-200.708208 124.954897-214.087936 53.673433-10.087753-53.736878 42.903136-248.626567 53.520961-322.035484 3.467985-23.972994-26.76048 0-26.76048 0s-87.010703 61.262272-107.044991 26.838252C317.000306 497.375931 338.46006 480.553801 346.952478 476.020554z" fill=""></path></svg>
      </button>
      <PopupDialog 
        plugin={plugin}
        show={showPopup} 
      />
    </div>
  </div>
  
  <div class="stats-cards">
    <div class="stat-card" style="background: linear-gradient(45deg, #7484f0, #6d46eb)">
      <div class="stat-value">{stats.days}</div>
      <div class="stat-label">
        <h4>{plugin.i18n.days} ({stats.daysPercent}%)</h4>
      </div>
    </div>
    <div class="stat-card" style="background: linear-gradient(45deg, #FF6B6B, #FF8E8E)">
      <div class="stat-value">{stats.documents}</div>
      <div class="stat-label"><h4>{plugin.i18n.notes}</h4></div>
    </div>
    <div class="stat-card" style="background: linear-gradient(45deg, #FFB86C, #FFD93D)">
      <div class="stat-value">{stats.words}</div>
      <div class="stat-label"><h4>{plugin.i18n.words}</h4></div>
    </div>
    <div class="stat-card" style="background: linear-gradient(45deg, #4CAF50, #8BC34A)">
      <div class="stat-value">{stats.tags}</div>
      <div class="stat-label"><h4>{plugin.i18n.tags}</h4></div>
    </div>
  </div>

  <HomeWord 
    plugin={plugin} 
    data={data} 
  />

  <div class="footer-quote">
    {poem}
  </div>
</div>
<style>
  .content {
    padding: 2rem;
    flex: 1;
    overflow-y: auto;
  }

  .title-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  :global(html[data-theme-mode="dark"]) .section-title {
    color: #FFFFFF;
    margin-bottom: 0;
    text-align: center;
  }

  :global(html[data-theme-mode="light"]) .section-title {
    color: #555555;
    margin-bottom: 0;
    text-align: center;
  }


  .stats-cards {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 2rem;
    flex-wrap: nowrap;
    width: 100%;
  }

  .stat-card {
    flex: 1;
    padding: 1.5rem;
    border-radius: 10px;
    text-align: center;
    min-width: 180px;
    max-width: 250px;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: white;
  }

  .stat-label {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
  }

  .stat-label h4 {
    margin: 0;
    white-space: nowrap;
  }

  @media screen and (max-width: 800px) {
    .stats-cards {
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .stat-card {
      min-width: 150px;
      flex: 0 1 calc(50% - 20px);
    }
  }

  .footer-quote {
    text-align: center;
    color: #8899ac;
    font-style: italic;
    font-size: 17px;
    margin-top: 2rem;
  }

  .help-button-container {
    position: relative;
  }

  .help-button {
    background: none;
    border: none;
    color: #4CAF50;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .help-button:hover {
    background-color: rgba(76, 175, 80, 0.1);
  }

  .flex-spacer {
    flex: 1;
  }

  :global(html[data-theme-mode="dark"]) .iconAbout {
    fill: #ffffff;
  }

  :global(html[data-theme-mode="light"]) .iconAbout {
    fill: #555555;
  }
</style> 