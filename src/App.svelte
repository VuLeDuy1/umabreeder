<script lang="ts">
  import AffinityLayout from "./components/AffinityLayout.svelte";
  import CharacterPickerMulti from "./components/CharacterPickerMulti.svelte";
  import CharacterPickerSingle, {
    type CharacterOption
  } from "./components/CharacterPickerSingle.svelte";
  import characters from "./data/characters.json";
  import { duoAffinity, trioAffinity } from "./functions/Affinity";
  import { findOptimalLineage } from "./functions/recommend";


  const characterImages = import.meta.glob(
  '/src/assets/character_sprites/*.png',
  { eager: true, import: 'default' }
  );

  import { onMount } from 'svelte';

  onMount(() => {
    // After first render
    setTimeout(() => {
      preloadImages();
    }, 0);
  });

  function preloadImages() {
    for (const option of baseOptions) {
      const img = new Image();
      img.src = option.image;
    }

    console.log("Preloading started");
  }

  const baseOptions: CharacterOption[] = characters
  .filter((c: any) => c.released === 1)
  .map((c: any) => {
  const imagePath = `/src/assets/character_sprites/${c.name}.png`;

  return {
    id: c.id,
    name: c.name,
    image: characterImages[imagePath] as string
  };
  });

  let activeSlot = $state<keyof typeof slots | null>(null);
  let showPicker = $state(false);

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
    slots = {
      child: null,
      p1: null,
      p2: null,
      gp1: null,
      gp2: null,
      gp3: null,
      gp4: null
    };
  }

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

  const availableIds = baseOptions.map(o => o.id);

  const result = findOptimalLineage(
    lineageIds,
    availableIds,
    { duoAffinity, trioAffinity }
  );

  if (!result) return;

  const idToOption = new Map(baseOptions.map(o => [o.id, o]));

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
  const sumDuoAffinities = (mainId: number | null, companions: (number | null)[]): number => {
    if (!mainId) return 0;
    const sum = companions.reduce((sum, id) => (sum||0) + (duoAffinity(mainId, id) || 0), 0);
    return sum || 0;
  };

  function onFilter(){
    showFilter = true;
  }

  // Define scoring rules for each slot
  const scoringRules: Record<string, (sl: typeof slots) => number> = {
    p1: (s) => sumDuoAffinities(s.p1?.id ?? null, [s.child?.id ?? null, s.p2?.id ?? null, s.gp1?.id ?? null, s.gp2?.id ?? null]),
    p2: (s) => sumDuoAffinities(s.p2?.id ?? null, [s.child?.id ?? null, s.p1?.id ?? null, s.gp3?.id ?? null, s.gp4?.id ?? null]),
    gp1: (s) => trioAffinity(s.gp1?.id ?? null, s.p1?.id ?? null, s.child?.id ?? null) || 0,
    gp2: (s) => trioAffinity(s.gp2?.id ?? null, s.p1?.id ?? null, s.child?.id ?? null) || 0,
    gp3: (s) => trioAffinity(s.gp3?.id ?? null, s.p2?.id ?? null, s.child?.id ?? null) || 0,
    gp4: (s) => trioAffinity(s.gp4?.id ?? null, s.p2?.id ?? null, s.child?.id ?? null) || 0,
  };

  let lineageScores = $derived.by(() => {
    const scores: Record<string, number> = {};
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
    Object.values(lineageScores).reduce((sum, v) => sum + (v ?? 0), 0)
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
  let selectedCharacters = $state<CharacterOption[]>([]);


</script>

<AffinityLayout
  {slots}
  {displayedAffinity}
  {totalCompatibility}
  {lineageScores}
  {onSlotClick}
  {onReset}
  {onRecommend}
  {onFilter}
/>

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