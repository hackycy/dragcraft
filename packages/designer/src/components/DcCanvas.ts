import type { SchemaNode } from '@dragcraft/core'
import { CommandType } from '@dragcraft/core'
import { RootRenderer } from '@dragcraft/renderer'
import { generateShortId } from '@dragcraft/utils'
import { computed, defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'

/**
 * Walk up the DOM tree to find the nearest container node element.
 * Uses data-node-id and dc-node--container class set by the renderer.
 */
function findClosestContainer(el: HTMLElement | null): string | null {
  while (el) {
    const nodeId = el.getAttribute('data-node-id')
    if (nodeId) {
      // root is always a valid drop target
      if (nodeId === 'root')
        return nodeId
      // containers have the dc-node--container class
      if (el.classList.contains('dc-node--container'))
        return nodeId
    }
    el = el.parentElement
  }
  return null
}

export default defineComponent({
  name: 'DcCanvas',

  setup() {
    const ctx = useDesignerContext()
    const { engine, componentMap, extensions, dragOverNodeId } = ctx

    // Build renderer extensions (merge designer-level overrides)
    const rendererExtensions = computed(() => ({
      ...(extensions.rendererExtensions ?? {}),
      ...(extensions.canvasContainerRenderer
        ? { containerShell: extensions.canvasContainerRenderer }
        : {}),
    }))

    // ── Drag event handlers (event delegation) ──

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      const containerId = findClosestContainer(e.target as HTMLElement)
      if (containerId) {
        dragOverNodeId.value = containerId
      }
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
      const containerId = findClosestContainer(e.target as HTMLElement) ?? 'root'
      dragOverNodeId.value = null

      const dragTarget = engine.store.dragTarget.value
      if (!dragTarget)
        return

      if (dragTarget.sourceNodeId) {
        // Moving existing node
        engine.execute({
          type: CommandType.MOVE_NODE,
          payload: {
            nodeId: dragTarget.sourceNodeId,
            targetParentId: containerId,
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
          nodeType: meta.canHaveChildren ? 'container' : 'widget',
          props: { ...meta.defaultProps },
          style: meta.defaultStyle ? { ...meta.defaultStyle } : undefined,
          children: meta.canHaveChildren ? [] : undefined,
        }

        engine.execute({
          type: CommandType.ADD_NODE,
          payload: {
            parentId: containerId,
            node: newNode,
          },
        })
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
