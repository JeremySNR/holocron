<script lang="ts">
  import { storage } from '$lib/services/StorageService.svelte';
  import { ChevronLeft, ChevronRight, Plus } from 'lucide-svelte';

  let { databaseId } = $props<{ databaseId: string }>();

  let db = $derived(storage.databases[databaseId]);
  
  // Find a date column to use for the calendar. Default to the first one found.
  let dateCol = $derived(db?.columns.find(c => c.type === 'date'));

  let currentDate = $state(new Date());
  
  let daysInMonth = $derived(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate());
  let firstDayOfMonth = $derived(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay());
  
  let monthYearString = $derived(currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }));

  function prevMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  }

  function nextMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  function getRowsForDay(day: number) {
    if (!db || !dateCol) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return db.rows.filter(r => r[dateCol!.id] === dateStr);
  }

  function addEntry(day: number) {
    if (!db || !dateCol) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const newRows = [...db.rows, { 
      id: crypto.randomUUID(), 
      [dateCol.id]: dateStr,
      'col-1': 'New Event'
    }];
    storage.updateDatabase(databaseId, { rows: newRows });
  }

  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
</script>

{#if db}
<div class="p-4 bg-white min-h-[500px] flex flex-col">
  {#if !dateCol}
    <div class="flex-1 flex flex-col items-center justify-center gap-4 text-black/20">
      <div class="font-mono text-xs font-black uppercase tracking-widest">No date property found</div>
      <div class="text-[10px] uppercase opacity-40">Add a date property to enable calendar view</div>
    </div>
  {:else}
    <!-- Calendar Header -->
    <div class="flex justify-between items-center mb-6 px-2">
      <h2 class="font-mono text-sm font-black uppercase tracking-[0.2em] text-black">{monthYearString}</h2>
      <div class="flex border-2 border-black divide-x-2 divide-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <button onclick={prevMonth} class="p-2 hover:bg-black hover:text-white transition-all text-black hover:text-white">
          <ChevronLeft size={16} />
        </button>
        <button onclick={() => currentDate = new Date()} class="px-4 py-1 font-mono text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all text-black">
          Today
        </button>
        <button onclick={nextMonth} class="p-2 hover:bg-black hover:text-white transition-all text-black hover:text-white">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="flex-1 grid grid-cols-7 border-t-2 border-l-2 border-black">
      <!-- Weekday Headers -->
      {#each weekdays as day}
        <div class="p-2 border-r-2 border-b-2 border-black bg-gray-100 font-mono text-[9px] font-black text-center tracking-widest">
          {day}
        </div>
      {/each}

      <!-- Empty days before month -->
      {#each Array(firstDayOfMonth) as _}
        <div class="p-2 border-r-2 border-b-2 border-black bg-gray-50/50"></div>
      {/each}

      <!-- Actual days -->
      {#each Array(daysInMonth) as _, i}
        {@const day = i + 1}
        {@const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()}
        <div class="min-h-[100px] p-2 border-r-2 border-b-2 border-black flex flex-col gap-2 group hover:bg-te-bg transition-all">
          <div class="flex justify-between items-center">
            <span class="font-mono text-[11px] font-black {isToday ? 'bg-te-orange text-white px-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-black'}">
              {day}
            </span>
            <button 
              onclick={() => addEntry(day)}
              class="opacity-0 group-hover:opacity-100 hover:text-te-orange transition-opacity"
            >
              <Plus size={12} />
            </button>
          </div>

          <div class="flex flex-col gap-1 overflow-y-auto max-h-[80px]">
            {#each getRowsForDay(day) as row}
              <div class="bg-black text-white px-1.5 py-0.5 font-mono text-[8px] uppercase font-black truncate border border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                {row['col-1'] || 'Untitled'}
              </div>
            {/each}
          </div>
        </div>
      {/each}

      <!-- Empty days after month -->
      {#each Array((7 - (firstDayOfMonth + daysInMonth) % 7) % 7) as _}
        <div class="p-2 border-r-2 border-b-2 border-black bg-gray-50/50"></div>
      {/each}
    </div>
  {/if}
</div>
{/if}

