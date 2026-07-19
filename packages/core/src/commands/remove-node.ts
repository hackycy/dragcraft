import type { CommandContext, CommandResult, DesignerSchema, RemoveNodePayload } from '../types'
import { resolveBehavior } from '../behavior'
import { collectSubtreeIds } from '../helpers'
import { createLayoutPlan, getSortScopeEntries, resolveNodeLayout, resolveNodeSource } from '../layout'
import { buildSchemaIndex } from '../schema-index'
import { getLockedIndicesFromEntries, getLockedIndicesFromNodes, isRemoveAllowed } from '../sortable'

export function removeNodeHandler(ctx: CommandContext, payload: RemoveNodePayload): CommandResult {
  const { store, registry } = ctx
  const rawSchema = ctx.schema as DesignerSchema

  if (payload.nodeId === rawSchema.root.id) {
    console.warn('[dragcraft/core] REMOVE_NODE: cannot remove root node')
    return false
  }

  const indexed = buildSchemaIndex(rawSchema)
  const sourceResult = resolveNodeSource(rawSchema, indexed, payload.nodeId)
  if (!sourceResult.ok) {
    console.warn(`[dragcraft/core] REMOVE_NODE: node "${payload.nodeId}" not found`)
    return sourceResult
  }
  const source = sourceResult.value
  const node = source.location.node
  const meta = registry.getWidget(node.type)

  if (!resolveBehavior(meta?.deletable, { node, schema: rawSchema }))
    return { ok: false, code: 'NODE_NOT_DELETABLE' }
  if (node.container && !meta?.container)
    return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }

  if (source.destination.kind === 'container') {
    const sourceDestination = source.destination
    const owner = indexed.index.get(sourceDestination.containerId)?.node
    const definition = owner && registry.getWidget(owner.type)?.container
    if (!definition)
      return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }
    const variant = owner?.container && definition.variants[owner.container.variant]
    const region = variant?.regions.find(item => item.id === sourceDestination.regionId)
    if (!variant || !region)
      return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }
    if (source.children.length - 1 < (region.constraints?.minItems ?? 0))
      return { ok: false, code: 'CONTAINER_REGION_MIN_ITEMS' }
    const lockedIndices = getLockedIndicesFromNodes(source.children, registry, rawSchema)
    if (!isRemoveAllowed(source.index, lockedIndices))
      return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
  }

  // ── Sortable constraint ──
  if (source.destination.kind === 'root') {
    const layout = node ? resolveNodeLayout(node, registry) : null
    if (node && layout && layout.sortScope !== false) {
      const scopeEntries = getSortScopeEntries(createLayoutPlan(rawSchema, registry), layout.sortScope)
      const removeIndex = scopeEntries.findIndex(entry => entry.node.id === payload.nodeId)
      if (removeIndex !== -1) {
        const lockedIndices = getLockedIndicesFromEntries(scopeEntries, registry, rawSchema)
        if (lockedIndices.size > 0 && !isRemoveAllowed(removeIndex, lockedIndices)) {
          console.warn(
            `[dragcraft/core] REMOVE_NODE: blocked by sortable constraint`
            + ` (removing index ${removeIndex} would shift locked widgets)`,
          )
          return false
        }
      }
    }
  }

  const removedIds = collectSubtreeIds(node)
  const draftIndex = buildSchemaIndex(ctx.draft)
  const draftSource = resolveNodeSource(ctx.draft, draftIndex, payload.nodeId)
  if (!draftSource.ok)
    return draftSource
  draftSource.value.children.splice(draftSource.value.index, 1)
  if (store.selectedNodeId.value && removedIds.has(store.selectedNodeId.value))
    store.selectNode(null)
  if (store.hoveredNodeId.value && removedIds.has(store.hoveredNodeId.value))
    store.hoverNode(null)
  return {
    ok: true,
    eventPayload: { nodeId: payload.nodeId, source: source.destination },
  }
}
