import type { DesignerEngine, SchemaNode } from '@dragcraft/core'
import type { ComputedRef } from 'vue'
import type { NodeActionContext, ResolvedNodeAction } from '../action-registry'
import type { RendererContext } from '../types'
import { buildSchemaIndex, createLayoutPlan, getSortScopeEntries, resolveNodeLayout } from '@dragcraft/core'
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
): UseNodeActionsReturn {
  const { engine, actionRegistry, actionInterceptors } = ctx

  const actionContext = computed<NodeActionContext>(() => {
    const node = getNode()
    const schema = readRawSchema(engine)
    const layout = resolveNodeLayout(node, engine.registry, schema)
    const location = buildSchemaIndex(schema).index.get(node.id)
    const owner = location?.owner === 'root'
      ? {
          kind: 'root' as const,
          sortScope: layout.sortScope === false ? undefined : layout.sortScope,
        }
      : {
          kind: 'container' as const,
          containerId: location?.owner ?? '',
          regionId: location?.regionId ?? '',
        }
    const siblings = owner.kind === 'root'
      ? (layout.sortScope === false
          ? []
          : getSortScopeEntries(createLayoutPlan(schema, engine.registry), layout.sortScope).map(entry => entry.node))
      : (buildSchemaIndex(schema).index.get(owner.containerId)?.node.container?.regions[owner.regionId] ?? [])
    const index = siblings.findIndex(sibling => sibling.id === node.id)
    const meta = engine.registry.getWidget(node.type)

    return {
      node,
      owner,
      index,
      siblingCount: siblings.length,
      sortScope: owner.kind === 'root' ? layout.sortScope : false,
      meta,
      engine,
    }
  })

  const actions = computed<ResolvedNodeAction[]>(() => {
    return actionRegistry.resolve(actionContext.value, actionInterceptors)
  })

  return { actions, actionContext }
}
