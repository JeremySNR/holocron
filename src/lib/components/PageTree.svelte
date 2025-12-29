<script lang="ts">
  import { storage, type PageMetadata } from '$lib/services/StorageService.svelte';
  import { dndzone, TRIGGERS, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import PageTree from './PageTree.svelte';

  let { parentId, depth, onPageSelect } = $props<{
    parentId: string | null;
    depth: number;
    onPageSelect: (id: string) => void;
  }>();

  const flipDurationMs = 150;

  // Local items state for this tree level - critical for svelte-dnd-action
  let items = $state<PageMetadata[]>([]);

  // Sync from storage when not dragging
  let isDragging = $state(false);
  
  $effect(() => {
    if (!isDragging) {
      items = storage.pages
        .filter(p => p.parentId === parentId)
        .sort((a, b) => a.order - b.order);
    }
  });

  function handleConsider(e: CustomEvent<{ items: PageMetadata[]; info: { trigger: string } }>) {
    const { trigger } = e.detail.info;
    if (trigger === TRIGGERS.DRAG_STARTED) {
      isDragging = true;
    }
    items = e.detail.items;
  }

  function handleFinalize(e: CustomEvent<{ items: PageMetadata[]; info: { trigger: string } }>) {
    items = e.detail.items;
    
    // Filter out shadow placeholder items
    const realItems = items.filter(item => !(SHADOW_ITEM_MARKER_PROPERTY_NAME in item));
    
    // Persist the new order to storage
    storage.updatePageOrder(parentId, realItems.map(i => i.id));
    
    isDragging = false;
  }

  function handleSelect(id: string) {
    storage.activePageId = id;
    onPageSelect(id);
  }

  function handleCreateSubpage(e: Event, pageId: string) {
    e.stopPropagation();
    storage.createPage('Untitled', pageId);
  }

  function handleToggleCollapse(e: Event, pageId: string) {
    e.stopPropagation();
    storage.togglePageCollapse(pageId);
  }

  function handleDelete(e: Event, pageId: string) {
    e.stopPropagation();
    if (confirm('Delete this page?')) {
      storage.deletePage(pageId);
    }
  }

  function getChildCount(pageId: string): number {
    return storage.pages.filter(p => p.parentId === pageId).length;
  }
</script>

<div
  class="min-h-[2px]"
  use:dndzone={{
    items,
    flipDurationMs,
    type: 'pages',
    dropTargetStyle: { 
      outline: '2px dashed #FF3E00',
      outlineOffset: '-2px',
      background: 'rgba(255, 62, 0, 0.05)'
    },
    dropTargetClasses: ['drop-target-active'],
    dragDisabled: false,
  }}
  onconsider={handleConsider}
  onfinalize={handleFinalize}
>
  {#each items as page (page.id)}
    {@const isActive = storage.activePageId === page.id}
    {@const isCollapsed = storage.collapsedPageIds.has(page.id)}
    {@const childCount = getChildCount(page.id)}
    {@const hasChildren = childCount > 0}
    
    <div animate:flip={{ duration: flipDurationMs }}>
      <!-- Page Item Row -->
      <div
        role="button"
        tabindex="0"
        onclick={() => handleSelect(page.id)}
        onkeydown={(e) => e.key === 'Enter' && handleSelect(page.id)}
        class="
          group flex items-center gap-1 px-2 py-1.5 mx-2 my-0.5 cursor-pointer
          transition-all duration-100 select-none
          border-2 border-transparent
          {isActive 
            ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(255,62,0,1)]' 
            : 'hover:bg-gray-100 hover:border-black/20'
          }
        "
        style="padding-left: {depth * 12 + 8}px"
      >
        <!-- Collapse Toggle -->
        <button
          type="button"
          onclick={(e) => handleToggleCollapse(e, page.id)}
          class="
            w-4 h-4 flex items-center justify-center shrink-0
            font-mono text-[10px] font-bold
            transition-all duration-150
            {hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            {isActive ? 'hover:bg-white/20' : 'hover:bg-black/10'}
          "
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <span class="transition-transform duration-150 {isCollapsed ? '' : 'rotate-90'}">
            ▶
          </span>
        </button>

        <!-- Page Icon & Title -->
        <div class="flex-1 min-w-0 flex items-center gap-1.5">
          <span class="text-sm shrink-0">{page.icon || '📄'}</span>
          <span class="truncate font-mono text-[11px] uppercase tracking-tight font-medium text-black {isActive ? 'text-white' : ''}">
            {page.title || 'Untitled'}
          </span>
          {#if hasChildren}
            <span class="font-mono text-[8px] opacity-40 shrink-0">({childCount})</span>
          {/if}
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onclick={(e) => handleCreateSubpage(e, page.id)}
            class="
              w-5 h-5 flex items-center justify-center
              font-mono text-[10px] font-bold
              {isActive ? 'hover:bg-white/20 text-white' : 'hover:bg-black hover:text-white'}
              transition-colors
            "
            title="Add subpage"
          >
            +
          </button>
          <button
            type="button"
            onclick={(e) => handleDelete(e, page.id)}
            class="
              w-5 h-5 flex items-center justify-center
              font-mono text-[10px]
              {isActive ? 'hover:bg-red-500 text-white' : 'hover:bg-red-500 hover:text-white'}
              transition-colors
            "
            title="Delete page"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Nested Children (Recursive) -->
      {#if hasChildren && !isCollapsed}
        <div class="ml-2 border-l-2 border-black/10">
          <PageTree 
            parentId={page.id} 
            depth={depth + 1}
            {onPageSelect}
          />
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  :global(.drop-target-active) {
    background: rgba(255, 62, 0, 0.05) !important;
  }
</style>

