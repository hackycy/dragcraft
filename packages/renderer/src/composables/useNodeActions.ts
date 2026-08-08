import type { NodeOwner, SchemaNode } from '@dragcraft/core'
import type { ComputedRef } from 'vue'
import type { NodeActionContext, ResolvedNodeAction } from '../action-registry'
import type { RendererContext } from '../types'
import { computed } from 'vue'

export interface UseNodeActionsReturn {
  /** Resolved actions for the current node with visibility/disabled computed */
  actions: ComputedRef<ResolvedNodeAction[]>
  /** The action context for the current node */
  actionContext: ComputedRef<NodeActionContext>
}

function resolveUncachedPosition(node: SchemaNode, owner: NodeOwner, ctx: RendererContext) {
  const position = ctx.session.document.getStructurePosition(node.id)
  if (position) {
    return {
      owner: position.owner,
      index: position.index,
      siblingCount: position.siblingCount,
      sortScope: position.sortScope,
      lockedIndices: new Set(position.lockedIndices),
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

  const layout = ctx.session.materials.resolveLayout(node)
  const siblings = layout.sortScope === false
    ? ctx.session.document.rootNodes.value
    : ctx.session.document.rootNodes.value.filter(candidate =>
        ctx.session.materials.resolveLayout(candidate).sortScope === layout.sortScope,
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
 * @param ctx - The renderer context
 */
export function useNodeActions(
  getNode: () => SchemaNode,
  ctx: RendererContext,
  getOwner: () => NodeOwner = () => ({ kind: 'root' }),
): UseNodeActionsReturn {
  const { engine, actionRegistry, actionInterceptors } = ctx

  const actionContext = computed<NodeActionContext>(() => {
    const node = getNode()
    const schema = ctx.schema.value
    const owner = getOwner()
    const meta = ctx.session.materials.get(node.type)
    const position = ctx.resolveNodeActionPosition?.(node, owner)
      ?? resolveUncachedPosition(node, owner, ctx)

    return {
      node,
      ...position,
      meta,
      materials: ctx.session.materials,
      engine,
      schema,
    }
  })

  const actions = computed<ResolvedNodeAction[]>(() => {
    return actionRegistry.resolve(actionContext.value, actionInterceptors)
  })

  return { actions, actionContext }
}
