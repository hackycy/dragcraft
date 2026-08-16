import type { ComputedRef } from 'vue'
import type { NodeActionContext, ResolvedNodeAction } from './action-registry'
import type { NodeOwner } from './semantic'
import type { PresentationContext, PresentationNode } from './types'
import { computed } from 'vue'
import { resolveNodePresentation } from './material-presentation'

export interface UseNodeActionsReturn {
  /** Resolved actions for the current node with visibility/disabled computed */
  actions: ComputedRef<ResolvedNodeAction[]>
  /** The action context for the current node */
  actionContext: ComputedRef<NodeActionContext>
}

function resolveUncachedPosition(node: PresentationNode, owner: NodeOwner, ctx: PresentationContext) {
  const position = ctx.session.document.getStructurePosition(node.id)
  if (position && owner.kind === 'container') {
    return {
      owner: position.owner,
      index: position.index,
      siblingCount: position.siblingCount,
      sortScope: false as const,
      lockedIndices: ctx.session.materials.getLockedIndices(
        ctx.session.document.getRegionNodes(owner.containerId, owner.regionId),
      ),
    }
  }
  if (owner.kind === 'container') {
    const siblings = ctx.session.document.getRegionNodes(owner.containerId, owner.regionId)
    return {
      owner,
      index: siblings.findIndex(item => item.id === node.id),
      siblingCount: siblings.length,
      sortScope: false as const,
      lockedIndices: ctx.session.materials.getLockedIndices(siblings),
    }
  }

  const layout = resolveNodePresentation(ctx.session, node)
  const siblings = layout.sortScope === false
    ? ctx.session.document.rootNodes.value
    : ctx.session.document.rootNodes.value.filter(candidate =>
        resolveNodePresentation(ctx.session, candidate).sortScope === layout.sortScope,
      )
  return {
    owner: {
      kind: 'root' as const,
      sortScope: layout.sortScope === false ? undefined : layout.sortScope,
    },
    index: siblings.findIndex(candidate => candidate.id === node.id),
    siblingCount: siblings.length,
    sortScope: layout.sortScope,
    lockedIndices: layout.sortScope === false
      ? new Set<number>()
      : ctx.session.materials.getLockedIndices(siblings),
  }
}

/**
 * Composable that resolves the action system for a specific node.
 * Provides the list of visible, resolved actions with their handlers.
 *
 * @param getNode - Getter for the current schema node
 * @param ctx - The Presentation context
 */
export function useNodeActions(
  getNode: () => PresentationNode,
  ctx: PresentationContext,
  getOwner: () => NodeOwner = () => ({ kind: 'root' }),
): UseNodeActionsReturn {
  const { actionRegistry, actionInterceptors } = ctx

  const actionContext = computed<NodeActionContext>(() => {
    const node = getNode()
    const schema = ctx.schema.value
    const owner = getOwner()
    const material = ctx.session.materials.get(node.type)
    const position = ctx.resolveNodeActionPosition?.(node, owner)
      ?? resolveUncachedPosition(node, owner, ctx)

    return {
      node: node as unknown as import('@dragcraft/core').NodeDefinition,
      ...position,
      material,
      materials: ctx.session.materials,
      session: ctx.session,
      schema,
    }
  })

  const actions = computed<ResolvedNodeAction[]>(() => {
    return actionRegistry.resolve(actionContext.value, actionInterceptors)
  })

  return { actions, actionContext }
}
