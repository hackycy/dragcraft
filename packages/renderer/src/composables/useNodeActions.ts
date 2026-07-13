import type { DesignerEngine, NodeOwner, SchemaNode } from '@dragcraft/core'
import type { ComputedRef } from 'vue'
import type { NodeActionContext, ResolvedNodeAction } from '../action-registry'
import type { RendererContext } from '../types'
import { createLayoutPlan, getSortScopeEntries, resolveNodeLayout } from '@dragcraft/core'
import { computed } from 'vue'

export interface UseNodeActionsReturn {
  /** Resolved actions for the current node with visibility/disabled computed */
  actions: ComputedRef<ResolvedNodeAction[]>
  /** The action context for the current node */
  actionContext: ComputedRef<NodeActionContext>
}

/**
 * Reads a safe schema snapshot while establishing a reactive dependency on schema.value.
 */
function readRawSchema(engine: DesignerEngine) {
  void engine.store.schema.value
  return engine.state.getSchema()
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
    const schema = readRawSchema(engine)
    const owner = getOwner()
    const meta = engine.registry.getWidget(node.type)

    if (owner.kind === 'container') {
      const container = engine.state.getNodeById(owner.containerId)
      const siblings = container?.container?.regions[owner.regionId] ?? []
      return {
        node,
        owner,
        index: siblings.findIndex(item => item.id === node.id),
        siblingCount: siblings.length,
        sortScope: false,
        meta,
        engine,
      }
    }

    const layout = resolveNodeLayout(node, engine.registry, schema)
    const rootOwner = {
      kind: 'root' as const,
      sortScope: layout.sortScope === false ? undefined : layout.sortScope,
    }
    const siblings = layout.sortScope === false
      ? []
      : getSortScopeEntries(createLayoutPlan(schema, engine.registry), layout.sortScope).map(entry => entry.node)
    const index = siblings.findIndex(sibling => sibling.id === node.id)

    return {
      node,
      owner: rootOwner,
      index,
      siblingCount: siblings.length,
      sortScope: layout.sortScope,
      meta,
      engine,
    }
  })

  const actions = computed<ResolvedNodeAction[]>(() => {
    return actionRegistry.resolve(actionContext.value, actionInterceptors)
  })

  return { actions, actionContext }
}
