import type { CommandContext, CommandResult, DuplicateNodePayload, NodeDestination } from '../types'
import { generateShortId } from '@dragcraft/utils'
import { cloneNodeSubtree } from '../helpers'
import { createLayoutPlan, getSortScopeEntries, resolveNodeLayout, resolveNodeSource } from '../layout'
import { buildSchemaIndex } from '../schema-index'
import { addNodeHandler } from './add-node'

export function duplicateNodeHandler(
  ctx: CommandContext,
  payload: DuplicateNodePayload,
): CommandResult {
  const schema = ctx.store.getRawSchema()
  const indexed = buildSchemaIndex(schema)
  const sourceResult = resolveNodeSource(schema, indexed, payload.nodeId)
  if (!sourceResult.ok)
    return sourceResult
  const source = sourceResult.value
  const sourceNode = source.location.node

  if (sourceNode.container && !ctx.registry.getWidget(sourceNode.type)?.container)
    return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }
  if (source.destination.kind === 'container') {
    const sourceDestination = source.destination
    const owner = indexed.index.get(sourceDestination.containerId)?.node
    const definition = owner && ctx.registry.getWidget(owner.type)?.container
    const variant = owner?.container && definition?.variants[owner.container.variant]
    const region = variant?.regions.find(item => item.id === sourceDestination.regionId)
    if (!definition || !variant || !region)
      return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }
  }

  const clone = cloneNodeSubtree(sourceNode, generateShortId)
  let destination: NodeDestination = { ...source.destination, index: source.index + 1 }
  if (source.destination.kind === 'root') {
    const sortScope = resolveNodeLayout(sourceNode, ctx.registry).sortScope
    if (sortScope !== false) {
      const entries = getSortScopeEntries(createLayoutPlan(schema, ctx.registry), sortScope)
      const scopeIndex = entries.findIndex(entry => entry.node.id === sourceNode.id)
      if (scopeIndex !== -1)
        destination = { ...source.destination, index: scopeIndex + 1 }
    }
  }
  const added = addNodeHandler(ctx, { node: clone, destination })
  if (!added)
    return { ok: false, code: 'DUPLICATE_ADD_REJECTED' }
  if (!added.ok)
    return added
  const addedEvent = added.eventPayload as { destination?: NodeDestination } | undefined
  return {
    ok: true,
    eventPayload: {
      sourceNodeId: payload.nodeId,
      nodeId: clone.id,
      destination: addedEvent?.destination ?? destination,
    },
  }
}
