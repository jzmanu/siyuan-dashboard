<script lang="ts">
  import { VERSION } from "@/base/Config";
  import { Plugin } from "siyuan";
  export let plugin: Plugin; 
  export let show = false;

  const version = VERSION;
  const github = "https://github.com/jzmanu/siyuan-dashboard";
  const author = "jzman";
</script>

{#if show}
  <div class="popup-container">
    <h2>{plugin.i18n.about}</h2>
    <div class="popup-content">
      <p class="label">{plugin.i18n.version}：{version}</p>
      <p class="label">{plugin.i18n.github}：<a href={github} target="_blank">{plugin.i18n.link}</a></p>
      <p class="label">{plugin.i18n.author}：{author}</p>
    </div>
  </div>
{/if}

<style>
  .popup-container {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--b3-theme-background);
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    padding: 8px;
    z-index: 1000;
    margin-top: 24px;
  }

  .popup-content {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 10px 20px 10px;
  }

  :global(html[data-theme-mode="dark"]) h2,
  :global(html[data-theme-mode="light"]) h2 {
    text-align: center;
    margin: 0 0 0 0;
    font-size: 16px;
    font-weight: 500;
  }

  :global(html[data-theme-mode="dark"]) h2 {
    color: #ffffff;
  }

  :global(html[data-theme-mode="light"]) h2 {
    color: #555555;
  }
</style> 