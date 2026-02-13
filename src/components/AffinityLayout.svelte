<script lang="ts">
  import CardSlot from "./CardSlot.svelte";

  // Props (v5 runes)
  let {
    slots,
    displayedAffinity = 0,
    totalCompatibility = 0,
    lineageScores = {},
    onReset,
    onRecommend,
    onFilter,
    onSlotClick
  } = $props<{
    slots: Record<string, { id: number; name: string; image: string } | null>;
    displayedAffinity?: number;
    totalCompatibility?: number;
    lineageScores?: Record<string, number>;
    onReset?: () => void;
    onRecommend?: () => void;
    onFilter?: () => void;
    onSlotClick?: (detail: { slot: string }) => void;
  }>();

  // ========================
  // LOCAL STATE
  // ========================

  function affinityIcon(score: number) {
    if (score >= 151) return "src/assets/icons/double_circle.svg";
    if (score >= 51) return "src/assets/icons/circle.svg";
    return "src/assets/icons/triangle.svg";
  }

  const multipliers = $derived.by(() => {
    const mults: Record<string,number|null> = {};
    if (!lineageScores) return mults;
    for (const key of Object.keys(lineageScores)) {
      if (!lineageScores[key])
        mults[key] = 1;
      else 
        mults[key] = 1 + lineageScores[key] / 100;
    }
    return mults;
  })
</script>



<div class="page">

  <!-- Top Buttons -->
  <div>
    <div class="topBar">
      <button class="pillBtn" onclick={() => onReset?.()}>
        Reset
      </button>

      <button class="pillBtn" onclick={() => onRecommend?.()}>
        Recommend
      </button>
    </div>
    <div class="secondBar">
      <button class="pillBtn" onclick={() => onFilter?.()}>
        Filter
      </button>
    </div>
  </div>
  <!-- Center Layout -->
  <div class="gridArea">

    <div class="childRow">
      <CardSlot
        label="Child"
        image={slots.child?.image}
        onclick={() => onSlotClick?.({ slot: "child" })}
      />
    </div>

    <div class="parentRow">
      <CardSlot
        label="Parent 1"
        image={slots.p1?.image}
        multiplier={multipliers.p1}
        onclick={() => onSlotClick?.({ slot: "p1" })}
      />

      <CardSlot
        label="Parent 2"
        image={slots.p2?.image}
        multiplier={multipliers.p2}
        onclick={() => onSlotClick?.({ slot: "p2" })}
      />
    </div>

    <div class="gpRow">
      <CardSlot label="GP 1.1"
        image={slots.gp1?.image}
        multiplier={multipliers.gp1}
        onclick={() => onSlotClick?.({ slot: "gp1" })}
      />
      <CardSlot label="GP 1.2"
        image={slots.gp2?.image}
        multiplier={multipliers.gp2}
        onclick={() => onSlotClick?.({ slot: "gp2" })}
      />
      <CardSlot label="GP 2.1"
        image={slots.gp3?.image}
        multiplier={multipliers.gp3}
        onclick={() => onSlotClick?.({ slot: "gp3" })}
      />
      <CardSlot label="GP 2.2"
        image={slots.gp4?.image}
        multiplier={multipliers.gp4}
        onclick={() => onSlotClick?.({ slot: "gp4" })}
      />
    </div>

  </div>

  <!-- Bottom Bar -->
  <div class="bottomBar">
    <div class="left">in-game affinity display</div>

    <div class="mid">
      <span class="purple">{displayedAffinity}</span>
    </div>

    <div class='midIcon'> 
      <img src={affinityIcon(displayedAffinity)} alt = 'icon' />
    </div>

    <div class="mid">
      <span class="orange">{totalCompatibility}</span>
    </div>

  <div class="right">
    <span>Total Individual Compatibility</span>

    <a
      href="/compatibility_chart.png"
      target="_blank"
      rel="noopener noreferrer"
      class="infoIcon"
      aria-label="What is Total Individual Compatibility?"
    >
      ?
    </a>
  </div>

  </div>
</div>

<style>
  .page {
    min-height: max(550px, 100vh);
    background: radial-gradient(circle at center, #2b2b35 0%, #1b1b22 70%);
    display: flex;
    flex-direction: column;
  }

  .topBar {
    display: flex;
    justify-content: space-between;
    padding: min(30px,2vh) min(60px,2vw);
  }

  .secondBar {
    display: flex;
    justify-content: right;
    padding: min(30px,1vh) min(60px,2vw);
  }

  .pillBtn {
    background: #b9b3d6;
    padding: 18px 40px;
    border-radius: max(16px,2vmin);
    border: none;
    font-size: 20px;
    font-weight: 600;
    cursor: pointer;
  }

  .gridArea {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    gap: clamp(5px, 20px, 20px);
    padding: 0 max(20px,4vw) 0 0;
  }

  .parentRow {
    display: flex;
    justify-content: center;
    gap: clamp(10px, 20px, 20px);
    flex-wrap: nowrap;
  }

  .gpRow {
    display: flex;
    justify-content: center;
    gap: clamp(5px, 20px, 20px);
    flex-wrap: nowrap;
  }

  .bottomBar {
    display: flex;
    height: 70px;
  }

  .left {
    flex: 1;
    background: #8f84b9;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .mid {
    flex: 1;
    background: #414157;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
  }
  .midIcon {
    flex: 1;
    background: #454575; /* optional */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .midIcon img {
    width: max(35px,6.5vmin);
    aspect-ratio: 1 / 1;
    object-fit: contain;
  }



  .right {
    flex: 1;
    background: #a5c0e6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    position: relative; /* IMPORTANT */
  }

  /* Absolute positioned help icon */
  .infoIcon {
    position: absolute;
    top: 2px;
    right: 3px;

    width: 18px;
    height: 18px;
    border-radius: 50%;

    color: orange;
    font-size: 12px;
    font-weight: bold;

    display: flex;
    align-items: center;
    justify-content: center;

    text-decoration: none;
    cursor: pointer;
  }



  .purple { color: #8f4fff; font-size: 22px; }
  .orange { color: #ff9900; font-size: 22px; }
</style>
