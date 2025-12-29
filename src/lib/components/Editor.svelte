<script lang="ts">
  import { onMount, onDestroy, tick, mount, unmount } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import TaskList from '@tiptap/extension-task-list';
  import TaskItem from '@tiptap/extension-task-item';
  import Mention from '@tiptap/extension-mention';
  import { Link } from '@tiptap/extension-link';
  import { Table } from '@tiptap/extension-table';
  import { TableRow } from '@tiptap/extension-table-row';
  import { TableCell } from '@tiptap/extension-table-cell';
  import { TableHeader } from '@tiptap/extension-table-header';
  import { Markdown } from 'tiptap-markdown';
  import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
  import Focus from '@tiptap/extension-focus';
  import Highlight from '@tiptap/extension-highlight';
  import Typography from '@tiptap/extension-typography';
  import Dropcursor from '@tiptap/extension-dropcursor';
  import { BlockDragHandle } from '$lib/editor/BlockDragHandle';
  import { common, createLowlight } from 'lowlight';
  import tippy, { type Instance, delegate } from 'tippy.js';
  import 'tippy.js/dist/tippy.css';
  import { storage } from '$lib/services/StorageService.svelte';
  import { semanticSearch } from '$lib/services/SemanticSearchService';
  import AIAssistant from '$lib/components/AIAssistant.svelte';
  import PagePreview from '$lib/components/PagePreview.svelte';
  import { DatabaseExtension } from '$lib/editor/DatabaseExtension';
  import { SlashCommand } from '$lib/editor/SlashCommand';
  import { CalloutExtension } from '$lib/editor/CalloutExtension';
  import { PageCardExtension } from '$lib/editor/PageCardExtension';
  import { suggestion } from '$lib/editor/suggestions.svelte';
  import { linkSuggestion } from '$lib/editor/linkSuggestions.svelte';

  let { pageId, title = $bindable() } = $props<{ pageId: string, title: string }>();

  let editorElement: HTMLDivElement | undefined = $state(undefined);
  let editorInstance = $state<Editor | null>(null);
  let isReady = $state(false);
  let lastSaved = $state<string>('');
  let isSaving = $state(false);
  
  const lowlight = createLowlight(common);
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  
  function scheduleSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    isSaving = true;
    
    saveTimeout = setTimeout(() => {
      if (editorInstance) {
        const content = editorInstance.getHTML();
        storage.savePageContent(pageId, content);
        semanticSearch.indexPage(pageId, content);
        
        lastSaved = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        isSaving = false;
      }
    }, 500);
  }

  function saveNow() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    
    if (editorInstance) {
      storage.savePageContent(pageId, editorInstance.getHTML());
    }
  }

  let tippyInstances: Instance[] = [];

  onMount(async () => {
    await tick();
    if (!editorElement) return;

    const tippyDelegate = delegate(editorElement, {
      target: '.mention',
      content: 'Loading...',
      interactive: true,
      appendTo: () => document.body,
      delay: [200, 0],
      onShow(instance) {
        const targetId = instance.reference.getAttribute('data-id');
        if (targetId) {
          const container = document.createElement('div');
          const component = mount(PagePreview, {
            target: container,
            props: { pageId: targetId }
          });
          instance.setContent(container);
          
          const originalOnHide = instance.props.onHide;
          instance.setProps({
            onHide(inst) {
              unmount(component);
              if (originalOnHide) originalOnHide(inst);
            }
          });
        }
      }
    });

    tippyInstances.push(...(Array.isArray(tippyDelegate) ? tippyDelegate : [tippyDelegate]));

    try {
      editorInstance = new Editor({
        element: editorElement,
        extensions: [
          StarterKit.configure({ codeBlock: false }),
          Placeholder.configure({
            placeholder: "Type '/' for commands or markdown...",
          }),
          TaskList,
          TaskItem.configure({ nested: true }),
          CodeBlockLowlight.configure({ lowlight }),
          Focus.configure({ className: 'has-focus', mode: 'all' }),
          Highlight,
          Typography,
          BlockDragHandle,
          Dropcursor.configure({ color: '#FF3E00', width: 2 }),
          Link.configure({
            openOnClick: false,
            HTMLAttributes: { class: 'external-link' },
          }),
          Table.configure({ resizable: true }),
          TableRow, TableHeader, TableCell,
          Markdown.configure({
            html: true,
            tightLists: true,
            linkify: true,
            transformPastedText: true,
          }),
          DatabaseExtension,
          CalloutExtension,
          PageCardExtension,
          SlashCommand.configure({ suggestion }),
          Mention.configure({
            HTMLAttributes: { class: 'mention' },
            suggestion: linkSuggestion,
            renderLabel: ({ node }) => `${node.attrs.label ?? node.attrs.id}`,
          }),
        ],
        content: storage.getPageContent(pageId),
        autofocus: 'end',
        editorProps: {
          attributes: { class: 'editor-content' },
          handleClick: (view, pos, event) => {
            const { target } = event;
            if (target instanceof HTMLElement) {
              const id = target.getAttribute('data-id') || target.closest('.page-card-block')?.getAttribute('data-page-id');
              if (id) {
                storage.activePageId = id;
                return true;
              }
            }
            return false;
          },
        },
        onUpdate: scheduleSave,
      });

      isReady = true;
    } catch (err) {
      console.error('[Editor] Init failed:', err);
    }
  });

  onDestroy(() => {
    saveNow();
    tippyInstances.forEach(instance => instance.destroy());
    editorInstance?.destroy();
  });

  function handleTitleInput(e: Event) {
    title = (e.target as HTMLInputElement).value;
    storage.updatePageMetadata(pageId, { title });
  }

  const format = {
    bold: () => editorInstance?.chain().focus().toggleBold().run(),
    italic: () => editorInstance?.chain().focus().toggleItalic().run(),
    strike: () => editorInstance?.chain().focus().toggleStrike().run(),
    code: () => editorInstance?.chain().focus().toggleCode().run(),
    heading: (level: 1 | 2 | 3) => editorInstance?.chain().focus().toggleHeading({ level }).run(),
    bulletList: () => editorInstance?.chain().focus().toggleBulletList().run(),
    taskList: () => editorInstance?.chain().focus().toggleTaskList().run(),
    codeBlock: () => editorInstance?.chain().focus().toggleCodeBlock().run(),
  };

  function handleAIInsert(content: string) {
    editorInstance?.chain().focus().insertContent(content).run();
  }

  let editorText = $derived(editorInstance?.getText() || '');

  let activeDatabaseIds = $derived.by(() => {
    if (!editorInstance) return [];
    const ids: string[] = [];
    editorInstance.state.doc.descendants((node) => {
      if (node.type.name === 'databaseBlock') ids.push(node.attrs.databaseId);
    });
    return ids;
  });

  let databaseContext = $derived(
    activeDatabaseIds.map(id => storage.getDatabase(id)).filter((db): db is any => db !== null)
  );

  let showContextMenu = $state(false);
  let menuPos = $state({ x: 0, y: 0 });

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    showContextMenu = true;
    menuPos = { x: e.clientX, y: e.clientY };
  }

  onMount(() => {
    const close = () => showContextMenu = false;
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  });
</script>

<div 
  class="flex-1 overflow-y-auto bg-white relative"
  oncontextmenu={handleContextMenu}
  role="application"
  aria-label="Holocron Editor"
>
  <div class="fixed top-4 right-20 z-20 flex items-center gap-3 pointer-events-none">
    {#if isSaving}
      <span class="font-mono text-[9px] bg-black text-te-orange px-2 py-1 uppercase tracking-widest animate-pulse border border-black shadow-[2px_2px_0px_0px_rgba(255,62,0,1)]">
        SAVING...
      </span>
    {:else if lastSaved}
      <span class="font-mono text-[9px] bg-white text-green-600 px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest">
        ✓ {lastSaved}
      </span>
    {/if}
  </div>

  {#if showContextMenu}
    <div 
      class="fixed z-[100] bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-1 flex flex-col w-48 animate-in zoom-in-95 duration-75"
      style="left: {menuPos.x}px; top: {menuPos.y}px;"
    >
      <div class="px-2 py-1 border-b border-black mb-1 text-black/50 font-mono text-[9px] font-black uppercase tracking-widest">
        Formatting
      </div>
      
      <div class="grid grid-cols-4 gap-1 mb-1 p-1">
        <button onclick={format.bold} class="menu-btn font-bold">B</button>
        <button onclick={format.italic} class="menu-btn italic">I</button>
        <button onclick={format.strike} class="menu-btn line-through">S</button>
        <button onclick={format.code} class="menu-btn font-mono text-[10px]">{'<>'}</button>
      </div>

      <div class="te-divider-h mb-1 opacity-20"></div>

      <button onclick={() => format.heading(1)} class="menu-action-btn">
        <span>Heading 1</span> <span class="opacity-30">H1</span>
      </button>
      <button onclick={() => format.heading(2)} class="menu-action-btn">
        <span>Heading 2</span> <span class="opacity-30">H2</span>
      </button>
      
      <div class="te-divider-h my-1 opacity-20"></div>

      <button onclick={format.bulletList} class="menu-action-btn">
        <span>Bullet List</span> <span class="opacity-30">•</span>
      </button>
      <button onclick={format.taskList} class="menu-action-btn">
        <span>Task List</span> <span class="opacity-30">☑</span>
      </button>
      <button onclick={format.codeBlock} class="menu-action-btn">
        <span>Code Block</span> <span class="opacity-30">{'{}'}</span>
      </button>
    </div>
  {/if}

  <div class="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-12">
    <div class="mb-6 sm:mb-8 pb-4 border-b-2 border-black">
      <input 
        type="text" 
        value={title}
        oninput={handleTitleInput}
        placeholder="Untitled" 
        class="w-full text-2xl sm:text-4xl font-mono font-black uppercase border-none bg-transparent focus:ring-0 focus:outline-none placeholder:text-black/20 text-black tracking-tighter"
      />
      <div class="flex items-center gap-4 mt-2 font-mono text-[9px] sm:text-[10px] text-black/40 uppercase tracking-wider">
        <span>{pageId.slice(0, 8)}</span>
        <span class="hidden sm:inline">•</span>
        <span class="hidden sm:inline">{new Date().toLocaleDateString()}</span>
      </div>
    </div>

    <div class="editor-wrapper">
      {#if !isReady}
        <div class="flex items-center gap-3 py-8 text-black/30">
          <div class="w-2 h-2 bg-te-orange animate-pulse"></div>
          <span class="font-mono text-xs uppercase tracking-widest">Initializing...</span>
        </div>
      {/if}
      <div bind:this={editorElement} class="editor-mount {isReady ? 'opacity-100' : 'opacity-0'}"></div>
    </div>
  </div>

  <AIAssistant 
    pageId={pageId}
    context={editorText} 
    databases={databaseContext}
    onInsert={handleAIInsert} 
  />
</div>

<style>
  .menu-btn {
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid black;
    background: white;
    font-family: ui-monospace, monospace;
    font-weight: bold;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.1s;
    color: black;
  }

  .menu-btn:hover {
    background: black;
    color: white;
  }

  .menu-action-btn {
    width: 100%;
    padding: 6px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: ui-monospace, monospace;
    font-weight: 800;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: black;
    cursor: pointer;
    transition: all 0.1s;
    border: 1px solid transparent;
  }

  .menu-action-btn:hover {
    background: black;
    color: white;
    border-color: black;
  }

  .editor-wrapper {
    min-height: 400px;
    position: relative;
  }

  .editor-mount {
    transition: opacity 0.2s;
  }

  /* Tiptap Styles */
  :global(.editor-content) {
    outline: none !important;
    min-height: 400px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 16px;
    line-height: 1.7;
    color: #000;
  }

  :global(.editor-content p) {
    margin-bottom: 1em;
  }

  :global(.editor-content h1) {
    font-family: ui-monospace, monospace;
    font-size: 2rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    margin: 2rem 0 1rem;
    border-bottom: 2px solid black;
    padding-bottom: 0.5rem;
  }

  :global(.editor-content h2) {
    font-family: ui-monospace, monospace;
    font-size: 1.25rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    margin: 1.5rem 0 0.75rem;
  }

  :global(.editor-content h3) {
    font-family: ui-monospace, monospace;
    font-size: 1rem;
    font-weight: 900;
    text-transform: uppercase;
    margin: 1rem 0 0.5rem;
  }

  :global(.editor-content ul),
  :global(.editor-content ol) {
    padding-left: 1.5rem;
    margin-bottom: 1em;
  }

  :global(.editor-content li) {
    margin-bottom: 0.25em;
  }

  :global(.editor-content code) {
    font-family: ui-monospace, monospace;
    background: #f0f0f0;
    padding: 0.1em 0.3em;
    border: 1px solid #ccc;
    font-size: 0.9em;
  }

  :global(.editor-content pre) {
    background: #000;
    color: #fff;
    padding: 1rem;
    font-family: ui-monospace, monospace;
    font-size: 0.85rem;
    overflow-x: auto;
    margin: 1rem 0;
    border: 2px solid #000;
  }

  :global(.editor-content blockquote) {
    border-left: 4px solid #000;
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
    color: #666;
  }

  :global(.editor-content strong) {
    font-weight: 900;
  }

  /* Task List */
  :global(.editor-content ul[data-type="taskList"]) {
    list-style: none;
    padding-left: 0;
  }

  :global(.editor-content ul[data-type="taskList"] li) {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  :global(.editor-content ul[data-type="taskList"] li > label) {
    flex-shrink: 0;
    margin-top: 0.2rem;
  }

  :global(.editor-content ul[data-type="taskList"] input[type="checkbox"]) {
    appearance: none;
    width: 18px;
    height: 18px;
    border: 2px solid #000;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.editor-content ul[data-type="taskList"] input[type="checkbox"]:checked) {
    background: #FF3E00;
    border-color: #FF3E00;
  }

  :global(.editor-content ul[data-type="taskList"] input[type="checkbox"]:checked::after) {
    content: '✓';
    color: white;
    font-size: 12px;
    font-weight: bold;
  }

  /* Placeholder */
  :global(.editor-content p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: rgba(0, 0, 0, 0.2);
    font-family: ui-monospace, monospace;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    pointer-events: none;
    height: 0;
  }

  /* Caret */
  :global(.editor-content) {
    caret-color: #FF3E00;
  }

  /* Dragging state */
  :global(.ProseMirror-selectednode) {
    outline: 2px solid #FF3E00 !important;
    outline-offset: 2px;
    background: rgba(255, 62, 0, 0.03);
  }

  /* Focus Styles */
  :global(.editor-content .has-focus) {
    background: rgba(255, 62, 0, 0.02);
    box-shadow: -2px 0 0 0 #FF3E00;
  }

  /* Mentions / Page Links */
  :global(.editor-content .mention) {
    color: #FF3E00;
    font-family: inherit;
    font-weight: 600;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
    cursor: pointer;
    transition: all 0.1s;
    background: transparent;
    padding: 0;
    border: none;
    text-transform: none;
    font-size: inherit;
  }

  :global(.editor-content .mention:hover) {
    color: #000;
    background: #FF3E00;
    text-decoration: none;
  }

  /* External Links */
  :global(.editor-content .external-link) {
    color: #FF3E00;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    cursor: pointer;
  }

  :global(.editor-content .external-link:hover) {
    color: #000;
  }

  /* Tables */
  :global(.editor-content table) {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    margin: 2rem 0;
    overflow: hidden;
    border: 2px solid #000;
  }

  :global(.editor-content th),
  :global(.editor-content td) {
    border: 1px solid #000;
    box-sizing: border-box;
    min-width: 1em;
    padding: 6px 10px;
    position: relative;
    vertical-align: top;
    text-align: left;
  }

  :global(.editor-content th) {
    background-color: #f0f0f0;
    font-weight: bold;
    font-family: ui-monospace, monospace;
    text-transform: uppercase;
    font-size: 0.8em;
  }

  :global(.editor-content .selectedCell:after) {
    background: rgba(200, 200, 255, 0.4);
    content: "";
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    pointer-events: none;
    position: absolute;
    z-index: 2;
  }

  :global(.editor-content .column-resize-handle) {
    background-color: #FF3E00;
    bottom: -2px;
    position: absolute;
    right: -2px;
    top: 0;
    width: 4px;
    z-index: 20;
  }

  :global(.editor-content .mention::before),
  :global(.editor-content .mention::after) {
    content: '' !important;
    display: none !important;
  }
</style>
