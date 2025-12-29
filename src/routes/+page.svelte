<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Editor from '$lib/components/Editor.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
  import { storage } from '$lib/services/StorageService.svelte';
  import { semanticSearch, type SearchResult } from '$lib/services/SemanticSearchService';

  let activePage = $derived(storage.pages.find(p => p.id === storage.activePageId) || storage.pages[0]);
  
  let searchQuery = $state('');
  let keywordResults = $derived(
    searchQuery.length > 0 
      ? storage.pages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())) 
      : []
  );

  let semanticResults = $state<SearchResult[]>([]);
  let isSearching = $state(false);

  async function handleSearchInput(e: Event) {
    searchQuery = (e.target as HTMLInputElement).value;

    if (searchQuery.length > 2) {
      isSearching = true;
      semanticResults = await semanticSearch.search(searchQuery);
      isSearching = false;
    } else {
      semanticResults = [];
    }
  }

  function handlePageSelect(id: string) {
    console.log('App: Handle Page Select', id);
    storage.activePageId = id;
    searchQuery = '';
    semanticResults = [];
  }
</script>

<div class="flex h-screen w-full bg-te-bg text-black font-sans antialiased overflow-hidden relative">
  <!-- Sidebar -->
  <div class="
    fixed inset-0 z-40 transition-transform duration-300 lg:relative lg:inset-auto lg:translate-x-0
    {storage.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:block
  ">
    <!-- Overlay for mobile -->
    {#if storage.isSidebarOpen}
      <button 
        type="button"
        onclick={() => storage.isSidebarOpen = false}
        class="absolute inset-0 bg-black/50 lg:hidden"
        aria-label="Close sidebar"
      ></button>
    {/if}
    <Sidebar activePageId={storage.activePageId} onPageSelect={handlePageSelect} />
  </div>
  
  <main class="flex-1 flex flex-col h-full overflow-hidden bg-white min-w-0">
    <!-- Industrial Header -->
    <header class="h-14 border-b border-te-border bg-te-bg flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
      <div class="flex items-center gap-2 sm:gap-4 h-full min-w-0">
        <!-- Mobile Menu Toggle -->
        <button 
          type="button"
          onclick={() => storage.isSidebarOpen = !storage.isSidebarOpen}
          class="lg:hidden p-2 hover:bg-black/5 transition-colors"
          aria-label="Toggle menu"
        >
          <div class="w-5 h-0.5 bg-black mb-1"></div>
          <div class="w-5 h-0.5 bg-black mb-1"></div>
          <div class="w-5 h-0.5 bg-black"></div>
        </button>

        <div class="h-full flex items-center border-r border-te-border pr-2 sm:pr-4 min-w-0">
          <span class="font-mono text-[10px] uppercase font-bold tracking-widest text-gray-500 mr-2 hidden sm:inline">Page</span>
          <span class="font-mono text-xs uppercase font-bold truncate">{activePage?.title || 'Untitled'}</span>
        </div>
        <div class="hidden md:flex items-center gap-2 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-tighter">
          <span>{new Date().toLocaleDateString()}</span>
          <span class="w-1 h-1 bg-te-orange"></span>
          <span>{storage.activePageId.slice(0, 8)}</span>
        </div>
      </div>
      
      <div class="flex items-center gap-2 sm:gap-4 relative h-full">
        <div class="relative flex items-center h-full">
          <span class="absolute left-3 text-[10px] font-mono font-bold hidden sm:inline">CMD</span>
          <input 
            type="text" 
            placeholder="Search..." 
            oninput={handleSearchInput}
            bind:value={searchQuery}
            class="pl-3 sm:pl-12 pr-3 py-1 bg-white border border-te-border font-mono text-[10px] sm:text-xs uppercase tracking-tighter focus:ring-1 focus:ring-te-orange w-32 sm:w-48 md:w-64 h-8"
          />
          
          {#if keywordResults.length > 0 || semanticResults.length > 0 || isSearching}
            <div class="absolute top-12 right-0 w-[calc(100vw-2rem)] sm:w-96 bg-white border border-te-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-50">
              {#if keywordResults.length > 0}
                <div class="p-2 text-[10px] font-mono font-bold text-white uppercase tracking-widest bg-black">
                  Keyword Matches
                </div>
                {#each keywordResults as result}
                  <button 
                    type="button"
                    onclick={() => handlePageSelect(result.id)}
                    class="w-full text-left p-3 hover:bg-te-orange hover:text-white flex items-center gap-3 transition-colors border-b border-te-border last:border-none group text-black"
                  >
                    <div class="flex-1">
                      <div class="text-xs font-mono uppercase font-bold tracking-tight">{result.title}</div>
                    </div>
                  </button>
                {/each}
              {/if}

              {#if semanticResults.length > 0}
                <div class="p-2 text-[10px] font-mono font-bold text-white uppercase tracking-widest bg-te-orange">
                  Semantic Results
                </div>
                {#each semanticResults as result}
                  {#if !keywordResults.find(k => k.id === result.id)}
                    <button 
                      type="button"
                      onclick={() => handlePageSelect(result.id)}
                      class="w-full text-left p-3 hover:bg-black hover:text-white flex items-center gap-3 transition-colors border-b border-te-border last:border-none group bg-gray-50 text-black"
                    >
                      <div class="flex-1">
                        <div class="text-xs font-mono uppercase font-bold tracking-tight">{result.title}</div>
                        <div class="text-[9px] font-mono opacity-50 group-hover:text-white">{(result.score * 100).toFixed(1)}% match</div>
                      </div>
                    </button>
                  {/if}
                {/each}
              {/if}

              {#if isSearching}
                <div class="p-4 text-center font-mono text-[10px] uppercase animate-pulse text-black">
                  Searching...
                </div>
              {/if}
            </div>
          {/if}
        </div>
        <div class="h-full flex items-center border-l border-te-border pl-2 sm:pl-4 gap-2 sm:gap-3">
          <button type="button" class="font-mono text-[10px] uppercase font-bold hover:text-te-orange hidden sm:inline">Sync</button>
          <div class="w-2 h-2 sm:w-3 sm:h-3 bg-black"></div>
        </div>
      </div>
    </header>
    
    <div class="flex-1 overflow-hidden flex">
      {#key storage.activePageId}
        {#if activePage}
          <Editor 
            pageId={storage.activePageId} 
            title={activePage.title} 
          />
        {/if}
      {/key}
    </div>
  </main>

  <SettingsModal bind:isOpen={storage.isSettingsOpen} />
</div>
