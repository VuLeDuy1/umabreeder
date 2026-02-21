<script lang="ts">
  import CardSlot from "./CardSlot.svelte";

  let {
    slots,
    multipliers,
    onSlotClick
  } = $props<{
    slots: Record<string, any>;
    multipliers: Record<string, number | null> | null;
    onSlotClick?: (detail: { slot: string }) => void;
  }>();

  const layout = [
    { rowClass: "childRow", items: [{ key: "child", label: "Child" }] },
    {
      rowClass: "parentRow",
      items: [
        { key: "p1", label: "Parent 1" },
        { key: "p2", label: "Parent 2" }
      ]
    },
    {
      rowClass: "gpRow",
      items: [
        { key: "gp1", label: "GP 1.1" },
        { key: "gp2", label: "GP 1.2" },
        { key: "gp3", label: "GP 2.1" },
        { key: "gp4", label: "GP 2.2" }
      ]
    }
  ];
</script>

<div class="gridArea">
  {#each layout as row}
    <div class={row.rowClass}>
      {#each row.items as item}
        <CardSlot
          label={item.label}
          image={slots[item.key]?.image}
          multiplier={multipliers?.[item.key]}
          onclick={() => onSlotClick?.({ slot: item.key })}
        />
      {/each}
    </div>
  {/each}
</div>
<style>
  .gridArea {
    align-self: center;
    margin: 0 10px 5px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    gap: 20px;
  }

  .parentRow {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: nowrap;
  }

  .gpRow {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: nowrap;
  }
</style>