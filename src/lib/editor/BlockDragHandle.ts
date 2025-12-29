import { Extension } from '@tiptap/core'
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state'
import { DOMSerializer } from '@tiptap/pm/model'

export const BlockDragHandle = Extension.create({
  name: 'blockDragHandle',

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('blockDragHandle')

    let handle: HTMLElement | null = null
    let isDragging = false
    let draggedNodePos = -1

    return [
      new Plugin({
        key: pluginKey,

        view: (view) => {
          handle = document.createElement('div')
          handle.className = 'block-drag-handle'
          handle.draggable = true
          handle.innerHTML = '⠿'
          handle.style.cssText = `
            position: fixed;
            display: none;
            width: 24px;
            height: 24px;
            align-items: center;
            justify-content: center;
            color: #FF3E00;
            background: white;
            border: 2px solid black;
            box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
            font-size: 14px;
            cursor: grab;
            z-index: 9999;
            pointer-events: auto;
          `
          document.body.appendChild(handle)

          handle.addEventListener('dragstart', (e) => {
            if (!e.dataTransfer || draggedNodePos < 0) return

            isDragging = true
            handle!.style.cursor = 'grabbing'

            const selection = NodeSelection.create(view.state.doc, draggedNodePos)
            view.dispatch(view.state.tr.setSelection(selection))

            const slice = selection.content()
            const fragment = DOMSerializer.fromSchema(view.state.schema).serializeFragment(slice.content)
            const container = document.createElement('div')
            container.appendChild(fragment)
            
            e.dataTransfer.clearData()
            e.dataTransfer.setData('text/html', container.innerHTML)
            e.dataTransfer.effectAllowed = 'copyMove'
            e.dataTransfer.setDragImage(handle!, 12, 12)

            ;(view as any).dragging = {
              slice,
              move: true
            }
          })

          handle.addEventListener('dragend', () => {
            isDragging = false
            draggedNodePos = -1
            if (handle) {
              handle.style.display = 'none'
              handle.style.cursor = 'grab'
            }
          })

          return {
            destroy: () => {
              handle?.remove()
              handle = null
            },
          }
        },

        props: {
          handleDOMEvents: {
            mousemove: (view, event) => {
              if (!handle || isDragging || !view.editable) return false

              const pos = view.posAtCoords({ left: event.clientX + 40, top: event.clientY })
              if (!pos) return false

              try {
                const $pos = view.state.doc.resolve(pos.pos)
                if ($pos.depth < 1) return false

                const nodePos = $pos.before(1)
                const dom = view.nodeDOM(nodePos) as HTMLElement
                if (!dom || !(dom instanceof HTMLElement)) return false

                const rect = dom.getBoundingClientRect()
                const editorRect = view.dom.getBoundingClientRect()

                if (event.clientX < editorRect.left - 50 || event.clientX > editorRect.left + 80) {
                  handle.style.display = 'none'
                  return false
                }

                draggedNodePos = nodePos
                handle.style.display = 'flex'
                handle.style.top = `${rect.top}px`
                handle.style.left = `${editorRect.left - 30}px`
              } catch (e) {
                handle.style.display = 'none'
              }

              return false
            },
          },
        },
      }),
    ]
  },
})
