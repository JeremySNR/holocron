# 🌌 Holocron

### The local-first knowledge base for people who love hardware design and hate cloud lock-in.

**Holocron** is what happens when you take the intuitive block-editing of Notion and wrap it in the tactile, industrial aesthetic of a Teenage Engineering synthesizer—all while keeping your data 100% off the cloud.

[**Watch the Demo (Coming Soon)**] · [**Read the Roadmap**](./TODO.md)

---

## Why did I build this?

I love Notion, but I don't love the feeling that my brain is living on someone else's server. I also missed the tactile, high-contrast feel of high-end hardware. 

Holocron is a "privacy-native" workspace. It doesn't just "support" local storage; it's built on a **Rust** core and **CRDTs (Yjs)** to ensure that your notes are yours, they're fast, and they work perfectly offline. Then, I added a local AI engine so you can search your notes by *concept*, not just keywords, without ever sending your data to a vector database in the cloud.

---

## ✨ Highlights

### 🎛️ Tactile Editing
A precision-engineered block editor. It feels less like a document and more like a drafting table. 
*   **The Operations Menu**: Hit `/` to pull up an industrial command palette.
*   **Checklists & Code**: Built for speed and high-contrast readability.
*   **Tactile DND**: Everything is a block. Grab the `::: ` handles and move things around.

### 📊 Industrial Data Grids
Relational databases that actually look like they belong on a piece of hardware. Add columns, track statuses, and verify your data with built-in "checksum" indicators.

### 🔍 Semantic Discovery (Local!)
Most "AI Search" tools send your notes to a cloud provider to be indexed. Holocron does it **locally** using a high-performance Rust embedding engine. It finds the *meaning* behind your notes, so searching for "launching a rocket" will find your notes on "aerospace milestones" automatically.

### 🪄 AI Co-Processor
A dedicated side-panel for your AI. Connect to **OpenRouter** to use the latest flagship models like `GPT-5.2` or `Claude 4`. The best part? The AI is **database-aware**—you can ask it questions directly about the data in your tables.

---

## 🔋 The Stack

I wanted this to be as modern and fast as possible:
*   **Frontend**: Svelte 5 (Runes) — because reactivity should be simple.
*   **Styling**: Tailwind CSS 4.0 — high-speed utility design.
*   **Desktop**: Tauri + Rust — native performance, tiny footprint.
*   **Persistence**: Yjs + IndexedDB — conflict-free data that lives in your browser/app storage.

---

## 🚀 Get it running

If you want to play with the alpha, you'll need **Node.js** and **Rust** installed.

```bash
# 1. Clone the repo
git clone https://github.com/JeremySNR/holocron.git

# 2. Install the bits
npm install

# 3. Boot the system
npx tauri dev
```

**Note:** To enable the AI features, pop into the **Settings** menu in the sidebar and add your OpenRouter API key.

---

## 🚧 Status: Alpha

This is an early-stage project. It's functional, fast, and I use it daily, but expect some rough edges as I polish the "industrial" feel. I'm currently working on **Markdown Exports** and **End-to-End Encryption** for the upcoming sync engine.

---

## 📜 License
MIT. It’s your code, your data, your brain.

---

**🌌 Let's build a better way to think.**
