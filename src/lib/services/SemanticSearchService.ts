import { invoke } from '@tauri-apps/api/core';
import { storage } from './StorageService.svelte';

export interface SearchResult {
  id: string;
  title: string;
  score: number;
}

class SemanticSearchService {
  private embeddings: Record<string, number[]> = {};

  constructor() {
    this.loadEmbeddings();
  }

  private loadEmbeddings() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('holocron_embeddings');
      this.embeddings = saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('[Search] Failed to load embeddings:', e);
      this.embeddings = {};
    }
  }

  private saveEmbeddings() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('holocron_embeddings', JSON.stringify(this.embeddings));
  }

  async indexPage(pageId: string, content: string) {
    try {
      const plainText = content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      if (!plainText) return;

      const embedding = await invoke<number[]>('get_embedding', { text: plainText });
      this.embeddings[pageId] = embedding;
      this.saveEmbeddings();
    } catch (e) {
      console.error('[Search] Indexing failed:', e);
    }
  }

  async search(query: string, limit = 5): Promise<SearchResult[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    try {
      const queryEmbedding = await invoke<number[]>('get_embedding', { text: trimmedQuery });
      
      return storage.pages
        .map(page => {
          const pageEmbedding = this.embeddings[page.id];
          return pageEmbedding ? {
            id: page.id,
            title: page.title,
            score: this.cosineSimilarity(queryEmbedding, pageEmbedding)
          } : null;
        })
        .filter((r): r is SearchResult => r !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (e) {
      console.error('[Search] Search failed:', e);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, mA = 0, mB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      mA += a[i] * a[i];
      mB += b[i] * b[i];
    }
    return dot / (Math.sqrt(mA) * Math.sqrt(mB));
  }
}

export const semanticSearch = new SemanticSearchService();

