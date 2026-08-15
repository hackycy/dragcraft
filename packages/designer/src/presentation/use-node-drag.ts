import type { PresentationContext, PresentationNode } from './types'
import { hideNativeDragImage } from './drag-image'

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
 * @param ctx - The Presentation context (from usePresentationContext)
 */
export function useNodeDrag(
  getNode: () => PresentationNode,
  ctx: PresentationContext,
): UseNodeDragReturn {
  const handleDragStart = (e: DragEvent) => {
    e.stopPropagation()
    const nodeId = getNode().id

    ctx.session.execute({ type: 'drag.set', target: { sourceNodeId: nodeId, widgetType: null } })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', nodeId)
      hideNativeDragImage(e.dataTransfer)
    }
  }

  const handleDragEnd = (e: DragEvent) => {
    e.stopPropagation()
    ctx.session.execute({ type: 'drag.set', target: null })
  }

  return { handleDragStart, handleDragEnd }
}
