<script lang="ts">
  import { storage, type Column } from '$lib/services/StorageService.svelte';
  import { Plus, Trash2, Settings2, Hash, Type, CheckSquare, ListFilter, Link as LinkIcon, Calendar } from 'lucide-svelte';

  let { databaseId, hideHeader = false } = $props<{ databaseId: string, hideHeader?: boolean }>();

  let db = $derived(storage.databases[databaseId]);

  function addRow() {
    if (!db) return;
    storage.updateDatabase(databaseId, { rows: [...db.rows, { id: crypto.randomUUID() }] });
  }

  function updateCell(rowIndex: number, colId: string, value: any) {
    if (!db) return;
    const newRows = [...db.rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [colId]: value };
    storage.updateDatabase(databaseId, { rows: newRows });
  }

  function addColumn() {
    if (!db) return;
    const newCol: Column = {
      id: `col-${Date.now()}`,
      name: 'Property',
      type: 'text',
      width: 150
    };
    storage.updateDatabase(databaseId, { columns: [...db.columns, newCol] });
  }

  function deleteRow(index: number) {
    if (!db) return;
    storage.updateDatabase(databaseId, { rows: db.rows.filter((_, i) => i !== index) });
  }

  const typeIcons: Record<string, any> = {
    text: Type,
    number: Hash,
    checkbox: CheckSquare,
    select: ListFilter,
    relation: LinkIcon,
    date: Calendar
  };

  let showPropSettings = $state<string | null>(null);
  let editingCol = $derived(db?.columns.find(c => c.id === showPropSettings));

  function updateColumn(colId: string, updates: Partial<Column>) {
    if (!db) return;
    storage.updateDatabase(databaseId, { 
      columns: db.columns.map(c => c.id === colId ? { ...c, ...updates } : c) 
    });
  }
</script>

{#if db}
<div class="overflow-hidden bg-white relative">
  {#if showPropSettings && editingCol}
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div class="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div class="bg-black text-white p-3 flex justify-between items-center px-4">
          <h3 class="font-mono text-[11px] font-black uppercase tracking-widest">Property Settings</h3>
          <button onclick={() => showPropSettings = null} class="hover:text-te-orange">
            <Plus size={16} class="rotate-45" />
          </button>
        </div>
        
        <div class="p-6 flex flex-col gap-6 text-black">
          <div class="flex flex-col gap-2">
            <label for="prop-name" class="font-mono text-[9px] font-black uppercase tracking-wider opacity-40">Name</label>
            <input 
              id="prop-name"
              type="text" 
              value={editingCol.name}
              oninput={(e) => updateColumn(editingCol!.id, { name: (e.target as HTMLInputElement).value })}
              class="border-2 border-black p-3 font-mono text-xs font-black uppercase focus:bg-te-bg focus:outline-none"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="prop-type" class="font-mono text-[9px] font-black uppercase tracking-wider opacity-40">Type</label>
            <select 
              id="prop-type"
              value={editingCol.type}
              onchange={(e) => updateColumn(editingCol!.id, { type: (e.target as any).value })}
              class="border-2 border-black p-3 font-mono text-xs font-black uppercase focus:bg-te-bg focus:outline-none bg-white"
            >
              <option value="text">TEXT</option>
              <option value="number">NUMBER</option>
              <option value="select">SELECT</option>
              <option value="date">DATE</option>
              <option value="checkbox">CHECKBOX</option>
              <option value="relation">RELATION</option>
            </select>
          </div>

          {#if editingCol.type === 'relation'}
            <div class="flex flex-col gap-2 animate-in slide-in-from-top-2">
              <label for="prop-relation" class="font-mono text-[9px] font-black uppercase tracking-wider opacity-40">Relates To</label>
              <select 
                id="prop-relation"
                value={editingCol.relationDatabaseId || ''}
                onchange={(e) => updateColumn(editingCol!.id, { relationDatabaseId: (e.target as any).value })}
                class="border-2 border-black p-3 font-mono text-xs font-black uppercase focus:bg-te-bg focus:outline-none bg-white"
              >
                <option value="">Select Database</option>
                {#each Object.values(storage.databases) as otherDb}
                  <option value={otherDb.id}>{otherDb.title}</option>
                {/each}
              </select>
            </div>
          {/if}

          {#if editingCol.type === 'select'}
            <div class="flex flex-col gap-2 animate-in slide-in-from-top-2">
              <label for="prop-options" class="font-mono text-[9px] font-black uppercase tracking-wider opacity-40">Options (comma separated)</label>
              <input 
                id="prop-options"
                type="text" 
                value={editingCol.options?.join(', ') || ''}
                oninput={(e) => updateColumn(editingCol!.id, { options: (e.target as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean) })}
                class="border-2 border-black p-3 font-mono text-xs font-black uppercase focus:bg-te-bg focus:outline-none"
                placeholder="Todo, In Progress, Done"
              />
            </div>
          {/if}

          <div class="flex gap-4 mt-4">
            <button 
              onclick={() => {
                storage.updateDatabase(databaseId, { columns: db!.columns.filter(c => c.id !== editingCol!.id) });
                showPropSettings = null;
              }}
              class="flex-1 border-2 border-black p-3 font-mono text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
            >
              Delete
            </button>
            <button 
              onclick={() => showPropSettings = null}
              class="flex-1 bg-black text-white p-3 font-mono text-[10px] font-black uppercase hover:bg-te-orange transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if !hideHeader}
    <div class="bg-black text-white p-2 flex justify-between items-center px-4">
      <div class="flex items-center gap-3">
        <div class="w-2 h-2 bg-te-orange"></div>
        <h3 class="font-mono text-[10px] font-black tracking-widest uppercase">{db.title}</h3>
      </div>
      <div class="flex gap-4">
        <button class="font-mono text-[10px] hover:text-te-orange uppercase">Export</button>
      </div>
    </div>
  {/if}

  <div class="overflow-x-auto">
    <table class="w-full border-collapse font-mono text-xs text-black">
      <thead>
        <tr class="bg-gray-100 border-b-2 border-black">
          <th class="w-12 border-r border-black p-2 bg-gray-200">#</th>
          {#each db.columns as col}
            {@const Icon = typeIcons[col.type]}
            <th class="border-r border-black p-0 group" style="width: {col.width}px">
              <div class="flex items-center px-3 py-2 gap-2">
                {#if Icon}<Icon size={12} class="text-gray-500" />{/if}
                <span class="uppercase font-black flex-1 text-left">{col.name}</span>
                <button 
                  onclick={() => showPropSettings = col.id}
                  class="opacity-0 group-hover:opacity-100 p-1 hover:bg-black hover:text-white transition-all"
                >
                  <Settings2 size={10} />
                </button>
              </div>
            </th>
          {/each}
          <th class="p-0">
            <button 
              onclick={addColumn}
              class="w-full h-full p-2 hover:bg-black hover:text-white transition-all flex items-center justify-center text-black"
            >
              <Plus size={14} />
            </button>
          </th>
        </tr>
      </thead>
      <tbody class="bg-white">
        {#each db.rows as row, rowIndex}
          <tr class="border-b border-black group hover:bg-gray-50">
            <td class="text-center bg-gray-50 border-r border-black font-bold text-[9px] text-gray-400">
              {rowIndex + 1}
            </td>
            {#each db.columns as col}
              <td class="border-r border-black p-0 min-w-[100px]">
                {#if col.type === 'checkbox'}
                  <div class="flex items-center justify-center p-3">
                    <input 
                      type="checkbox"
                      checked={row[col.id] || false}
                      onchange={(e) => updateCell(rowIndex, col.id, (e.target as HTMLInputElement).checked)}
                      class="appearance-none w-5 h-5 border-2 border-black checked:bg-te-orange transition-all cursor-pointer"
                    />
                  </div>
                {:else if col.type === 'select'}
                  <select 
                    value={row[col.id] || ''}
                    onchange={(e) => updateCell(rowIndex, col.id, (e.target as any).value)}
                    class="w-full p-3 bg-transparent focus:bg-te-bg focus:outline-none uppercase font-bold tracking-tight text-black appearance-none"
                  >
                    <option value="">None</option>
                    {#each col.options || [] as opt}
                      <option value={opt}>{opt}</option>
                    {/each}
                  </select>
                {:else if col.type === 'date'}
                  <input 
                    type="date"
                    value={row[col.id] || ''}
                    onchange={(e) => updateCell(rowIndex, col.id, (e.target as HTMLInputElement).value)}
                    class="w-full p-3 bg-transparent focus:bg-te-bg focus:outline-none font-bold tracking-tight text-black"
                  />
                {:else if col.type === 'relation'}
                  {@const relatedDb = storage.databases[col.relationDatabaseId || '']}
                  <div class="p-2 min-h-[44px] flex flex-wrap gap-1">
                    {#if row[col.id]}
                      {#each Array.isArray(row[col.id]) ? row[col.id] : [row[col.id]] as relatedRowId}
                        {@const relatedRow = relatedDb?.rows.find(r => r.id === relatedRowId)}
                        <div class="bg-black text-white px-2 py-0.5 font-mono text-[9px] uppercase font-black flex items-center gap-1 group/chip">
                          {relatedRow ? (relatedRow['col-1'] || 'Untitled') : 'Unknown'}
                          <button 
                            onclick={() => {
                              const current = Array.isArray(row[col.id]) ? row[col.id] : [row[col.id]];
                              updateCell(rowIndex, col.id, current.filter((id: string) => id !== relatedRowId));
                            }}
                            class="hover:text-te-orange"
                          >
                            <Plus size={10} class="rotate-45" />
                          </button>
                        </div>
                      {/each}
                    {/if}
                    <select 
                      value=""
                      onchange={(e) => {
                        const val = (e.target as any).value;
                        if (!val) return;
                        const current = Array.isArray(row[col.id]) ? row[col.id] : row[col.id] ? [row[col.id]] : [];
                        if (!current.includes(val)) {
                          updateCell(rowIndex, col.id, [...current, val]);
                        }
                        (e.target as any).value = "";
                      }}
                      class="border-2 border-dashed border-black/20 text-[9px] uppercase font-black px-1 focus:outline-none hover:border-black transition-all bg-transparent"
                    >
                      <option value="">+ Add</option>
                      {#if relatedDb}
                        {#each relatedDb.rows as relRow}
                          <option value={relRow.id}>{relRow['col-1'] || 'Untitled'}</option>
                        {/each}
                      {/if}
                    </select>
                  </div>
                {:else if col.type === 'number'}
                  <input 
                    type="number"
                    value={row[col.id] || ''}
                    oninput={(e) => updateCell(rowIndex, col.id, (e.target as HTMLInputElement).value)}
                    class="w-full p-3 bg-transparent focus:bg-te-bg focus:outline-none uppercase font-bold tracking-tight text-black"
                  />
                {:else}
                  <input 
                    type="text" 
                    value={row[col.id] || ''}
                    oninput={(e) => updateCell(rowIndex, col.id, (e.target as HTMLInputElement).value)}
                    class="w-full p-3 bg-transparent focus:bg-te-bg focus:outline-none uppercase font-bold tracking-tight text-black"
                  />
                {/if}
              </td>
            {/each}
            <td class="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onclick={() => deleteRow(rowIndex)} class="text-gray-300 hover:text-te-orange">
                <Trash2 size={12} />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="p-2 bg-gray-100 border-t border-black flex justify-between items-center px-4 text-black">
    <button 
      onclick={addRow}
      class="font-mono text-[10px] font-black uppercase tracking-widest hover:text-te-orange flex items-center gap-2"
    >
      <Plus size={10} /> Add Entry
    </button>
    {#if !hideHeader}
      <div class="text-[9px] font-mono opacity-40 uppercase tracking-tighter">
        {db.rows.length} Rows • {db.columns.length} Columns
      </div>
    {/if}
  </div>
</div>
{/if}
