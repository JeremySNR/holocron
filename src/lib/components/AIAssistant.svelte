<script lang="ts">
  import { untrack } from 'svelte';
  import { ai } from '$lib/services/AIService';
  import { storage, type ChatSession } from '$lib/services/StorageService.svelte';

  let { pageId, context = '', databases = [], onInsert = (text: string) => {} } = $props<{ 
    pageId: string,
    context: string, 
    databases: any[],
    onInsert?: (text: string) => void 
  }>();

  let isOpen = $state(false);
  let showHistory = $state(false);
  let query = $state('');
  let sessions = $state<ChatSession[]>([]);
  let activeSessionId = $state<string | null>(null);
  let isTyping = $state(false);
  let scrollContainer: HTMLDivElement | undefined = $state(undefined);

  // Derived current messages
  let messages = $derived(
    sessions.find(s => s.id === activeSessionId)?.messages || []
  );

  // Load chat sessions whenever pageId changes
  $effect(() => {
    // We only want to trigger this when pageId changes
    const currentId = pageId;
    
    untrack(() => {
      sessions = storage.getChatSessions(currentId);
      if (sessions.length > 0) {
        // If there's an existing active session that's still in the list, keep it
        // Otherwise default to the first one
        if (!activeSessionId || !sessions.find(s => s.id === activeSessionId)) {
          activeSessionId = sessions[0].id;
        }
      } else {
        startNewChat();
      }
    });
  });

  // Save chat sessions whenever they change
  $effect(() => {
    if (sessions.length > 0) {
      storage.saveChatSessions(pageId, sessions);
    }
  });

  // Auto-scroll to bottom
  $effect(() => {
    if (messages.length > 0 && scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  });

  function startNewChat() {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      updatedAt: Date.now()
    };
    sessions = [newSession, ...sessions];
    activeSessionId = newSession.id;
    showHistory = false;
  }

  function selectSession(id: string) {
    activeSessionId = id;
    showHistory = false;
  }

  function deleteSession(id: string, e: Event) {
    e.stopPropagation();
    sessions = sessions.filter(s => s.id !== id);
    if (activeSessionId === id) {
      activeSessionId = sessions[0]?.id || null;
      if (!activeSessionId) startNewChat();
    }
  }

  async function handleSubmit() {
    if (!query.trim() || !activeSessionId) return;
    
    const userMsg = query;
    const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
    if (sessionIndex === -1) return;

    if (sessions[sessionIndex].title === 'New Chat') {
      sessions[sessionIndex].title = userMsg.slice(0, 30);
    }

    sessions[sessionIndex].messages = [...sessions[sessionIndex].messages, { role: 'user', content: userMsg }];
    sessions[sessionIndex].updatedAt = Date.now();
    
    query = '';
    isTyping = true;

    try {
      const response = await ai.ask(userMsg, context, databases);
      sessions[sessionIndex].messages = [...sessions[sessionIndex].messages, { role: 'assistant', content: response }];
      sessions[sessionIndex].updatedAt = Date.now();
    } catch (e) {
      sessions[sessionIndex].messages = [...sessions[sessionIndex].messages, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your API key.' }];
    } finally {
      isTyping = false;
    }
  }

  function toggle() {
    isOpen = !isOpen;
  }

  // Simple markdown to HTML converter
  function renderMarkdown(text: string): string {
    return text
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="ai-code-block"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h4 class="ai-h4">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="ai-h3">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 class="ai-h2">$1</h2>')
      .replace(/^- (.+)$/gm, '<li class="ai-li">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ai-li">$2</li>')
      .replace(/(<li class="ai-li">.*<\/li>\n?)+/g, '<ul class="ai-ul">$&</ul>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="ai-link" target="_blank">$1</a>')
      .replace(/\n\n/g, '</p><p class="ai-p">')
      .replace(/\n/g, '<br/>')
      .replace(/^(.+)$/s, '<p class="ai-p">$1</p>');
  }
</script>

<!-- Toggle Button -->
<button 
  onclick={toggle}
  class="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 bg-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,62,0,0.5)] flex flex-col items-center justify-center text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(255,62,0,0.5)] transition-all z-50 group"
>
  <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mb-0.5 sm:mb-1 {isOpen ? 'bg-te-orange' : 'bg-gray-600'}"></div>
  <span class="font-mono text-[8px] sm:text-[10px] font-bold tracking-tighter">AI</span>
</button>

{#if isOpen}
  <div class="fixed bottom-20 right-0 sm:right-8 w-full sm:w-96 h-[calc(100dvh-5rem)] sm:h-[600px] bg-white border-t-2 sm:border-2 border-black shadow-none sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-4">
    <!-- Header -->
    <div class="p-4 border-b-2 border-black bg-black text-white flex justify-between items-center shrink-0">
      <div class="flex items-center gap-2">
        <button 
          onclick={() => showHistory = !showHistory}
          class="w-6 h-6 flex items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-colors"
          title="Toggle History"
        >
          <span class="font-mono text-[10px]">{showHistory ? '×' : '☰'}</span>
        </button>
        <h3 class="font-mono text-xs font-bold tracking-widest uppercase text-white">Assistant</h3>
      </div>
      <div class="flex items-center gap-3">
        <button 
          onclick={startNewChat}
          class="font-mono text-[9px] border border-white/20 px-2 py-0.5 hover:bg-te-orange hover:text-white transition-colors"
        >
          New Chat
        </button>
      </div>
    </div>
    
    <div class="flex-1 relative overflow-hidden flex flex-col">
      <!-- History View Overlay -->
      {#if showHistory}
        <div class="absolute inset-0 z-20 bg-te-bg border-b-2 border-black overflow-y-auto custom-scrollbar p-2 space-y-1">
          <div class="p-2 mb-2 border-b border-black/10">
            <span class="font-mono text-[10px] font-bold opacity-50 uppercase">History</span>
          </div>
          {#each sessions as session}
            <div 
              role="button"
              tabindex="0"
              onclick={() => selectSession(session.id)}
              onkeydown={(e) => e.key === 'Enter' && selectSession(session.id)}
              class="w-full text-left p-3 border border-black flex items-center justify-between group transition-all cursor-pointer {activeSessionId === session.id ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}"
            >
              <div class="flex-1 min-w-0 mr-2">
                <div class="font-mono text-[10px] font-black truncate">{session.title}</div>
                <div class="font-mono text-[8px] opacity-50">{new Date(session.updatedAt).toLocaleString()}</div>
              </div>
              <button 
                type="button"
                onclick={(e) => deleteSession(session.id, e)}
                class="opacity-0 group-hover:opacity-100 text-[10px] hover:text-te-orange p-1"
              >
                ✕
              </button>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Messages View -->
      <div 
        bind:this={scrollContainer}
        class="flex-1 overflow-y-auto p-4 space-y-4 bg-te-bg font-mono custom-scrollbar"
      >
        {#if messages.length === 0}
          <div class="text-center py-12">
            <div class="text-[10px] font-bold text-black border border-black p-4 inline-block bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
              How can I help you?
            </div>
          </div>
        {/if}
        
        {#each messages as msg}
          <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[85%] p-3 border-2 border-black text-[11px] {msg.role === 'user' ? 'bg-black text-white' : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}">
              <div class="text-[9px] mb-2 opacity-50 uppercase font-bold">{msg.role}</div>
              <div class="ai-message-content">
                {#if msg.role === 'assistant'}
                  {@html renderMarkdown(msg.content)}
                {:else}
                  {msg.content}
                {/if}
              </div>
              {#if msg.role === 'assistant'}
                <button 
                  type="button"
                  onclick={() => onInsert(msg.content)}
                  class="mt-3 text-[9px] border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors uppercase font-black"
                >
                  Insert to note
                </button>
              {/if}
            </div>
          </div>
        {/each}
        
        {#if isTyping}
          <div class="flex justify-start">
            <div class="bg-white p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span class="animate-pulse font-bold text-xs uppercase text-black">Thinking...</span>
            </div>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Input -->
    <div class="p-4 border-t-2 border-black bg-white shrink-0">
      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="flex flex-col gap-2">
        <input 
          type="text" 
          bind:value={query}
          placeholder="Ask a question..."
          class="w-full border-2 border-black px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:bg-te-bg text-black uppercase tracking-tight"
        />
        <button 
          type="submit"
          class="bg-black text-white px-3 py-2 text-xs font-mono font-black uppercase tracking-widest hover:bg-te-orange transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  </div>
{/if}

<style>
  /* AI Message Markdown Styles */
  :global(.ai-message-content) {
    font-family: system-ui, -apple-system, sans-serif;
    font-weight: normal;
    line-height: 1.5;
  }

  :global(.ai-message-content p.ai-p) {
    margin-bottom: 0.5em;
  }

  :global(.ai-message-content p.ai-p:last-child) {
    margin-bottom: 0;
  }

  :global(.ai-message-content strong) {
    font-weight: 900;
  }

  :global(.ai-message-content em) {
    font-style: italic;
  }

  :global(.ai-message-content .ai-h2) {
    font-family: ui-monospace, monospace;
    font-size: 14px;
    font-weight: 900;
    text-transform: uppercase;
    margin: 0.75em 0 0.5em;
    border-bottom: 1px solid currentColor;
    padding-bottom: 0.25em;
  }

  :global(.ai-message-content .ai-h3) {
    font-family: ui-monospace, monospace;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    margin: 0.75em 0 0.5em;
  }

  :global(.ai-message-content .ai-h4) {
    font-family: ui-monospace, monospace;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    margin: 0.5em 0 0.25em;
  }

  :global(.ai-message-content .ai-ul) {
    margin: 0.5em 0;
    padding-left: 1.25em;
  }

  :global(.ai-message-content .ai-li) {
    margin-bottom: 0.25em;
    list-style-type: disc;
  }

  :global(.ai-message-content .ai-inline-code) {
    font-family: ui-monospace, monospace;
    background: rgba(0, 0, 0, 0.1);
    padding: 0.1em 0.3em;
    border-radius: 2px;
    font-size: 0.9em;
  }

  :global(.ai-message-content .ai-code-block) {
    background: #000;
    color: #fff;
    padding: 0.75em;
    margin: 0.5em 0;
    overflow-x: auto;
    font-family: ui-monospace, monospace;
    font-size: 10px;
    border: 1px solid #000;
  }

  :global(.ai-message-content .ai-code-block code) {
    background: none;
    padding: 0;
    color: inherit;
  }

  :global(.ai-message-content .ai-link) {
    color: #FF3E00;
    text-decoration: underline;
  }

  :global(.ai-message-content .ai-link:hover) {
    color: #000;
  }

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
