<script lang="ts">
  export let show = false;

  const version = "1.0.0";
  const github = "https://github.com/jzmanu/siyuan-dashboard";
  const author = "jzman";
  const wechatPublic = "躬行之";
</script>

{#if show}
  <div class="popup-container">
    <h2>关于</h2>
    <div class="popup-content">
      <p class="label">版本：{version}</p>
      <p class="label">Gtihub：<a href={github} target="_blank">链接</a></p>
      <p class="label">作者：{author}</p>
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
  }

  .popup-content {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding:10px 20px 10px;
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