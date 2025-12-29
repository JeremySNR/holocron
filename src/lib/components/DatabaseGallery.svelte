<script lang="ts">
  import { storage } from '$lib/services/StorageService.svelte';
  import { Plus, Trash2, Search } from 'lucide-svelte';

  let { databaseId } = $props<{ databaseId: string }>();

  let db = $derived(storage.databases[databaseId]);
  
  function addRow() {
    if (!db) return;
    const newRows = [...db.rows, { id: crypto.randomUUID(), 'col-1': 'New Item' }];
    storage.updateDatabase(databaseId, { rows: newRows });
  }

  function deleteRow(id: string) {
    if (!db) return;
    const newRows = db.rows.filter(r => r.id !== id);
    storage.updateDatabase(databaseId, { rows: newRows });
  }

  function updateRow(id: string, updates: any) {
    if (!db) return;
    const newRows = db.rows.map(r => r.id === id ? { ...r, ...updates } : r);
    storage.updateDatabase(databaseId, { rows: newRows });
  }

  let searchQuery = $state('');
  let filteredRows = $derived(
    db?.rows.filter(r => 
      Object.values(r).some(v => 
        String(v).toLowerCase().includes(searchQuery.toLowerCase())
      )
    ) || []
  );
</script>

{#if db}
<div class="p-6 bg-white min-h-[500px]">
  <!-- Search Bar -->
  <div class="mb-8 flex items-center border-2 border-black p-3 bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md">
    <Search size={16} class="text-black/30 mr-3" />
    <input 
      type="text" 
      bind:value={searchQuery}
      placeholder="Search gallery..."
      class="bg-transparent font-mono text-xs font-black uppercase tracking-widest focus:outline-none w-full text-black"
    />
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {#each filteredRows as row}
      <div class="border-2 border-black bg-white group hover:shadow-[8px_8px_0px_0px_rgba(255,62,0,1)] transition-all flex flex-col overflow-hidden relative">
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onclick={() => deleteRow(row.id)} class="bg-black text-white p-1.5 hover:bg-te-orange transition-colors">
            <Trash2 size={12} />
          </button>
        </div>

        <!-- Card Image Placeholder -->
        <div class="aspect-video bg-gray-100 border-b-2 border-black flex items-center justify-center overflow-hidden">
          {#if row.cover}
            <img src={row.cover} alt="Cover" class="w-full h-full object-cover" />
          {:else}
             <div class="font-mono text-[9px] font-black text-black/10 uppercase tracking-[0.4em] rotate-12">No Preview</div>
          {/if}
        </div>

        <div class="p-4 flex-1">
          <input 
            type="text"
            value={row['col-1'] || ''}
            oninput={(e) => updateRow(row.id, { 'col-1': (e.target as HTMLInputElement).value })}
            class="w-full font-mono text-xs font-black uppercase bg-transparent focus:outline-none mb-4 text-black border-b border-black/10 focus:border-te-orange"
            placeholder="Untitled"
          />

          <div class="flex flex-col gap-2 text-black">
            {#each db.columns.filter(c => c.id !== 'col-1') as col}
              {#if row[col.id]}
                <div class="flex justify-between items-center gap-2 border-b border-black/5 pb-1">
                  <span class="font-mono text-[8px] opacity-40 uppercase font-black">{col.name}</span>
                  <span class="font-mono text-[8px] uppercase font-black text-right max-w-[120px] truncate">{row[col.id]}</span>
                </div>
              {/if}
            {/each}
          </div>
        </div>

        <div class="bg-black/5 p-2 flex justify-between items-center">
          <span class="font-mono text-[7px] font-black opacity-30 uppercase tracking-widest text-black">{row.id.slice(0,8)}</span>
          <div class="w-1.5 h-1.5 bg-black rounded-full"></div>
        </div>
      </div>
    {/each}

    <!-- Add Card -->
    <button 
      onclick={addRow}
      class="border-2 border-dashed border-black/20 hover:border-black aspect-video flex flex-col items-center justify-center gap-4 group transition-all text-black"
    >
      <div class="w-10 h-10 border-2 border-black/20 group-hover:border-black flex items-center justify-center transition-all">
        <Plus size={20} class="text-black/20 group-hover:text-black transition-all" />
      </div>
      <span class="font-mono text-[9px] font-black uppercase tracking-widest text-black/20 group-hover:text-black transition-all">Add gallery item</span>
    </button>
  </div>
</div>
{/if}

