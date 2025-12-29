<script lang="ts">
  import { onMount } from 'svelte';

  let { items, command } = $props<{
    items: any[],
    command: (item: any) => void
  }>();

  let selectedIndex = $state(0);

  export function onKeyDown({ event }: { event: KeyboardEvent }) {
    if (event.key === 'ArrowUp') {
      selectedIndex = (selectedIndex + items.length - 1) % items.length;
      return true;
    }
    if (event.key === 'ArrowDown') {
      selectedIndex = (selectedIndex + 1) % items.length;
      return true;
    }
    if (event.key === 'Enter') {
      selectItem(selectedIndex);
      return true;
    }
    return false;
  }

  function selectItem(index: number) {
    const item = items[index];
    if (item) {
      command(item);
    }
  }
</script>

<div class="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden w-72 flex flex-col z-[1000]">
  <div class="p-2 text-[10px] font-mono font-bold text-white uppercase tracking-widest bg-black flex justify-between">
    <span>Commands</span>
  </div>
  <div class="max-h-80 overflow-y-auto p-1 bg-te-bg">
    {#each items as item, index}
      <button
        onclick={() => selectItem(index)}
        class="w-full text-left px-3 py-2 rounded-none flex items-center gap-4 transition-all {index === selectedIndex ? 'bg-black text-white' : 'text-black hover:bg-gray-200'}"
      >
        <div class="w-10 h-10 flex items-center justify-center font-mono font-bold text-xs border border-current">
          {item.icon}
        </div>
        <div class="flex-1">
          <div class="text-[10px] font-mono font-black uppercase tracking-tight leading-none mb-1 {index === selectedIndex ? 'text-white' : 'text-black'}">{item.title}</div>
          <div class="text-[9px] font-mono opacity-70 leading-tight uppercase {index === selectedIndex ? 'text-white' : 'text-black'}">{item.description}</div>
        </div>
        {#if index === selectedIndex}
          <div class="w-2 h-2 bg-te-orange animate-pulse"></div>
        {/if}
      </button>
    {/each}
  </div>
</div>
