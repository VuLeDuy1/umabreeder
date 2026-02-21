<script lang="ts">
  import CharacterPickerMulti from "./components/CharacterPickerMulti.svelte";
  import CharacterPickerSingle, {
    type CharacterOption
  } from "./components/CharacterPickerSingle.svelte";
  import { duoAffinity, trioAffinity } from "./functions/Affinity";
  import { findOptimalLineage } from "./functions/Recommend";
  import "./LineagePage.css";
  import explainImage from "/compatibility_chart.png"
  import {affinityIcon,
          preloadImages,
          baseOptions,
          idToOption}
    from "./LineagePage";
  import LineageGrid from "./components/LineageGrid.svelte";

  import {onMount} from "svelte";
  onMount(() => {
    // After first render
    setTimeout(() => {
      preloadImages();
    }, 0);
  });

  // Svelte 5 state rune
  let slots = $state<{
    child: CharacterOption | null;
    p1: CharacterOption | null;
    p2: CharacterOption | null;
    gp1: CharacterOption | null;
    gp2: CharacterOption | null;
    gp3: CharacterOption | null;
    gp4: CharacterOption | null;
  }>({
    child: null,
    p1: null,
    p2: null,
    gp1: null,
    gp2: null,
    gp3: null,
    gp4: null
  });

  // Define exclusion rules for each slot
  const exclusionRules: Record<string, (sl: typeof slots) => string[]> = {
    child: (s) => [s.p1?.name, s.p2?.name].filter(Boolean) as string[],
    p1: (s) => [s.child?.name, s.p2?.name, s.gp1?.name, s.gp2?.name].filter(Boolean) as string[],
    p2: (s) => [s.child?.name, s.p1?.name, s.gp3?.name, s.gp4?.name].filter(Boolean) as string[],
    gp1: (s) => [s.p1?.name, s.gp2?.name].filter(Boolean) as string[],
    gp2: (s) => [s.p1?.name, s.gp1?.name].filter(Boolean) as string[],
    gp3: (s) => [s.p2?.name, s.gp4?.name].filter(Boolean) as string[],
    gp4: (s) => [s.p2?.name, s.gp3?.name].filter(Boolean) as string[],
  };

  let activeSlot = $state<keyof typeof slots | null>(null);
  let showPicker = $state(false);

  let options = $derived.by(() => {
    const excluded = new Set(activeSlot ? exclusionRules[activeSlot]?.(slots).filter(Boolean) ?? [] : []);
    return baseOptions.filter((c) => !excluded.has(c.name));
  });

  function onSlotClick(detail: { slot: string }) {
    activeSlot = detail.slot as keyof typeof slots;
    showPicker = true;
  }

  function onSelect(character: CharacterOption | null)
  {
    if (activeSlot) {
      slots[activeSlot] = character;
    }

    showPicker = false;
    activeSlot = null;

  }

function onCancel() {
  showPicker = false;
  activeSlot = null;
}

function onReset(){
  slots = Object.fromEntries(
    Object.keys(slots).map(k => [k, null])
  ) as typeof slots
}

let showAlert = $state(false);
let alertMessage = $state("");

function onRecommend() {
  const lineageIds = [
    slots.child?.id ?? null,
    slots.p1?.id ?? null,
    slots.p2?.id ?? null,
    slots.gp1?.id ?? null,
    slots.gp2?.id ?? null,
    slots.gp3?.id ?? null,
    slots.gp4?.id ?? null
  ];

  const availableIds = selectedCharacters.map(o => o.id);

  const result = findOptimalLineage(
    lineageIds,
    availableIds,
    { duoAffinity, trioAffinity }
  );


  if (!result) {
    //alert user filter have too few characters
    showAlert = true;
    alertMessage = "Recommendation failed. Please ensure your filter includes enough characters to fill all slots.";
    return
  };

  slots = {
    child: idToOption.get(result.child) ?? null,
    p1: idToOption.get(result.p1) ?? null,
    p2: idToOption.get(result.p2) ?? null,
    gp1: idToOption.get(result.gp1) ?? null,
    gp2: idToOption.get(result.gp2) ?? null,
    gp3: idToOption.get(result.gp3) ?? null,
    gp4: idToOption.get(result.gp4) ?? null
  };
}

  // Helper to sum duo affinities
  const sumDuoAffinities = (mainId: number | null, companions: (number | null)[]): number | null => {
    if (!mainId) return null;
    const sum = companions.reduce((sum, id) => (sum||0) + (duoAffinity(mainId, id) || 0), 0);
    return sum;
  };

  function onFilter(){
    showFilter = true;
  }

  // Define scoring rules for each slot
  const scoringRules: Record<string, (sl: typeof slots) => number | null> = {
    p1: (s) => sumDuoAffinities(s.p1?.id ?? null, [s.child?.id ?? null, s.p2?.id ?? null, s.gp1?.id ?? null, s.gp2?.id ?? null]),
    p2: (s) => sumDuoAffinities(s.p2?.id ?? null, [s.child?.id ?? null, s.p1?.id ?? null, s.gp3?.id ?? null, s.gp4?.id ?? null]),
    gp1: (s) => trioAffinity(s.gp1?.id ?? null, s.p1?.id ?? null, s.child?.id ?? null),
    gp2: (s) => trioAffinity(s.gp2?.id ?? null, s.p1?.id ?? null, s.child?.id ?? null),
    gp3: (s) => trioAffinity(s.gp3?.id ?? null, s.p2?.id ?? null, s.child?.id ?? null),
    gp4: (s) => trioAffinity(s.gp4?.id ?? null, s.p2?.id ?? null, s.child?.id ?? null),
  };

  let lineageScores = $derived.by(() => {
    const scores: Record<string, number | null> = {};
    for (const [key, scoreFn] of Object.entries(scoringRules)) {
      scores[key] = scoreFn(slots);
    }
    return scores;
  });

  
  let displayedAffinity = $derived.by(() => {
    let total = 0;
    const p1 = duoAffinity(
      slots.p1?.id ?? null,
      slots.child?.id ?? null
    ) || 0;
    const p2 = duoAffinity(
      slots.p2?.id ?? null,
      slots.child?.id ?? null
    ) || 0;
    const p2p = duoAffinity(
      slots.p1?.id ?? null,
      slots.p2?.id ?? null
    ) || 0;
    const gps = 
    (trioAffinity(
      slots.gp1?.id ?? null,
      slots.p1?.id ?? null,
      slots.child?.id ?? null
    ) || 0) +
    (trioAffinity(
      slots.gp2?.id ?? null,
      slots.p1?.id ?? null,
      slots.child?.id ?? null
    ) || 0) +
    (trioAffinity(
      slots.gp3?.id ?? null,
      slots.p2?.id ?? null,
      slots.child?.id ?? null
    ) || 0) +
    (trioAffinity(
      slots.gp4?.id ?? null,
      slots.p2?.id ?? null,
      slots.child?.id ?? null
    ) || 0);
    total = p1 + p2 + p2p + gps;
    return total;
  });
  let totalCompatibility = $derived.by(() =>
    Object.values(lineageScores).reduce((sum:number, v) => sum + (v ?? 0), 0)
  );

  function extraCompatibilityScores(
    sl: typeof slots,
    activeSlot: keyof typeof slots | null
  ): Record<string, number>|undefined {
    if (!activeSlot) return undefined;
    //if no slot are filled, no extra scores
    if (Object.values(sl).every((slot: CharacterOption | null) => slot === null)) {
      return undefined;
    }
    const scores: Record<string, number> = {};

    // Clone current slots
    const baseSlots = { ...sl };

    // Compute compatibility when active slot is EMPTY
    const emptySlots = { ...baseSlots, [activeSlot]: null };

    const baseScore = Object.entries(scoringRules).reduce(
      (sum, [key, fn]) => sum + (fn(emptySlots) ?? 0),
      0
    );

    // For each available character option
    for (const option of options) {
      const simulatedSlots = {
        ...baseSlots,
        [activeSlot]: option
      };

      const simulatedScore = Object.entries(scoringRules).reduce(
        (sum, [key, fn]) => sum + (fn(simulatedSlots) ?? 0),
        0
      );

      scores[option.id] = simulatedScore - baseScore;
    }

    return scores;
  }

  let showFilter = $state(false);
  let selectedCharacters = $state(baseOptions);

  let multipliers = $derived.by(() => {
    const mults: Record<string,number|null> = {};
    if (lineageScores === null) return null;
    for (const key of Object.keys(lineageScores)) {
      if (lineageScores[key] !== null)
        mults[key] = 1 + lineageScores[key] / 100;
      else 
        mults[key] = null;
    }
    return mults;
  })

</script>

<div class="page">
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

  <LineageGrid
    {slots}
    {multipliers}
    {onSlotClick}
  />

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
      href={explainImage}
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

{#if showPicker}
  <CharacterPickerSingle
    open={showPicker}
    title="Select a Character"
    {options}
    {onSelect}
    {onCancel}
    scoreById={extraCompatibilityScores(slots, activeSlot)}
    showScore={true}
  />
{/if}

{#if showFilter}
  <CharacterPickerMulti
    open={showFilter}
    title="Filter Characters"
    options={baseOptions}
    selectedOptions={selectedCharacters}
    onSelect={(chars) => {
      selectedCharacters = chars;
      showFilter = false;
    }}
    onCancel={() => {
      showFilter = false;
    }}
  />
{/if}

{#if showAlert}
  <div class="alertOverlay" role="alertdialog" aria-modal="true">
    <div class="alertCard">
      <div class="alertMessage">{alertMessage}</div>
      <button class="alertBtn" onclick={() => showAlert = false}>OK</button>
    </div>
  </div>
{/if}