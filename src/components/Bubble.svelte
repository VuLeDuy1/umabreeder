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

  const state = $derived.by(() => {
    if (multiplier === null) {
      return {
        unset: true,
        display: "x1.00",
        bg: "#e5e5e5"
      };
    }

    return {
      unset: false,
      display: `x${multiplier.toFixed(2)}`,
      bg: multiplierToColor(multiplier)
    };
  });
</script>

<div class="bubble" style={`background:${state.bg}`}>
  {state.display}
</div>

<style>
  .bubble {
    position: absolute;
    top: -14px;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 14px;
    box-shadow: 0 6px 12px rgba(0,0,0,0.25);
    z-index: 10;
  }
</style>
