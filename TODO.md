# Holocron Project Checklist

This file tracks the progress of the Holocron project: a local-first, AI-native knowledge base.

## 🏗 Phase 1: Foundation & MVP (Current)
- [x] **Project Scaffolding**: Tauri + SvelteKit + TypeScript + Tailwind CSS integration.
- [x] **Core Layout**: Responsive 3-pane layout (Sidebar, Main Content, AI Panel).
- [x] **Local Storage Layer**: Yjs for CRDTs and IndexedDB for persistence.
- [x] **Block-Based Editor (Basic)**: Tiptap integration with basic text formatting.
- [x] **Page Hierarchy**: Creation of pages and sub-pages in a tree structure.
- [x] **Keyword Search**: Instant search across page titles.
- [x] **AI Assistant UI**: Chat interface for interacting with notes.
- [x] **Slash Commands (`/`)**: Inline menu for inserting block types or AI actions.
- [x] **Advanced Blocks**:
    - [x] Checklists
    - [x] Code blocks with syntax highlighting
    - [x] Simple Tables
    - [x] Callouts/Toggles
- [x] **Drag-and-Drop Reorganization**:
    - [x] Moving pages in the Sidebar hierarchy.
    - [ ] Reordering blocks within a page.
- [x] **Semantic Search**: Implementation of vector embeddings for "concept-based" search.
- [/] **Real AI Integration**:
    - [x] Connect to OpenAI API (via OpenRouter).
    - [x] Natural Language Q&A ("Ask your knowledge base").
    - [x] One-click Summarization.
- [x] **Internal Linking**: `@mention` or `[[link]]` support for connecting pages.

## 🤝 Phase 2: Collaboration & Portability
- [ ] **Data Portability**:
    - [ ] Export to Markdown/PDF.
    - [ ] Import from Notion (Markdown/CSV).
- [ ] **Sync Engine**:
    - [ ] Peer-to-peer sync or optional self-hosted relay server.
    - [ ] End-to-end encryption for synced data.
- [ ] **Public Sharing**: One-click "Publish to Web" (read-only snapshots).
- [ ] **Theme System**: Polished Light/Dark mode and accent colors.

## 🚀 Phase 3: Advanced Features (Post-MVP)
- [x] **Relational Databases**: Notion-style databases with custom properties.
- [x] **Database Views**: Kanban boards, Calendar, and Gallery views.
- [ ] **Plugin SDK**: API for community-developed blocks and integrations.
- [ ] **Whiteboard/Canvas**: Infinite spatial canvas for visual note-taking.
- [ ] **Mobile Support**: Optimized responsive web UI or native mobile wrapper.
- [ ] **Enterprise Features**: SSO, granular permissions, and workspace admin tools.

---
*Last Updated: December 29, 2025*

