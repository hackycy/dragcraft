import type { SchemaNode } from '@dragcraft/core'
import type { RendererContext } from '../types'
import { hideNativeDragImage } from '@dragcraft/utils'
import { fireAfterHook } from '../event-hooks'

export interface UseNodeDragReturn {
  /** Start a drag operation from the drag handle */
  handleDragStart: (e: DragEvent) => void
  /** End a drag operation */
  handleDragEnd: (e: DragEvent) => void
}

/**
 * Composable that encapsulates drag handle behavior for a widget node.
 * Integrates with event hooks for interceptable drag operations.
 *
 * @param getNode - Getter for the current schema node
 * @param ctx - The renderer context (from useRendererContext)
 */
export function useNodeDrag(
  getNode: () => SchemaNode,
  ctx: RendererContext,
): UseNodeDragReturn {
  const { engine, eventHooks } = ctx

  const handleDragStart = (e: DragEvent) => {
    e.stopPropagation()
    const nodeId = getNode().id

    // Fire interceptable hook
    if (eventHooks.onBeforeDrag) {
      const result = eventHooks.onBeforeDrag({ nodeId, event: e })
      if (result === false) {
        e.preventDefault()
        return
      }
    }

    engine.store.setDragTarget({
      sourceNodeId: nodeId,
      widgetType: null,
    })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', nodeId)
      hideNativeDragImage(e.dataTransfer)
    }
  }

  const handleDragEnd = (e: DragEvent) => {
    e.stopPropagation()
    engine.store.setDragTarget(null)
    fireAfterHook(eventHooks.onAfterDrag, { nodeId: getNode().id, event: e })
  }

  return { handleDragStart, handleDragEnd }
}
