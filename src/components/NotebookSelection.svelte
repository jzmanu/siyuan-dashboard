<script lang="ts">
  import { onMount } from 'svelte';
  import DashboardPlugin from '../index';
  import { Logger } from "../utils/mlog";
  import { lsNotebooks } from "../api";
  import { NOTEBOOK_SELECTION_CONFIG_STORAGE_KEY, VERSION } from "../base/Config";

  export let plugin: DashboardPlugin;

  interface Notebook {
    id: string;
    name: string;
    icon: string;
    active: boolean;
    sortNo?: number;
  }

  let notebooks: Notebook[] = [];
  let loading = false;
  let error: string | null = null;

  async function initNotebooks() {
    try {
      loading = true;
      // load saved config
      const savedConfig = await plugin.loadData(NOTEBOOK_SELECTION_CONFIG_STORAGE_KEY);
      
      // get current notebooks
      const response = await lsNotebooks();
      if (!response) {
        Logger.error("Failed to get notebooks");
      }

      const currentNotebooks = response.notebooks.map(nb => ({
        id: nb.id,
        name: nb.name,
        icon: nb.icon || "📔",
        active: true
      }));

      // merge config
      if (savedConfig?.notebooks) {
        const mergedNotebooks = currentNotebooks.map(notebook => {
          const saved = savedConfig.notebooks.find(n => n.id === notebook.id);
          return {
            ...notebook,
            active: saved ? saved.active : true,
            sortNo: saved?.sortNo
          };
        });
        notebooks = mergedNotebooks;
      } else {
        notebooks = currentNotebooks;
      }

      // save merged config
      await saveNotebooksConfig();
    } catch (err) {
      error = `Failed to initialize notebooks: ${err}`;
      Logger.error(error);
    } finally {
      loading = false;
    }
  }

  /**
   * save notebooks config
   */
  async function saveNotebooksConfig() {
    try {
      await plugin.saveData(NOTEBOOK_SELECTION_CONFIG_STORAGE_KEY, {
        version: VERSION,
        notebooks,
        lastUpdated: Date.now()
      });
    } catch (err) {
      Logger.error(`Failed to save notebooks config: ${err}`);
    }
  }

  /**
   * toggle notebook status
   */
  async function toggleNotebook(id: string) {
    notebooks = notebooks.map(notebook => 
      notebook.id === id 
        ? { ...notebook, active: !notebook.active }
        : notebook
    );
    await saveNotebooksConfig();
  }

  /**
   * toggle all notebooks
   */
  async function toggleAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    notebooks = notebooks.map(notebook => ({
      ...notebook,
      active: checked
    }));
    await saveNotebooksConfig();
  }

  onMount(() => {
    initNotebooks();
  });
</script>

<button 
  class="notebook-selection" 
  on:click|stopPropagation 
  on:keydown|stopPropagation
  type="button"
>
  <!-- header -->
  <div class="header">
    <label class="checkbox-label">
      <input 
        type="checkbox" 
        checked={notebooks.every(n => n.active)}
        on:change={toggleAll}
      >
      <span>{plugin.i18n.allSelected}</span>
    </label>
  </div>

  <!-- notebooks -->
  <div class="notebooks-list">
    {#if loading}
      <div class="loading">{plugin.i18n.loading}</div>
    {:else if error}
      <div class="error">{error}</div>
    {:else}
      <div class="notebooks-grid">
        {#each notebooks as notebook (notebook.id)}
          <label class="notebook-item">
            <div class="checkbox-wrapper">
              <input 
                type="checkbox" 
                checked={notebook.active}
                on:change={() => toggleNotebook(notebook.id)}
              >
            </div>
            <span class="notebook-name">{notebook.name}</span>
          </label>
        {/each}
      </div>
    {/if}
  </div>
</button>

<style>
  .notebook-selection {
    all: unset; 
    padding: 8px 4px;
    min-width: 120px;
    background: var(--b3-theme-background);
    border-radius: 4px;
    box-shadow: var(--b3-dialog-shadow);
  }

  .header {
    padding: 4px 8px;
    margin-bottom: 4px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
  }

  .notebooks-list {
    max-height: 240px;
    overflow-y: auto;
  }

  .notebooks-grid {
    display: flex;
    flex-direction: column;
  }

  .notebook-item {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    cursor: pointer;
    gap: 8px;
    transition: all 0.15s ease-in-out;
    font-size: 14px;
  }

  .notebook-item:hover {
    background-color: var(--b3-list-hover);
  }

  .notebook-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .checkbox-wrapper {
    display: flex;
    align-items: center;
  }

  input[type="checkbox"] {
    margin: 0;
    cursor: pointer;
  }

  .loading {
    text-align: center;
    color: var(--b3-theme-on-surface);
    padding: 16px;
  }

  .error {
    color: var(--b3-theme-error);
    padding: 16px;
    text-align: center;
  }
</style> 