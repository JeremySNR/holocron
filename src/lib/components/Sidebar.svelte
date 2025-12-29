<script lang="ts">
  import { storage } from '$lib/services/StorageService.svelte';
  import PageTree from './PageTree.svelte';

  let { activePageId, onPageSelect } = $props<{ 
    activePageId: string, 
    onPageSelect: (id: string) => void 
  }>();

  const rootPages = $derived(
    storage.pages
      .filter(p => !p.parentId)
      .sort((a, b) => a.order - b.order)
  );
</script>

<aside class="w-64 lg:w-72 h-full bg-te-bg border-r-2 border-black flex flex-col overflow-hidden relative">
  <div class="p-4 sm:p-6 border-b-2 border-black bg-te-bg">
    <div class="flex items-center justify-between mb-3">
      <h1 class="text-sm tracking-[0.2em] font-black">HOLOCRON</h1>
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-green-500 animate-pulse"></div>
        <span class="font-mono text-[8px] uppercase tracking-widest opacity-50">ONLINE</span>
        <button 
          onclick={() => storage.isSidebarOpen = false}
          class="lg:hidden w-6 h-6 border-2 border-black flex items-center justify-center font-mono text-[10px] font-bold hover:bg-black hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
    <div class="flex gap-1">
      <div class="h-1 flex-1 bg-black"></div>
      <div class="h-1 flex-1 bg-te-orange"></div>
      <div class="h-1 flex-1 bg-black opacity-30"></div>
    </div>
  </div>
  
  <nav class="flex-1 overflow-y-auto py-3">
    <div class="px-4 py-2 mb-2">
      <span class="font-mono text-[9px] text-black/40 font-bold uppercase tracking-[0.15em] border-b border-black/20 pb-1 block">
        ▸ PAGES
      </span>
    </div>
    
    <PageTree 
      parentId={null} 
      depth={0}
      {onPageSelect}
    />

    {#if rootPages.length === 0}
      <div class="px-4 py-8 text-center">
        <p class="font-mono text-[10px] text-black/30 uppercase">No pages yet</p>
      </div>
    {/if}
  </nav>

  <div class="p-3 border-t-2 border-black bg-te-bg space-y-2">
    <button 
      onclick={() => storage.createPage('Untitled')}
      class="w-full px-3 py-2 bg-black text-white font-mono text-xs uppercase tracking-wider flex items-center justify-between hover:bg-te-orange hover:text-black transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
    >
      <span>New Page</span>
      <span class="text-lg leading-none">+</span>
    </button>
    
    <div class="flex gap-2">
      <button 
        onclick={() => storage.isSettingsOpen = !storage.isSettingsOpen} 
        class="flex-1 px-2 py-1.5 bg-white font-mono text-[10px] uppercase tracking-wider border-2 border-black hover:bg-gray-100 transition-colors"
      >
        ⚙ Settings
      </button>
      <div class="flex-1 px-2 py-1.5 bg-white font-mono text-[10px] uppercase tracking-wider border-2 border-black flex items-center justify-center gap-1">
        <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
        <span class="opacity-60">Ready</span>
      </div>
    </div>
  </div>
</aside>
