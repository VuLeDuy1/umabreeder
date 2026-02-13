<script lang="ts">
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
        <div class="modalHint">Pick a character.</div>

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
                  {#if showScore && scoreById && scoreById[c.id] !== 0 && scoreById[c.id] !== undefined}
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
                    loading="lazy"
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

<style>
/* ========== Overlay ========== */
.modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px; /* ensures breathing room on small screens */
  z-index: 1000;
}

/* ========== Card ========== */
.modalCard {
  width: min(1100px, 100%);
  height: min(92vh, 100%);
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  overflow: hidden;
  background: #e9e6ea;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

/* ========== Header ========== */
.modalHeader {
  background: #39b000;
  padding: clamp(14px, 2vw, 20px);
  text-align: center;
}

.modalTitle {
  color: white;
  font-size: clamp(18px, 2.5vw, 24px);
  font-weight: 700;
}

/* ========== Body ========== */
.modalBody {
  padding: clamp(16px, 2vw, 24px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1; /* allows grid section to grow */
  min-height: 0; /* critical for flex scroll areas */
}

.modalHint {
  text-align: center;
  font-size: 14px;
  color: #6b4b4b;
}

/* ========== Search ========== */
.modalSearchRow {
  display: flex;
  justify-content: center;
}

.modalSearch {
  width: 100%;
  max-width: 600px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid #cfcfd3;
  background: #f3f3f5;
  font-size: 14px;
  outline: none;
}

.modalSearch:focus {
  border-color: #39b000;
  background: white;
}

/* ========== Scroll Area ========== */
.modalGridWrap {
  flex: 1;
  min-height: 0;
  background: #f4f4f6;
  border-radius: 12px;
  padding: clamp(12px, 2vw, 20px);
  overflow-y: auto;
}

/* Scrollbar */
.modalGridWrap::-webkit-scrollbar {
  width: 8px;
}
.modalGridWrap::-webkit-scrollbar-thumb {
  background: #4b4b4f;
  border-radius: 8px;
}

/* ========== Grid ========== */
.modalGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: max(10px, 1.5vmin);
  justify-items: center;
}

/* ========== Tile ========== */
.charTile {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: transform 0.15s ease;
  width: 100%;
  max-width: 120px;
  outline: none;
}

.charTile:hover {
  transform: translateY(-4px);
}

/* ========== Avatar Circle ========== */
.charCircle {
  width: max(64px, 6vmin);
  aspect-ratio: 1;
  border-radius: 50%;
  background: white;
  border: 2px solid #d5d5d9;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.charCircle--none {
  font-size: 20px;
  color: #999;
}

.charImg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  overflow: hidden;
}

/* ========== Score Badge ========== */
.charScore {
  position: absolute;
  top: max(-30px, -3vh);
  background: #39b000;
  color: white;
  font-size: clamp(10px, 2vw, 12px);
  font-weight: 600;
  padding: 4px 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  z-index: 2;
  border-radius: 40%;
}


/* ========== Name ========== */
.charName {
  font-size: clamp(12px, 2.2vw, 14px);
  font-weight: 600;
  color: #6b2c2c;
  text-align: center;
  word-break: break-word;
}

/* ========== Footer ========== */
.modalFooter {
  background: #dedde2;
  padding: clamp(14px, 2vw, 18px);
  display: flex;
  justify-content: center;
}

.modalBtn {
  width: min(240px, 100%);
  padding: 10px 0;
  border-radius: 10px;
  font-size: clamp(14px, 2vw, 16px);
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.modalBtn--ghost {
  background: #d9d9dc;
  color: #5a2c2c;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.modalBtn--ghost:hover {
  background: #cfcfd4;
}

/* ========== Mobile Adjustments ========== */
@media (max-width: 600px) {
  .modalOverlay {
    align-items: flex-end;
  }

  .modalCard {
    border-radius: 16px 16px 0 0;
    height: 95vh;
  }

  .modalGrid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}
</style>