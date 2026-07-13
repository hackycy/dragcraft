import type { CommandContext, CommandResult, MoveNodePayload } from '../types'
import { cloneDeep } from '@dragcraft/utils'
import { resolveBehavior } from '../behavior'
import { resolvePlacementDecision } from '../container-placement'
import {
  clampInsertIndex,
  createLayoutPlan,
  DEFAULT_SORT_SCOPE,
  getSortableArrayIndexForInsert,
  getSortScopeEntries,
  resolveDestination,
  resolveNodeLayout,
  resolveNodeSource,
  stripPageLayout,
} from '../layout'
import { buildSchemaIndex } from '../schema-index'
import {
  getLockedIndicesFromEntries,
  isInsertAllowed,
  isMoveAllowed,
  isRemoveAllowed,
} from '../sortable'

export function moveNodeHandler(ctx: CommandContext, payload: MoveNodePayload): CommandResult {
  const { store, registry } = ctx
  const rawSchema = store.getRawSchema()
  const indexed = buildSchemaIndex(rawSchema)
  const sourceResult = resolveNodeSource(rawSchema, indexed, payload.nodeId)
  if (!sourceResult.ok)
    return sourceResult
  const targetResult = resolveDestination(rawSchema, registry, payload.destination)
  if (!targetResult.ok)
    return targetResult

  const source = sourceResult.value
  const target = targetResult.value
  const node = source.location.node
  if (node.container && !registry.getWidget(node.type)?.container)
    return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }

  const sourceMeta = registry.getWidget(node.type)
  const behaviorContext = { node, schema: rawSchema }
  if (!resolveBehavior(sourceMeta?.draggable, behaviorContext)
    || !resolveBehavior(sourceMeta?.sortable, behaviorContext)) {
    return { ok: false, code: 'NODE_NOT_MOVABLE' }
  }

  if (source.destination.kind === 'container') {
    const sourceRegionId = source.destination.regionId
    const owner = indexed.index.get(source.destination.containerId)?.node
    const definition = owner && registry.getWidget(owner.type)?.container
    if (!definition)
      return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }
    const variant = owner?.container && definition.variants[owner.container.variant]
    const region = variant?.regions.find(item => item.id === sourceRegionId)
    const sameRegion = target.children === source.children
    const minItems = region?.constraints?.minItems ?? 0
    if (!sameRegion && source.children.length - 1 < minItems)
      return { ok: false, code: 'CONTAINER_REGION_MIN_ITEMS' }
  }

  let requestedIndex = payload.destination.kind === 'container'
    ? clampInsertIndex(payload.destination.index, target.children.length)
    : Math.max(0, payload.destination.index ?? Number.MAX_SAFE_INTEGER)
  if (target.container && target.definition && target.variant && target.region) {
    const targetCount = target.children.length - (target.children === source.children ? 1 : 0)
    const decision = resolvePlacementDecision({
      definition: target.definition,
      region: target.region,
      child: node,
      childHasContainerCapability: Boolean(sourceMeta?.container),
      targetCount,
      callbackContext: {
        operation: 'move',
        schema: rawSchema,
        container: target.container,
        variant: target.variant,
        region: target.region,
        child: node,
        targetIndex: requestedIndex,
      },
    })
    if (!decision.allowed) {
      return {
        ok: false,
        code: decision.code ?? 'CONTAINER_PLACEMENT_DENIED',
        messageKey: decision.messageKey,
        message: decision.message,
        details: decision.details,
      }
    }
  }

  if (payload.destination.kind === 'container'
    && source.destination.kind === 'container'
    && target.children === source.children
    && source.index < requestedIndex) {
    requestedIndex -= 1
  }
  if (payload.destination.kind === 'container'
    && source.destination.kind === 'container'
    && target.children === source.children
    && source.index === requestedIndex) {
    return { ok: false, code: 'MOVE_NOOP' }
  }

  const sourceScope = source.destination.kind === 'root'
    ? resolveNodeLayout(node, registry).sortScope
    : undefined
  const targetScope = payload.destination.kind === 'root'
    ? (payload.destination.sortScope
      ?? (sourceScope === false
        ? DEFAULT_SORT_SCOPE
        : sourceScope ?? resolveNodeLayout(node, registry).sortScope))
    : undefined
  const targetEntriesBefore = payload.destination.kind === 'root'
    ? getSortScopeEntries(createLayoutPlan(rawSchema, registry), targetScope || DEFAULT_SORT_SCOPE)
    : []
  if (payload.destination.kind === 'root')
    requestedIndex = clampInsertIndex(payload.destination.index, targetEntriesBefore.length)

  if (source.destination.kind === 'root') {
    if (sourceScope === false && payload.destination.kind === 'root')
      return { ok: false, code: 'NODE_NOT_SORTABLE' }
    const sourceEntries = sourceScope === false
      ? []
      : getSortScopeEntries(createLayoutPlan(rawSchema, registry), sourceScope)
    const sourceScopeIndex = sourceEntries.findIndex(entry => entry.node.id === node.id)
    const sourceLocks = getLockedIndicesFromEntries(sourceEntries, registry, rawSchema)
    if (payload.destination.kind === 'root' && targetScope === sourceScope) {
      if (sourceScopeIndex < requestedIndex)
        requestedIndex -= 1
      if (sourceScopeIndex === requestedIndex)
        return { ok: false, code: 'MOVE_NOOP' }
      if (!isMoveAllowed(sourceScopeIndex, requestedIndex, sourceLocks))
        return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
    }
    else if (sourceScope !== false && !isRemoveAllowed(sourceScopeIndex, sourceLocks)) {
      return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
    }
  }
  if (payload.destination.kind === 'root' && targetScope !== sourceScope) {
    const targetLocks = getLockedIndicesFromEntries(targetEntriesBefore, registry, rawSchema)
    if (!isInsertAllowed(requestedIndex, targetLocks))
      return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
  }

  const [removed] = source.children.splice(source.index, 1)
  const inserted = payload.destination.kind === 'container'
    ? stripPageLayout(removed)
    : cloneDeep(removed)
  const insertedIndex = payload.destination.kind === 'root'
    ? getSortableArrayIndexForInsert(
        getSortScopeEntries(createLayoutPlan(rawSchema, registry), targetScope || DEFAULT_SORT_SCOPE),
        target.children,
        requestedIndex,
      )
    : clampInsertIndex(requestedIndex, target.children.length)
  target.children.splice(insertedIndex, 0, inserted)
  return {
    ok: true,
    eventPayload: {
      nodeId: payload.nodeId,
      source: source.destination,
      destination: { ...payload.destination, index: insertedIndex },
    },
  }
}
