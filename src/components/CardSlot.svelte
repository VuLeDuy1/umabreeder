<script lang="ts">
  import Bubble from "./Bubble.svelte";

  let {
    label,
    image = null,
    multiplier = null,
    onclick
  }: {
    label: string;
    image?: string | null;
    multiplier?: number | null;
    onclick?: () => void;
  } = $props();

  function handleClick() {
    onclick?.();
  }
</script>

<div class="slotWrap">
  {#if multiplier !== null}
    <Bubble {multiplier} />
  {/if}

  <button
    class="slot"
    onclick={handleClick}
  >
    {#if image}
      <img src={image} alt={label} />
    {:else}
      <div class="labelPill">{label}</div>
    {/if}
  </button>
</div>

<style>
  .slotWrap {
    position: relative;
    display: flex;
    justify-content: center;
  }

  .slot {
    width: max(96px, 16vmin);
    aspect-ratio: 1 / 1;
    border-radius: 16%;
    border: 2px dashed #8e7bd1;
    background: #b9b3d6;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .slot:hover {
    transform: translateY(-1px);
  }

  .slot img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .labelPill {
    background: rgba(255,255,255,0.6);
    padding: 8px 14px;
    border-radius: 10px;
    font-weight: 600;
    color: #2e2e2e;
    flex: none;
  }
</style>
