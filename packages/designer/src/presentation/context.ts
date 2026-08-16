import type { NodeOwner } from './semantic'
import type { ApplicationSurfaceOptions, PresentationContext, PresentationNode } from './types'
import { computed, inject, ref } from 'vue'
import { createNodeActionRegistry } from './action-registry'
import { PRESENTATION_CONTEXT_KEY } from './types'

/**
 * Creates a PresentationContext from the semantic session projection.
 * Called internally by ApplicationSurface.
 */
export function createPresentationContext(options: ApplicationSurfaceOptions): PresentationContext {
  const schema = computed(() => options.session.document.schema.value)

  function resolveNodeActionPosition(node: PresentationNode, owner: NodeOwner) {
    const position = options.session.document.getStructurePosition(node.id)
    if (position && owner.kind === 'container') {
      return {
        owner: position.owner,
        index: position.index,
        siblingCount: position.siblingCount,
        lockedIndices: options.session.materials.getLockedIndices(
          options.session.document.getRegionNodes(owner.containerId, owner.regionId),
        ),
      }
    }

    if (owner.kind === 'container') {
      const siblings = options.session.document.getRegionNodes(owner.containerId, owner.regionId)
      return {
        owner,
        index: siblings.findIndex(item => item.id === node.id),
        siblingCount: siblings.length,
        lockedIndices: options.session.materials.getLockedIndices(siblings),
      }
    }

    const rootNodes = options.session.document.rootNodes.value
    const siblings = rootNodes
    return {
      owner: { kind: 'root' as const },
      index: siblings.findIndex(item => item.id === node.id),
      siblingCount: siblings.length,
      lockedIndices: options.session.materials.getLockedIndices(siblings),
    }
  }

  return {
    session: options.session,
    schema,
    resolveNodeActionPosition,
    containerShell: options.containerShell,
    actionInterceptors: options.actionInterceptors ?? [],
    actionRegistry: options.actionRegistry ?? createNodeActionRegistry(),
    selectedNodeId: options.session.state.selectedNodeId,
    hoveredNodeId: options.session.state.hoveredNodeId,
    dragOverNodeId: options.dragOverNodeId ?? ref(null),
    activeDestination: options.activeDestination ?? options.session.state.drag.activeDestination,
    containerDropDecision: options.containerDropDecision ?? options.session.state.drag.containerDropDecision,
    onContainerDragOver: options.onContainerDragOver,
    onContainerDragLeave: options.onContainerDragLeave,
    onContainerDrop: options.onContainerDrop,
    interactionBoundary: options.interactionBoundary,
    viewScale: options.viewScale ?? ref(1),
  }
}

/**
 * Injects the PresentationContext from the nearest ancestor ApplicationSurface.
 * Throws if called outside the Application Surface component tree.
 */
export function usePresentationContext(): PresentationContext {
  const ctx = inject(PRESENTATION_CONTEXT_KEY)
  if (!ctx) {
    throw new Error(
      '[dragcraft/designer] PresentationContext not found. '
      + 'Ensure this component is a descendant of ApplicationSurface.',
    )
  }
  return ctx
}
