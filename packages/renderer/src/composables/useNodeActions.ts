import type { DesignerEngine, SchemaNode } from '@dragcraft/core'
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

/**
 * Reads the raw schema while establishing a reactive dependency on schema.value.
 * Required because getRawSchema() returns toRaw(schema.value) which bypasses dependency tracking.
 */
function readRawSchema(engine: DesignerEngine) {
  void engine.store.schema.value
  return engine.store.getRawSchema()
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
  const { engine, actionRegistry, eventHooks } = ctx

  const actionContext = computed<NodeActionContext>(() => {
    const node = getNode()
    const children = readRawSchema(engine).root.children ?? []
    const index = children.findIndex(c => c.id === node.id)
    const meta = engine.registry.getWidget(node.type)

    return {
      node,
      index,
      siblingCount: children.length,
      meta,
      engine,
    }
  })

  const actions = computed<ResolvedNodeAction[]>(() => {
    return actionRegistry.resolve(actionContext.value, eventHooks)
  })

  return { actions, actionContext }
}
