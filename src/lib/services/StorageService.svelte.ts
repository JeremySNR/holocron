import { semanticSearch } from './SemanticSearchService';
import TurndownService from 'turndown';

export type PropertyType = 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'relation';
export type DatabaseView = 'table' | 'kanban' | 'calendar' | 'gallery';

export interface Column {
  id: string;
  name: string;
  type: PropertyType;
  width?: number;
  options?: string[];
  relationDatabaseId?: string;
}

export interface Database {
  id: string;
  title: string;
  columns: Column[];
  rows: Record<string, any>[];
  currentView: DatabaseView;
}

export interface PageMetadata {
  id: string;
  title: string;
  parentId: string | null;
  icon: string;
  updatedAt: number;
  order: number;
}

export interface AppSettings {
  openRouterKey: string;
  selectedModel: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  updatedAt: number;
}

const STORAGE_KEYS = {
  PAGES: 'holocron_pages',
  DATABASES: 'holocron_databases',
  SETTINGS: 'holocron_settings',
  UI_STATE: 'holocron_ui_state',
  CONTENT_PREFIX: 'holocron_content_',
  CHATS_PREFIX: 'holocron_chats_v2_'
} as const;

function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error('[Storage] JSON parse error:', e);
    return fallback;
  }
}

class StorageService {
  pages = $state<PageMetadata[]>([]);
  databases = $state<Record<string, Database>>({});
  settings = $state<AppSettings>({
    openRouterKey: '',
    selectedModel: 'openai/gpt-5.2',
  });
  
  activePageId = $state<string>('');
  isSettingsOpen = $state<boolean>(false);
  isSidebarOpen = $state<boolean>(true);
  collapsedPageIds = $state<Set<string>>(new Set());

  private contentCache = new Map<string, string>();
  private chatCache = new Map<string, ChatSession[]>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadAll();
    }
  }

  private loadAll() {
    this.loadPages();
    this.loadSettings();
    this.loadDatabases();
    this.loadAllContent();
    this.loadAllChats();
    this.loadUIState();
    
    if (this.pages.length > 0 && !this.activePageId) {
      this.activePageId = this.pages[0].id;
    }
  }

  // UI State
  private loadUIState() {
    const saved = safeJsonParse(localStorage.getItem(STORAGE_KEYS.UI_STATE), { collapsedPageIds: [] });
    if (saved.collapsedPageIds) {
      this.collapsedPageIds = new Set(saved.collapsedPageIds);
    }
  }

  private saveUIState() {
    localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify({
      collapsedPageIds: Array.from(this.collapsedPageIds)
    }));
  }

  togglePageCollapse(pageId: string) {
    if (this.collapsedPageIds.has(pageId)) {
      this.collapsedPageIds.delete(pageId);
    } else {
      this.collapsedPageIds.add(pageId);
    }
    this.saveUIState();
  }

  // Settings
  private loadSettings() {
    const saved = safeJsonParse(localStorage.getItem(STORAGE_KEYS.SETTINGS), null);
    if (saved) {
      this.settings.openRouterKey = saved.openRouterKey || '';
      this.settings.selectedModel = saved.selectedModel || 'openai/gpt-5.2';
    }
  }

  saveSettings() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
      openRouterKey: this.settings.openRouterKey,
      selectedModel: this.settings.selectedModel,
    }));
  }

  // Databases
  private loadDatabases() {
    this.databases = safeJsonParse(localStorage.getItem(STORAGE_KEYS.DATABASES), {});
  }

  private saveDatabases() {
    localStorage.setItem(STORAGE_KEYS.DATABASES, JSON.stringify(this.databases));
  }

  getDatabase(id: string): Database | null {
    return this.databases[id] || null;
  }

  createDatabase(title: string): Database {
    const db: Database = {
      id: crypto.randomUUID(),
      title,
      columns: [
        { id: 'col-1', name: 'Name', type: 'text', width: 200 },
        { id: 'col-2', name: 'Status', type: 'select', width: 150, options: ['Todo', 'In Progress', 'Done'] },
      ],
      rows: [
        { id: crypto.randomUUID(), 'col-1': 'Sample Item', 'col-2': 'Todo' },
      ],
      currentView: 'table',
    };
    this.databases[db.id] = db;
    this.saveDatabases();
    return db;
  }

  updateDatabase(id: string, updates: Partial<Database>) {
    if (this.databases[id]) {
      this.databases[id] = { ...this.databases[id], ...updates };
      this.saveDatabases();
    }
  }

  // Pages
  private loadPages() {
    const saved = safeJsonParse<PageMetadata[] | null>(localStorage.getItem(STORAGE_KEYS.PAGES), null);
    if (saved) {
      this.pages = saved;
    } else {
      const welcomePage: PageMetadata = {
        id: crypto.randomUUID(),
        title: 'Welcome to Holocron',
        parentId: null,
        icon: '🏠',
        updatedAt: Date.now(),
        order: 0,
      };
      this.pages = [welcomePage];
      this.savePageContent(welcomePage.id, '<p>Welcome to your new knowledge base! Start typing here...</p>');
      this.savePages();
    }
  }

  private savePages() {
    localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(this.pages));
  }

  createPage(title: string, parentId: string | null = null, icon: string = '📄'): PageMetadata {
    const siblingPages = this.pages.filter(p => p.parentId === parentId);
    const maxOrder = siblingPages.length > 0 
      ? Math.max(...siblingPages.map(p => p.order)) 
      : -1;

    const newPage: PageMetadata = {
      id: crypto.randomUUID(),
      title,
      parentId,
      icon,
      updatedAt: Date.now(),
      order: maxOrder + 1,
    };
    
    this.pages.push(newPage);
    this.savePages();
    this.savePageContent(newPage.id, '<p></p>');
    this.activePageId = newPage.id;
    
    return newPage;
  }

  updatePageMetadata(id: string, updates: Partial<PageMetadata>) {
    const page = this.pages.find(p => p.id === id);
    if (page) {
      Object.assign(page, updates, { updatedAt: Date.now() });
      this.savePages();
    }
  }

  updatePageOrder(parentId: string | null, orderedIds: string[]) {
    this.pages.forEach(page => {
      const idx = orderedIds.indexOf(page.id);
      if (idx !== -1) {
        page.parentId = parentId;
        page.order = idx;
      }
    });
    this.savePages();
  }

  deletePage(id: string) {
    const index = this.pages.findIndex(p => p.id === id);
    if (index !== -1) {
      this.pages.splice(index, 1);
      this.deletePageContent(id);
      this.deleteChatHistory(id);
      
      if (this.activePageId === id) {
        this.activePageId = this.pages[0]?.id || '';
      }
      this.savePages();
    }
  }

  // Page Content
  private loadAllContent() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_KEYS.CONTENT_PREFIX))
      .forEach(key => {
        const pageId = key.replace(STORAGE_KEYS.CONTENT_PREFIX, '');
        const content = localStorage.getItem(key);
        if (content) {
          this.contentCache.set(pageId, content);
        }
      });
  }

  getPageContent(pageId: string): string {
    if (this.contentCache.has(pageId)) {
      return this.contentCache.get(pageId)!;
    }
    
    const content = localStorage.getItem(`${STORAGE_KEYS.CONTENT_PREFIX}${pageId}`);
    if (content) {
      this.contentCache.set(pageId, content);
      return content;
    }
    
    return '<p></p>';
  }

  savePageContent(pageId: string, content: string) {
    this.contentCache.set(pageId, content);
    localStorage.setItem(`${STORAGE_KEYS.CONTENT_PREFIX}${pageId}`, content);
    
    const page = this.pages.find(p => p.id === pageId);
    if (page) {
      page.updatedAt = Date.now();
    }
  }

  private deletePageContent(pageId: string) {
    this.contentCache.delete(pageId);
    localStorage.removeItem(`${STORAGE_KEYS.CONTENT_PREFIX}${pageId}`);
  }

  // Chat History
  private loadAllChats() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_KEYS.CHATS_PREFIX))
      .forEach(key => {
        const pageId = key.replace(STORAGE_KEYS.CHATS_PREFIX, '');
        const chat = localStorage.getItem(key);
        if (chat) {
          this.chatCache.set(pageId, JSON.parse(chat));
        }
      });
  }

  getChatSessions(pageId: string): ChatSession[] {
    return this.chatCache.get(pageId) || [];
  }

  saveChatSessions(pageId: string, sessions: ChatSession[]) {
    this.chatCache.set(pageId, sessions);
    localStorage.setItem(`${STORAGE_KEYS.CHATS_PREFIX}${pageId}`, JSON.stringify(sessions));
  }

  private deleteChatHistory(pageId: string) {
    this.chatCache.delete(pageId);
    localStorage.removeItem(`${STORAGE_KEYS.CHATS_PREFIX}${pageId}`);
  }

  async exportAllPages() {
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });

    turndown.addRule('callout', {
      filter: (node) => node.nodeName === 'DIV' && node.getAttribute('data-type') === 'callout',
      replacement: (content) => `\n> [!NOTE]\n> ${content.trim().replace(/\n/g, '\n> ')}\n`
    });

    turndown.addRule('pageCard', {
      filter: (node) => node.nodeName === 'DIV' && node.getAttribute('data-type') === 'page-card',
      replacement: (_, node) => {
        const id = (node as HTMLElement).getAttribute('data-page-id');
        const page = this.pages.find(p => p.id === id);
        return `\n[[${page?.title || 'Unknown Note'}]]\n`;
      }
    });

    const zip: Record<string, string> = {};
    
    for (const page of this.pages) {
      const html = this.getPageContent(page.id);
      const markdown = `# ${page.title}\n\n${turndown.turndown(html)}`;
      const safeTitle = page.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'untitled';
      zip[`${safeTitle}.md`] = markdown;
    }

    return zip;
  }
}

export const storage = new StorageService();
