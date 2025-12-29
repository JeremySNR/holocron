<script lang="ts">
  import { storage, type Column } from '$lib/services/StorageService.svelte';
  import { Plus, Trash2, GripVertical, Settings2 } from 'lucide-svelte';

  let { databaseId } = $props<{ databaseId: string }>();

  let db = $derived(storage.databases[databaseId]);
  
  // Find a select column to group by. Default to the first one found.
  let groupingCol = $derived(db?.columns.find(c => c.type === 'select') || db?.columns[0]);
  let options = $derived(groupingCol?.options || ['Todo', 'In Progress', 'Done']);

  function addRow(status: string) {
    if (!db || !groupingCol) return;
    const newRows = [...db.rows, { 
      id: crypto.randomUUID(), 
      [groupingCol.id]: status,
      'col-1': 'New Item' 
    }];
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

  // Simple drag and drop within Kanban (just updating the status)
  function handleDrop(e: DragEvent, newStatus: string) {
    e.preventDefault();
    const rowId = e.dataTransfer?.getData('text/plain');
    if (rowId && groupingCol) {
      updateRow(rowId, { [groupingCol.id]: newStatus });
    }
  }

  function handleDragStart(e: DragEvent, rowId: string) {
    e.dataTransfer?.setData('text/plain', rowId);
  }
</script>

{#if db && groupingCol}
<div class="my-8 flex gap-6 overflow-x-auto pb-4 min-h-[400px]" role="region" aria-label="Kanban board">
  {#each options as option}
    <div 
      class="flex-shrink-0 w-72 flex flex-col"
      role="group"
      aria-label={`${option} column`}
      ondragover={(e) => e.preventDefault()}
      ondrop={(e) => handleDrop(e, option)}
    >
      <!-- Column Header -->
      <div class="bg-black text-white p-2 mb-4 flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(255,62,0,1)]">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 bg-te-orange"></div>
          <h3 class="font-mono text-[9px] font-black uppercase tracking-[0.2em]">{option}</h3>
          <span class="font-mono text-[9px] opacity-40 ml-1">[{db.rows.filter(r => r[groupingCol!.id] === option).length}]</span>
        </div>
        <button type="button" class="p-1 hover:text-te-orange">
          <Settings2 size={10} />
        </button>
      </div>

      <!-- Cards -->
      <div class="flex-1 flex flex-col gap-3" role="list" aria-label={`${option} cards`}>
        {#each db.rows.filter(r => r[groupingCol!.id] === option) as row (row.id)}
          <div 
            role="listitem"
            draggable="true"
            ondragstart={(e) => handleDragStart(e, row.id)}
            class="te-panel bg-white border-2 border-black p-4 group hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-grab active:cursor-grabbing relative"
          >
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onclick={() => deleteRow(row.id)} class="text-gray-300 hover:text-te-orange p-1">
                <Trash2 size={10} />
              </button>
            </div>
            
            <input 
              type="text"
              value={row['col-1'] || ''}
              oninput={(e) => updateRow(row.id, { 'col-1': (e.target as HTMLInputElement).value })}
              class="w-full font-mono text-xs font-black uppercase bg-transparent focus:outline-none mb-2 text-black"
              placeholder="Untitled"
            />
            
            <div class="flex flex-wrap gap-1 mt-2">
              {#each db.columns.filter(c => c.id !== 'col-1' && c.id !== groupingCol!.id) as col}
                {#if row[col.id]}
                  <div class="bg-gray-100 border border-black px-1.5 py-0.5 font-mono text-[8px] uppercase font-bold text-black">
                    {col.name}: {row[col.id]}
                  </div>
                {/if}
              {/each}
            </div>

            <div class="mt-4 flex justify-between items-center opacity-20 text-black">
               <GripVertical size={10} />
               <span class="font-mono text-[8px]">{row.id.slice(0,4)}</span>
            </div>
          </div>
        {/each}
        
        <button 
          onclick={() => addRow(option)}
          class="w-full py-3 border-2 border-dashed border-black/20 hover:border-black hover:bg-black hover:text-white transition-all font-mono text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 text-black"
        >
          <Plus size={10} /> Add Card
        </button>
      </div>
    </div>
  {/each}
</div>
{/if}

<style>
  .te-panel {
    background-image: radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0);
    background-size: 24px 24px;
  }
</style>

