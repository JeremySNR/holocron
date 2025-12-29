import { Node, mergeAttributes } from '@tiptap/core';
import { mount, unmount } from 'svelte';
import PageCard from '../components/PageCard.svelte';

export const PageCardExtension = Node.create({
  name: 'pageCard',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      pageId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-card"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div', 
      mergeAttributes(HTMLAttributes, { 
        'data-type': 'page-card',
        'data-page-id': node.attrs.pageId,
      }),
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div');
      dom.classList.add('page-card-node-view');

      // In Svelte 5, we can't easily make props reactive from outside 
      // without a wrapper or using $state. 
      // However, for now let's just mount it.
      let component = mount(PageCard, {
        target: dom,
        props: {
          pageId: node.attrs.pageId,
          updateAttributes: (attrs: any) => {
            if (typeof getPos === 'function') {
              const pos = getPos();
              if (typeof pos === 'number') {
                editor.chain().focus().setNodeSelection(pos).updateAttributes('pageCard', attrs).run();
              }
            }
          },
          editor,
        },
      });

      return {
        dom,
        update: (newNode) => {
          if (newNode.type !== node.type) return false;
          
          // If pageId changed, we might need to re-mount or use a reactive pattern.
          // For now, let's see if this is what was causing the hang.
          if (newNode.attrs.pageId !== node.attrs.pageId) {
            unmount(component);
            component = mount(PageCard, {
              target: dom,
              props: {
                pageId: newNode.attrs.pageId,
                updateAttributes: (attrs: any) => {
                  if (typeof getPos === 'function') {
                    const pos = getPos();
                    if (typeof pos === 'number') {
                      editor.chain().focus().setNodeSelection(pos).updateAttributes('pageCard', attrs).run();
                    }
                  }
                },
                editor,
              },
            });
          }
          return true;
        },
        destroy: () => {
          unmount(component);
        },
      };
    };
  },
});
