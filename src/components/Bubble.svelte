<script lang="ts">
  const { multiplier = null }: { multiplier: number | null } = $props();

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const lerp = (a: number, b: number, t: number) =>
    a + (b - a) * t;

  function multiplierToColor(mult: number) {
    const t = clamp((mult - 1.0) / 0.5, 0, 1);
    const r = Math.round(lerp(220, 80, t));
    const g = Math.round(lerp(70, 200, t));
    const b = 70;
    return `rgb(${r}, ${g}, ${b})`;
  }
</script>

{#if multiplier !== null}
  <div
    class="bubble"
    style={`background:${multiplierToColor(multiplier)}`}
  >
    x{multiplier.toFixed(2)}
  </div>
{/if}


  <style>
    .bubble {
      position: absolute;
      top: -15px;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 14px;
      box-shadow: 0 6px 12px rgba(0,0,0,0.25);
      z-index: 10;
      -webkit-text-stroke: .2px black;

    }
  </style>
