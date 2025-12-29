import { mount, unmount } from 'svelte';
import tippy from 'tippy.js';
import SlashMenu from '../components/SlashMenu.svelte';

import { storage } from '../services/StorageService.svelte';
import { ai } from '../services/AIService';

export const suggestion = {
  items: ({ query }: { query: string }) => {
    return [
      {
        title: 'Text',
        description: 'Plain text block.',
        icon: '📄',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode('paragraph').run();
        },
      },
      {
        title: 'Heading 1',
        description: 'Large section heading.',
        icon: 'H1',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
        },
      },
      {
        title: 'Heading 2',
        description: 'Medium section heading.',
        icon: 'H2',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
        },
      },
      {
        title: 'Page Card',
        description: 'Large visual link to another page.',
        icon: '📇',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).insertContent({
            type: 'pageCard',
            attrs: { pageId: null }
          }).run();
        },
      },
      {
        title: 'Database Table',
        description: 'Store data in a grid.',
        icon: '📊',
        command: ({ editor, range }: any) => {
          const db = storage.createDatabase('Collection');
          editor.chain().focus().deleteRange(range).insertContent({
            type: 'databaseBlock',
            attrs: { databaseId: db.id }
          }).run();
        },
      },
      {
        title: 'Database Kanban',
        description: 'Manage tasks on a board.',
        icon: '📋',
        command: ({ editor, range }: any) => {
          const db = storage.createDatabase('Board');
          storage.updateDatabase(db.id, { currentView: 'kanban' });
          editor.chain().focus().deleteRange(range).insertContent({
            type: 'databaseBlock',
            attrs: { databaseId: db.id }
          }).run();
        },
      },
      {
        title: 'Callout',
        description: 'Notice or info block.',
        icon: '💡',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).insertContent({
            type: 'callout',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Info or notice...' }] }]
          }).run();
        },
      },
      {
        title: 'Checklist',
        description: 'To-do list.',
        icon: '✅',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
      },
      {
        title: 'Code Block',
        description: 'Syntax highlighted code.',
        icon: '💻',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
      },
      {
        title: 'Summarize (AI)',
        description: 'Get a summary of this page.',
        icon: '🪄',
        command: async ({ editor, range }: any) => {
          const text = editor.getText();
          if (!text || text.length < 10) {
            alert('Not enough content to summarize.');
            return;
          }

          editor.chain().focus().deleteRange(range).insertContent([
            { 
              type: 'heading', 
              attrs: { level: 3 }, 
              content: [{ type: 'text', text: 'Summary' }] 
            },
            { 
              type: 'callout', 
              attrs: { type: 'info' },
              content: [{ 
                type: 'paragraph', 
                content: [{ 
                  type: 'text', 
                  text: 'Processing summary...' 
                }] 
              }] 
            }
          ]).run();

          const loadingPos = editor.state.selection.from - 2;

          try {
            const summary = await ai.summarize(text);
            
            editor.chain().focus()
              .setMeta('addToHistory', false)
              .deleteRange({ from: loadingPos, to: editor.state.selection.from })
              .insertContent([
                { type: 'paragraph', content: [{ type: 'text', text: summary }] },
                { type: 'paragraph' }
              ])
              .run();
          } catch (e) {
            console.error('Summarization failed:', e);
            editor.chain().focus()
              .deleteRange({ from: loadingPos, to: editor.state.selection.from })
              .insertContent([
                { 
                  type: 'paragraph', 
                  content: [{ 
                    type: 'text', 
                    text: 'Failed to generate summary. Please try again.' 
                  }] 
                }
              ])
              .run();
          }
        },
      },
    ].filter(item => item.title.toLowerCase().includes(query.toLowerCase())).slice(0, 15);
  },

  render: () => {
    let component: any;
    let popup: any;
    let propsState = $state({
      items: [],
      command: () => {},
    });

    return {
      onStart: (props: any) => {
        propsState.items = props.items;
        propsState.command = props.command;

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: document.createElement('div'),
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });

        component = mount(SlashMenu, {
          target: popup[0].props.content,
          props: propsState,
        });
      },

      onUpdate(props: any) {
        propsState.items = props.items;
        propsState.command = props.command;

        if (popup) {
          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          });
        }
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }
        
        return component?.onKeyDown(props);
      },

      onExit() {
        if (popup) {
          popup[0].destroy();
        }
        if (component) {
          unmount(component);
        }
      },
    };
  },
};
