<script lang="ts">
  import { storage, type DatabaseView } from '$lib/services/StorageService.svelte';
  import DatabaseTable from './DatabaseTable.svelte';
  import DatabaseKanban from './DatabaseKanban.svelte';
  import DatabaseCalendar from './DatabaseCalendar.svelte';
  import DatabaseGallery from './DatabaseGallery.svelte';
  import { Table, Columns3, Calendar as CalendarIcon, Image as ImageIcon } from 'lucide-svelte';

  let { databaseId } = $props<{ databaseId: string }>();

  let db = $derived(storage.databases[databaseId]);

  function setView(view: DatabaseView) {
    storage.updateDatabase(databaseId, { currentView: view });
  }

  const views = [
    { id: 'table', label: 'Table', icon: Table },
    { id: 'kanban', label: 'Kanban', icon: Columns3 },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
  ] as const;
</script>

{#if db}
<div class="my-8 te-panel overflow-hidden bg-te-bg border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
  <!-- Unified Header -->
  <div class="bg-black text-white p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 border-b-2 border-black">
    <div class="flex items-center gap-3">
      <div class="w-3 h-3 bg-te-orange shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"></div>
      <div>
        <h3 class="font-mono text-[11px] font-black tracking-[0.3em] uppercase">{db.title}</h3>
      </div>
    </div>

    <!-- View Switcher -->
    <div class="flex bg-white/10 p-1 border border-white/20">
      {#each views as view}
        <button 
          onclick={() => setView(view.id)}
          class="flex items-center gap-2 px-3 py-1.5 font-mono text-[9px] uppercase font-black transition-all
                 {db.currentView === view.id ? 'bg-te-orange text-white' : 'hover:bg-white/10 text-white/60'}"
        >
          <view.icon size={12} />
          <span class="hidden md:inline">{view.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="p-1 bg-black/5">
    {#if db.currentView === 'table'}
      <DatabaseTable {databaseId} hideHeader={true} />
    {:else if db.currentView === 'kanban'}
      <DatabaseKanban {databaseId} />
    {:else if db.currentView === 'calendar'}
      <DatabaseCalendar {databaseId} />
    {:else if db.currentView === 'gallery'}
      <DatabaseGallery {databaseId} />
    {:else}
      <div class="p-20 flex flex-col items-center justify-center text-black/20 gap-4">
        <div class="w-12 h-12 border-4 border-current border-t-transparent animate-spin"></div>
        <div class="font-mono text-xs font-black uppercase tracking-widest">{db.currentView}_VIEW_UNDER_CONSTRUCTION</div>
      </div>
    {/if}
  </div>

  <!-- Common Footer -->
  <div class="p-2 bg-gray-100 border-t-2 border-black flex justify-between items-center px-4 text-black">
    <div class="flex items-center gap-6">
      <div class="text-[9px] font-mono font-black uppercase tracking-tighter">
        {db.rows.length} Rows • {db.columns.length} Columns
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .te-panel {
    background-color: #f8f8f8;
    background-image: radial-gradient(#000 0.5px, transparent 0.5px);
    background-size: 20px 20px;
  }
</style>

