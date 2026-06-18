import type { NodeInteractionState, RendererContext } from '../types'
import { computed } from 'vue'

/**
 * Computes reactive interaction state for a single schema node.
 *
 * @param getNodeId - Getter function returning the node ID (for reactivity safety)
 * @param ctx - The renderer context (from useRendererContext)
 */
export function useNodeState(
  getNodeId: () => string,
  ctx: RendererContext,
): NodeInteractionState {
  const { engine, dragOverNodeId } = ctx

  const isSelected = computed(
    () => engine.store.selectedNodeId.value === getNodeId(),
  )

  const isHovered = computed(
    () => engine.store.hoveredNodeId.value === getNodeId(),
  )

  const isDragOver = computed(
    () => dragOverNodeId.value === getNodeId(),
  )

  const interactionClasses = computed(() => ({
    'dc-node--selected': isSelected.value,
    'dc-node--hovered': isHovered.value,
    'dc-node--drag-over': isDragOver.value,
  }))

  return { isSelected, isHovered, isDragOver, interactionClasses }
}
