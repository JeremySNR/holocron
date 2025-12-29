import { storage } from './StorageService.svelte';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
}

class AIService {
  private async fetchOpenRouter(messages: Message[]) {
    const { openRouterKey, selectedModel } = storage.settings;
    
    if (!openRouterKey) {
      throw new Error('API_KEY_MISSING');
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.error?.message || 'API_REQUEST_FAILED');
    }

    const data = await response.json();
    return data.choices[0].message.content as string;
  }

  async summarize(text: string): Promise<string> {
    return this.fetchOpenRouter([
      { role: 'user', content: `Summarize the following text concisely:\n\n${text}` }
    ]);
  }

  async ask(question: string, context: string, databases: any[] = []): Promise<string> {
    let dbContext = "";
    if (databases.length > 0) {
      dbContext = "\n\nAvailable Databases:\n" + databases.map(db => {
        const headers = db.columns.map((c: any) => c.name).join(' | ');
        const rows = db.rows.map((r: any) => {
          return db.columns.map((c: any) => r[c.id] || '').join(' | ');
        }).join('\n');
        return `Table: ${db.title}\nHeaders: ${headers}\nData:\n${rows}`;
      }).join('\n\n');
    }

    return this.fetchOpenRouter([
      { 
        role: 'system', 
        content: `You are a helpful assistant integrated into Holocron, a knowledge base app. Use the provided context and database information to answer accurately.\n\nPage Context:\n${context}${dbContext}` 
      },
      { role: 'user', content: question }
    ]);
  }
}

export const ai = new AIService();
