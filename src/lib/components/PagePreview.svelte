<script lang="ts">
  import { storage } from '$lib/services/StorageService.svelte';

  let { pageId } = $props<{ pageId: string }>();

  let page = $derived(storage.pages.find(p => p.id === pageId));
  let content = $derived(storage.getPageContent(pageId));

  // Strip HTML for a clean preview, or just show a slice of it
  function getPreviewText(html: string) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    return text.slice(0, 200) + (text.length > 200 ? '...' : '');
  }

  let previewText = $derived(getPreviewText(content));
</script>

<div class="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-64 max-h-48 overflow-hidden">
  {#if page}
    <div class="flex items-center gap-2 mb-2 pb-2 border-b border-black/10">
      <span class="text-lg">{page.icon || '📄'}</span>
      <h4 class="font-mono text-xs font-black uppercase truncate text-black">{page.title || 'Untitled'}</h4>
    </div>
    <div class="font-sans text-xs text-black/60 leading-relaxed">
      {previewText || 'No content yet.'}
    </div>
  {:else}
    <div class="font-mono text-[10px] uppercase opacity-40">Page not found</div>
  {/if}
</div>

