<script lang="ts">
  import "./CharacterPicker.css";
  export type CharacterOption = {
    id: number;
    name: string;
    image: string;
  };

  // Props (Svelte 5 rune)
  let {
    open,
    title,
    options,
    showScore = false,
    scoreById = {},
    onSelect,
    onCancel
  }: {
    open: boolean;
    title: string;
    options: CharacterOption[];
    showScore?: boolean;
    scoreById?: Record<string, number>;
    onSelect: (character: CharacterOption | null) => void;
    onCancel: () => void;
  } = $props();

  // Local state
  let search = $state("");

  // Derived filtered list
  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      o.name.toLowerCase().includes(q)
    );
  });
</script>

{#if open}
  <div class="modalOverlay" role="dialog" aria-modal="true">
    <div class="modalCard">
      <div class="modalHeader">
        <div class="modalTitle">{title}</div>
      </div>

      <div class="modalBody">
        <div class="modalSearchRow">
          <input
            class="modalSearch"
            placeholder="Search..."
            bind:value={search}
          />
        </div>

        <div class="modalGridWrap">
          <div class="modalGrid">

            <!-- None / Remove option -->
            <button
              type="button"
              class="charTile charTile--none"
              onclick={() => onSelect(null)}
            >
              <div class="charCircle charCircle--none">✕</div>
              <div class="charName">None</div>
            </button>

            {#each filtered as c (c.id)}
              <button
                type="button"
                class="charTile"
                onclick={() => onSelect(c)}
              >
                <div class="charCircle">
                  {#if showScore && scoreById && scoreById[c.id] !== undefined}
                    <div
                      class="charScore"
                      title={`Extra Compatibility: ${scoreById[c.id]}`}
                    >
                    {`+${scoreById[c.id]}`}
                    </div>
                  {/if}

                  <img
                    class="charImg"
                    src={c.image}
                    alt={c.name}
                  />
                </div>


                <div class="charName">{c.name}</div>
              </button>
            {/each}

          </div>
        </div>
      </div>

      <div class="modalFooter">
        <button
          type="button"
          class="modalBtn modalBtn--ghost"
          onclick={onCancel}
        >
          Back
        </button>
      </div>
    </div>
  </div>
{/if}