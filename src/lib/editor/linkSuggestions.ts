import { storage } from '../services/StorageService.svelte';
import { mount, unmount } from 'svelte';
import tippy from 'tippy.js';
import SlashMenu from '../components/SlashMenu.svelte';

export const linkSuggestion = {
  char: '[[',
  items: ({ query }: { query: string }) => {
    return storage.pages
      .filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
      .map(p => ({
        id: p.id,
        label: p.title || 'Untitled',
        title: p.title || 'Untitled',
        description: `Link to page: ${p.id.slice(0, 8)}`,
        icon: '🔗',
      }))
      .slice(0, 10);
  },

  render: () => {
    let component: any;
    let popup: any;
    let propsState = $state({
      items: [],
      command: (item: any) => {
        // The command from items is what we actually want to call
        // but tiptap-mention passes the item to its own command handler
        // which then calls the command we defined in items
      },
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

