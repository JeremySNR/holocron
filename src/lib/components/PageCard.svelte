<script lang="ts">
  import { storage } from '$lib/services/StorageService.svelte';

  let { pageId, updateAttributes, editor } = $props<{ 
    pageId: string | null, 
    updateAttributes: (attrs: any) => void,
    editor: any
  }>();

  let searchQuery = $state('');
  
  // Use a derived state for isSelecting based on whether pageId exists
  // but allow it to be toggled manually for changing links
  let forceSelecting = $state(false);
  let isSelecting = $derived(!pageId || forceSelecting);

  let page = $derived(pageId ? storage.pages.find(p => p.id === pageId) : null);
  
  let searchResults = $derived(
    searchQuery.length > 0 
      ? storage.pages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
      : storage.pages.slice(0, 5)
  );

  function selectPage(id: string) {
    updateAttributes({ pageId: id });
    forceSelecting = false;
    searchQuery = '';
  }

  function handleCardClick() {
    if (pageId) {
      storage.activePageId = pageId;
    } else {
      forceSelecting = true;
    }
  }

  function removeLink(e: Event) {
    e.stopPropagation();
    forceSelecting = true;
  }
</script>

<div class="page-card-container my-4">
  {#if isSelecting}
    <div class="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div class="flex items-center justify-between mb-3 text-black">
        <span class="font-mono text-[10px] font-black uppercase tracking-widest text-te-orange">Select a page</span>
        {#if pageId}
          <button onclick={() => forceSelecting = false} class="font-mono text-[8px] uppercase hover:text-te-orange">[Cancel]</button>
        {/if}
      </div>
      <input 
        type="text" 
        bind:value={searchQuery}
        placeholder="Search pages..."
        class="w-full te-input mb-2 text-black"
        onkeydown={(e) => e.stopPropagation()}
      />
      <div class="space-y-1">
        {#each searchResults as result}
          <button 
            type="button"
            onclick={() => selectPage(result.id)}
            class="w-full text-left p-2 border border-black hover:bg-black hover:text-white font-mono text-[10px] uppercase transition-colors flex items-center gap-2 text-black"
          >
            <span>{result.icon || '📄'}</span>
            <span class="truncate">{result.title || 'Untitled'}</span>
          </button>
        {/each}
      </div>
    </div>
  {:else if page}
    <div 
      role="button"
      tabindex="0"
      onclick={handleCardClick}
      onkeydown={(e) => e.key === 'Enter' && handleCardClick()}
      class="page-card-block relative group"
    >
      <span class="page-card-icon">{page.icon || '📄'}</span>
      <span class="page-card-title text-black">{page.title || 'Untitled'}</span>
      
      <button 
        type="button"
        onclick={removeLink}
        class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black text-white px-1.5 py-0.5 font-mono text-[8px] uppercase hover:bg-te-orange transition-all"
      >
        [Change]
      </button>
    </div>
  {:else}
    <div class="bg-red-50 border-2 border-red-500 p-4 font-mono text-xs flex justify-between items-center">
      <span class="text-red-600 uppercase font-bold tracking-widest">Linked page not found</span>
      <button onclick={() => forceSelecting = true} class="te-button text-[10px]">Reset</button>
    </div>
  {/if}
</div>

<style>
  .page-card-container {
    user-select: none;
  }
</style>
