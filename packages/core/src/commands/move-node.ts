import type { CommandContext, CommandResult, MoveNodePayload } from '../types'
import { cloneDeep } from '@dragcraft/utils'
import { resolveBehavior } from '../behavior'
import { resolvePlacementDecision } from '../container-placement'
import { collectSubtreeIds } from '../helpers'
import {
  clampInsertIndex,
  createLayoutPlan,
  getSortableArrayIndexForInsert,
  getSortScopeEntries,
  resolveDestination,
  resolveNodeLayout,
  resolveNodeSource,
  stripPageLayout,
} from '../layout'
import { buildSchemaIndex } from '../schema-index'
import { validateSchema } from '../schema-validation'
import {
  getLockedIndicesFromEntries,
  getLockedIndicesFromNodes,
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
    if (!variant || !region)
      return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }
    const sameRegion = target.children === source.children
    const minItems = region.constraints?.minItems ?? 0
    if (!sameRegion && source.children.length - 1 < minItems)
      return { ok: false, code: 'CONTAINER_REGION_MIN_ITEMS' }
  }

  let requestedIndex = payload.destination.kind === 'container'
    ? clampInsertIndex(payload.destination.index, target.children.length)
    : Math.max(0, payload.destination.index ?? Number.MAX_SAFE_INTEGER)
  const sameRegion = payload.destination.kind === 'container'
    && source.destination.kind === 'container'
    && target.children === source.children
  if (sameRegion && source.index < requestedIndex)
    requestedIndex -= 1
  if (sameRegion && source.index === requestedIndex)
    return { ok: false, code: 'MOVE_NOOP' }

  if (source.destination.kind === 'container') {
    const sourceLocks = getLockedIndicesFromNodes(source.children, registry, rawSchema)
    if (sameRegion) {
      if (!isMoveAllowed(source.index, requestedIndex, sourceLocks))
        return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
    }
    else if (!isRemoveAllowed(source.index, sourceLocks)) {
      return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
    }
  }
  if (payload.destination.kind === 'container' && !sameRegion) {
    const targetLocks = getLockedIndicesFromNodes(target.children, registry, rawSchema)
    if (!isInsertAllowed(requestedIndex, targetLocks))
      return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
  }

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

  const sourceScope = source.destination.kind === 'root'
    ? resolveNodeLayout(node, registry).sortScope
    : undefined
  const targetScope = payload.destination.kind === 'root'
    ? (payload.destination.sortScope
      ?? sourceScope
      ?? resolveNodeLayout(node, registry).sortScope)
    : undefined
  const targetUsesSortScope = typeof targetScope === 'string'
  const targetEntriesBefore = payload.destination.kind === 'root' && targetUsesSortScope
    ? getSortScopeEntries(createLayoutPlan(rawSchema, registry), targetScope)
    : []
  if (payload.destination.kind === 'root') {
    requestedIndex = clampInsertIndex(
      payload.destination.index,
      targetUsesSortScope ? targetEntriesBefore.length : target.children.length,
    )
  }

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
  if (payload.destination.kind === 'root' && targetUsesSortScope && targetScope !== sourceScope) {
    const targetLocks = getLockedIndicesFromEntries(targetEntriesBefore, registry, rawSchema)
    if (!isInsertAllowed(requestedIndex, targetLocks))
      return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
  }

  const sameOwnerArray = target.children === source.children
  const sourceBefore = cloneDeep(source.children)
  const targetBefore = sameOwnerArray ? null : cloneDeep(target.children)
  const [removed] = source.children.splice(source.index, 1)
  const inserted = payload.destination.kind === 'container'
    ? stripPageLayout(removed)
    : cloneDeep(removed)
  const insertedIndex = payload.destination.kind === 'root'
    ? (targetUsesSortScope
        ? getSortableArrayIndexForInsert(
            getSortScopeEntries(createLayoutPlan(rawSchema, registry), targetScope),
            target.children,
            requestedIndex,
          )
        : clampInsertIndex(requestedIndex, target.children.length))
    : clampInsertIndex(requestedIndex, target.children.length)
  target.children.splice(insertedIndex, 0, inserted)
  const validation = validateSchema(rawSchema, registry)
  const movedNodeIds = collectSubtreeIds(inserted)
  const candidateDiagnostics = validation.diagnostics.filter(diagnostic =>
    (diagnostic.nodeId !== undefined && movedNodeIds.has(diagnostic.nodeId))
    || (diagnostic.ownerId !== undefined && movedNodeIds.has(diagnostic.ownerId)),
  )
  if (candidateDiagnostics.some(diagnostic => diagnostic.severity === 'error')) {
    source.children.splice(0, source.children.length, ...sourceBefore)
    if (targetBefore)
      target.children.splice(0, target.children.length, ...targetBefore)
    return {
      ok: false,
      code: 'SCHEMA_CANDIDATE_INVALID',
      details: { diagnostics: candidateDiagnostics },
    }
  }
  return {
    ok: true,
    eventPayload: {
      nodeId: payload.nodeId,
      source: source.destination,
      destination: { ...payload.destination, index: insertedIndex },
    },
  }
}
