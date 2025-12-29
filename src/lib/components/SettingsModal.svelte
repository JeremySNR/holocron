<script lang="ts">
  import { storage } from '$lib/services/StorageService.svelte';
  import { open } from '@tauri-apps/plugin-dialog';
  import { writeTextFile, mkdir } from '@tauri-apps/plugin-fs';
  import { path } from '@tauri-apps/api';

  let { isOpen = $bindable(false) } = $props<{ isOpen: boolean }>();

  let isExporting = $state(false);

  async function handleExport() {
    isExporting = true;
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Export Directory'
      });

      if (selected && typeof selected === 'string') {
        const pages = await storage.exportAllPages();
        const exportPath = await path.join(selected, `holocron_export_${Date.now()}`);
        
        await mkdir(exportPath);

        for (const [filename, content] of Object.entries(pages)) {
          const filePath = await path.join(exportPath, filename);
          await writeTextFile(filePath, content);
        }

        alert(`Successfully exported ${Object.keys(pages).length} pages to ${exportPath}`);
      }
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed. Check console for details.');
    } finally {
      isExporting = false;
    }
  }

  const popularModels = [
    { id: 'openai/gpt-5.2', name: 'GPT-5.2 (Latest)' },
    { id: 'anthropic/claude-4-sonnet', name: 'Claude 4 Sonnet' },
    { id: 'google/gemini-3-pro', name: 'Gemini 3 Pro' },
    { id: 'meta-llama/llama-4-405b', name: 'Llama 4 405B' },
    { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2' },
    { id: 'mistralai/mistral-large-3', name: 'Mistral Large 3' },
  ];

  function save() {
    storage.saveSettings();
    isOpen = false;
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4 sm:p-8">
    <div class="bg-te-bg border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
      <div class="bg-black text-white p-4 flex justify-between items-center shrink-0">
        <h2 class="font-mono text-sm font-black tracking-widest uppercase text-white">Settings</h2>
        <button type="button" onclick={() => isOpen = false} class="font-mono text-xs hover:text-te-orange uppercase text-white">[Close]</button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
        <!-- OpenRouter API Key -->
        <div class="space-y-2">
          <label for="api-key" class="font-mono text-[10px] font-black uppercase tracking-widest block text-black">OpenRouter API Key</label>
          <input 
            id="api-key"
            type="password" 
            bind:value={storage.settings.openRouterKey}
            placeholder="sk-or-v1-..."
            class="te-input w-full text-black"
          />
          <p class="font-mono text-[9px] text-gray-500 uppercase tracking-tighter">Stored locally in your browser.</p>
        </div>

        <!-- Model Selector -->
        <div class="space-y-2">
          <span class="font-mono text-[10px] font-black uppercase tracking-widest block text-black">AI Model</span>
          <div class="grid grid-cols-1 gap-1">
            {#each popularModels as model}
              <button 
                type="button"
                onclick={() => storage.settings.selectedModel = model.id}
                class="w-full text-left p-3 border border-black font-mono text-xs uppercase transition-all {storage.settings.selectedModel === model.id ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}"
              >
                <div class="flex justify-between items-center">
                  <span class={storage.settings.selectedModel === model.id ? 'text-white' : 'text-black'}>{model.name}</span>
                  {#if storage.settings.selectedModel === model.id}
                    <div class="w-2 h-2 bg-te-orange"></div>
                  {/if}
                </div>
                <div class="text-[9px] opacity-50 mt-1 uppercase {storage.settings.selectedModel === model.id ? 'text-white/70' : 'text-black/70'}">ID: {model.id}</div>
              </button>
            {/each}
          </div>
        </div>

        <!-- System Info -->
        <div class="bg-white border-2 border-black p-4 space-y-4">
          <div class="space-y-2">
            <span class="font-mono text-[10px] font-black uppercase tracking-widest block text-black">Data Portability</span>
            <button 
              type="button" 
              onclick={handleExport}
              disabled={isExporting}
              class="w-full te-button-black flex items-center justify-between group"
            >
              <span>{isExporting ? 'Exporting...' : 'Export all to Markdown'}</span>
              <span class="opacity-50 group-hover:opacity-100">↓ .md</span>
            </button>
            <p class="font-mono text-[8px] text-gray-500 uppercase tracking-tighter">Converts all pages to standard Markdown files.</p>
          </div>

          <div class="te-divider-h opacity-20"></div>

          <div class="space-y-1 font-mono text-[9px] uppercase text-black">
            <div class="flex justify-between">
              <span class="opacity-50">Build Version:</span>
              <span>0.1.0-alpha</span>
            </div>
            <div class="flex justify-between">
              <span class="opacity-50">Storage Engine:</span>
              <span>localStorage</span>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-black bg-white flex justify-end gap-2 shrink-0">
        <button type="button" onclick={() => isOpen = false} class="te-button">Cancel</button>
        <button type="button" onclick={save} class="te-button-black inline-flex items-center justify-center min-w-[140px]">
          Save Settings
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #000;
  }
</style>
