<script lang="ts">
  import "./CharacterPicker.css";
  export type CharacterOption = {
    id: number;
    name: string;
    image: string;
  };

  // Props
  let {
    open,
    title,
    options = [],
    selectedOptions = [],
    onSelect,
    onCancel
  }: {
    open: boolean;
    title: string;
    options: CharacterOption[];
    selectedOptions: CharacterOption[];
    onSelect: (characters: CharacterOption[]) => void;
    onCancel: () => void;
  } = $props();

  // Local state
  let search = $state("");
    let localSelected = $state<CharacterOption[]>([]);

    $effect(() => {
    if (open) {
        localSelected = [...selectedOptions];
    }
    });


  // Derived filtered list
  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      o.name.toLowerCase().includes(q)
    );
  });

  // Toggle individual selection
  function toggleCharacter(c: CharacterOption) {
    const exists = localSelected.some((x) => x.id === c.id);
    if (exists) {
      localSelected = localSelected.filter((x) => x.id !== c.id);
    } else {
      localSelected = [...localSelected, c];
    }
  }

  // Select all / unselect all
  const allSelected = $derived(
    options.length > 0 &&
    localSelected.length === options.length
  );

  function toggleAll() {
    if (allSelected) {
      localSelected = [];
    } else {
      localSelected = [...options];
    }
  }

  function confirmSelection() {
    onSelect(localSelected);
  }
</script>

{#if open}
  <div class="modalOverlay" role="dialog" aria-modal="true">
    <div class="modalCard">
      <div class="modalHeader">
        <div class="modalTitle">{title}</div>
      </div>

      <div class="modalBody">
        <div class="modalHint">Pick one or more characters.</div>

        <div class="modalSearchRow">
          <input
            class="modalSearch"
            placeholder="Search..."
            bind:value={search}
          />
        </div>

        <!-- Select All / Unselect All -->
        <div style="text-align:center;">
          <button
            type="button"
            class="modalBtn modalBtn--ghost"
            style="max-width: 220px;"
            onclick={toggleAll}
          >
            {allSelected ? "Unselect All" : "Select All"}
          </button>
        </div>

        <div class="modalGridWrap">
          <div class="modalGrid">

            {#each filtered as c (c.id)}
              <button
                type="button"
                class="charTile {localSelected.some(x => x.id === c.id) ? 'charTile--selected' : ''}"
                onclick={() => toggleCharacter(c)}
              >
                <div class="charCircle">
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

      <div class="modalFooter" style="gap:12px; justify-content:center;">
        <button
          type="button"
          class="modalBtn modalBtn--ghost"
          onclick={onCancel}
        >
          Back
        </button>

        <button
          type="button"
          class="modalBtn"
          style="background:#39b000; color:white;"
          onclick={confirmSelection}
        >
          Confirm ({localSelected.length})
        </button>
      </div>
    </div>
  </div>
{/if}