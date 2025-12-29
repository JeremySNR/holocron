import { Node, mergeAttributes } from '@tiptap/core';
import { mount, unmount } from 'svelte';
import DatabaseView from '../components/DatabaseView.svelte';

export const DatabaseExtension = Node.create({
  name: 'databaseBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      databaseId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-database-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-database-id': HTMLAttributes.databaseId })];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div');
      dom.classList.add('database-node-view');

      let component = mount(DatabaseView, {
        target: dom,
        props: {
          databaseId: node.attrs.databaseId,
        },
      });

      return {
        dom,
        destroy: () => {
          unmount(component);
        },
      };
    };
  },
});
