import type { DesignerSchema, NodeOwner, SchemaNode } from '@dragcraft/core'
import type { ComputedRef } from 'vue'
import type { NodeActionContext, ResolvedNodeAction } from '../action-registry'
import type { RendererContext } from '../types'
import { buildSchemaIndex, createLayoutPlan, getLockedIndices, getLockedIndicesFromNodes, getSortScopeEntries, resolveNodeLayout } from '@dragcraft/core'
import { computed } from 'vue'

export interface UseNodeActionsReturn {
  /** Resolved actions for the current node with visibility/disabled computed */
  actions: ComputedRef<ResolvedNodeAction[]>
  /** The action context for the current node */
  actionContext: ComputedRef<NodeActionContext>
}

function resolveUncachedPosition(node: SchemaNode, owner: NodeOwner, ctx: RendererContext) {
  const schema = ctx.schema.value as DesignerSchema
  if (owner.kind === 'container') {
    const container = buildSchemaIndex(schema).index.get(owner.containerId)?.node
    const siblings = container?.container?.regions[owner.regionId] ?? []
    return {
      owner,
      index: siblings.findIndex(item => item.id === node.id),
      siblingCount: siblings.length,
      sortScope: false as const,
      lockedIndices: getLockedIndicesFromNodes(siblings, ctx.engine.registry, schema),
    }
  }

  const layout = resolveNodeLayout(node, ctx.engine.registry, schema)
  const entries = layout.sortScope === false
    ? []
    : getSortScopeEntries(createLayoutPlan(schema, ctx.engine.registry), layout.sortScope)
  return {
    owner: {
      kind: 'root' as const,
      sortScope: layout.sortScope === false ? undefined : layout.sortScope,
    },
    index: entries.findIndex(entry => entry.node.id === node.id),
    siblingCount: entries.length,
    sortScope: layout.sortScope,
    lockedIndices: layout.sortScope === false
      ? new Set<number>()
      : getLockedIndices(schema.root.children ?? [], ctx.engine.registry, schema, layout.sortScope),
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
    const meta = engine.registry.getWidget(node.type)
    const position = ctx.resolveNodeActionPosition?.(node, owner)
      ?? resolveUncachedPosition(node, owner, ctx)

    return {
      node,
      ...position,
      meta,
      engine,
      schema,
    }
  })

  const actions = computed<ResolvedNodeAction[]>(() => {
    return actionRegistry.resolve(actionContext.value, actionInterceptors)
  })

  return { actions, actionContext }
}
