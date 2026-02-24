import type { SchemaNode } from '@dragcraft/core'
import { CommandType } from '@dragcraft/core'
import { RootRenderer } from '@dragcraft/renderer'
import { generateShortId } from '@dragcraft/utils'
import { computed, defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'

export default defineComponent({
  name: 'DcCanvas',

  setup() {
    const ctx = useDesignerContext()
    const { engine, componentMap, extensions, dragOverNodeId } = ctx

    // Build renderer extensions (merge designer-level overrides)
    const rendererExtensions = computed(() => ({
      ...(extensions.rendererExtensions ?? {}),
    }))

    // ── Drag event handlers (event delegation) ──

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      // Flat model: always drop into root
      dragOverNodeId.value = 'root'
      if (e.dataTransfer) {
        const dragTarget = engine.store.dragTarget.value
        e.dataTransfer.dropEffect = dragTarget?.sourceNodeId ? 'move' : 'copy'
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      // Only clear if leaving the canvas entirely
      const relatedTarget = e.relatedTarget as HTMLElement | null
      const canvasEl = e.currentTarget as HTMLElement
      if (!relatedTarget || !canvasEl.contains(relatedTarget)) {
        dragOverNodeId.value = null
      }
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      dragOverNodeId.value = null

      const dragTarget = engine.store.dragTarget.value
      if (!dragTarget)
        return

      if (dragTarget.sourceNodeId) {
        // Moving existing node — append to end
        const children = engine.store.getRawSchema().root.children ?? []
        engine.execute({
          type: CommandType.MOVE_NODE,
          payload: {
            nodeId: dragTarget.sourceNodeId,
            index: children.length,
          },
        })
      }
      else if (dragTarget.widgetType) {
        // Adding new widget from material panel
        const meta = engine.registry.getWidget(dragTarget.widgetType)
        if (!meta)
          return

        const newNode: SchemaNode = {
          id: generateShortId(),
          type: meta.type,
          props: { ...meta.defaultProps },
          style: meta.defaultStyle ? { ...meta.defaultStyle } : undefined,
        }

        engine.execute({
          type: CommandType.ADD_NODE,
          payload: {
            node: newNode,
          },
        })

        // Auto-select the newly added widget
        engine.store.selectNode(newNode.id)
      }

      // Clear drag state
      engine.store.setDragTarget(null)
    }

    // Deselect when clicking canvas background
    const handleClick = (e: MouseEvent) => {
      // Only deselect if clicking the canvas itself (not a child node)
      const target = e.target as HTMLElement
      if (
        target.classList.contains('dc-canvas')
        || target.classList.contains('dc-root-renderer')
      ) {
        engine.store.selectNode(null)
      }
    }

    return () =>
      h(
        'div',
        {
          class: 'dc-canvas',
          onDragover: handleDragOver,
          onDragleave: handleDragLeave,
          onDrop: handleDrop,
          onClick: handleClick,
        },
        [
          h(RootRenderer, {
            engine,
            componentMap,
            extensions: rendererExtensions.value,
            dragOverNodeId,
          }),
        ],
      )
  },
})
