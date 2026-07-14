import type { AddNodePayload, CommandContext, CommandResult } from '../types'
import { cloneDeep } from '@dragcraft/utils'
import { resolveCreatable } from '../behavior'
import { createContainerState, createRegisteredNode, resolvePlacementDecision } from '../container-placement'
import { collectSubtreeIds } from '../helpers'
import { clampInsertIndex, createLayoutPlan, getSortableArrayIndexForInsert, getSortScopeEntries, resolveDestination, resolveNodeLayout, stripPageLayout } from '../layout'
import { buildSchemaIndex } from '../schema-index'
import { cloneSchema } from '../schema-utils'
import { validateSchema } from '../schema-validation'
import { getLockedIndicesFromEntries, getLockedIndicesFromNodes, isInsertAllowed } from '../sortable'

export function addNodeHandler(ctx: CommandContext, payload: AddNodePayload): CommandResult {
  const { store, registry } = ctx
  const rawSchema = store.getRawSchema()
  const meta = registry.getWidget(payload.node.type)
  const destination = payload.destination ?? { kind: 'root' as const }

  const createDecision = meta
    ? resolveCreatable(meta.creatable, {
        widgetType: payload.node.type,
        schema: rawSchema,
      }, true)
    : { allowed: true }

  if (!createDecision.allowed) {
    const reason = createDecision.message ?? createDecision.messageKey ?? createDecision.code
    console.warn(
      `[dragcraft/core] ADD_NODE: blocked by creatable constraint for widget type "${payload.node.type}"${reason ? ` (${reason})` : ''}`,
    )
    return {
      ok: false,
      code: createDecision.code ?? 'NODE_NOT_CREATABLE',
      messageKey: createDecision.messageKey,
      message: createDecision.message,
    }
  }

  const node = cloneDeep(payload.node)
  const candidateNodeIds = collectSubtreeIds(node)
  if (node.container && !meta)
    return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }
  if (node.container && !meta?.container)
    return { ok: false, code: 'CONTAINER_CAPABILITY_MISMATCH' }
  if (destination.kind === 'container' && meta?.container)
    return { ok: false, code: 'CONTAINER_NESTING_FORBIDDEN' }

  if (meta?.container && !node.container) {
    const initialized = createContainerState(
      node,
      rawSchema,
      registry,
      createRegisteredNode(registry),
    )
    if (!initialized.ok)
      return initialized
    node.container = initialized.state
  }

  const idCandidate = cloneSchema(rawSchema)
  idCandidate.root.children ??= []
  idCandidate.root.children.push(cloneDeep(node))
  const idDiagnostics = buildSchemaIndex(idCandidate).diagnostics.filter(
    diagnostic => diagnostic.code === 'SCHEMA_NODE_ID_DUPLICATE',
  )
  if (idDiagnostics.length > 0) {
    return {
      ok: false,
      code: 'SCHEMA_NODE_ID_DUPLICATE',
      details: { diagnostics: idDiagnostics },
    }
  }

  if (node.container) {
    const candidate = cloneSchema(rawSchema)
    candidate.root.children ??= []
    candidate.root.children.push(cloneDeep(node))
    const validation = validateSchema(candidate, registry)
    const candidateDiagnostics = validation.diagnostics.filter(diagnostic =>
      (diagnostic.nodeId !== undefined && candidateNodeIds.has(diagnostic.nodeId))
      || (diagnostic.ownerId !== undefined && candidateNodeIds.has(diagnostic.ownerId)),
    )
    if (candidateDiagnostics.some(diagnostic => diagnostic.severity === 'error')) {
      return {
        ok: false,
        code: 'CONTAINER_STATE_INVALID',
        details: { diagnostics: candidateDiagnostics },
      }
    }
  }

  if (destination.kind === 'container') {
    const targetResult = resolveDestination(rawSchema, registry, destination)
    if (!targetResult.ok)
      return targetResult
    const target = targetResult.value
    if (!target.container || !target.definition || !target.variant || !target.region)
      return { ok: false, code: 'CONTAINER_DESTINATION_REQUIRED' }

    const index = clampInsertIndex(destination.index, target.children.length)
    const lockedIndices = getLockedIndicesFromNodes(target.children, registry, rawSchema)
    if (!isInsertAllowed(index, lockedIndices))
      return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
    const decision = resolvePlacementDecision({
      definition: target.definition,
      region: target.region,
      child: node,
      childHasContainerCapability: Boolean(meta?.container),
      targetCount: target.children.length,
      callbackContext: {
        operation: 'add',
        schema: rawSchema,
        container: target.container,
        variant: target.variant,
        region: target.region,
        child: node,
        targetIndex: index,
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

    const candidate = cloneSchema(rawSchema)
    const candidateTarget = resolveDestination(candidate, registry, destination)
    if (!candidateTarget.ok)
      return candidateTarget
    candidateTarget.value.children.splice(index, 0, stripPageLayout(cloneDeep(node)))
    const validation = validateSchema(candidate, registry)
    const candidateDiagnostics = validation.diagnostics.filter(diagnostic =>
      (diagnostic.nodeId !== undefined && candidateNodeIds.has(diagnostic.nodeId))
      || (diagnostic.ownerId !== undefined && candidateNodeIds.has(diagnostic.ownerId)),
    )
    if (candidateDiagnostics.some(diagnostic => diagnostic.severity === 'error')) {
      return {
        ok: false,
        code: 'SCHEMA_CANDIDATE_INVALID',
        details: { diagnostics: candidateDiagnostics },
      }
    }

    target.children.splice(index, 0, stripPageLayout(node))
    return {
      ok: true,
      eventPayload: { nodeId: node.id, destination: { ...destination, index } },
    }
  }

  rawSchema.root.children ??= []
  const rootChildren = rawSchema.root.children
  const nodeLayout = resolveNodeLayout(node, registry)
  const resolvedScope = destination.sortScope
    ?? (nodeLayout.sortScope === false ? undefined : nodeLayout.sortScope)
  let resolvedArrayIndex = rootChildren.length
  if (destination.index !== undefined && resolvedScope !== undefined) {
    const scopeEntries = getSortScopeEntries(createLayoutPlan(rawSchema, registry), resolvedScope)
    const lockedIndices = getLockedIndicesFromEntries(scopeEntries, registry, rawSchema)
    if (!isInsertAllowed(destination.index, lockedIndices))
      return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
    resolvedArrayIndex = getSortableArrayIndexForInsert(
      scopeEntries,
      rootChildren,
      destination.index,
    )
  }
  else if (destination.index !== undefined) {
    resolvedArrayIndex = clampInsertIndex(destination.index, rootChildren.length)
  }

  const candidate = cloneSchema(rawSchema)
  candidate.root.children ??= []
  candidate.root.children.splice(resolvedArrayIndex, 0, cloneDeep(node))
  const validation = validateSchema(candidate, registry)
  const candidateDiagnostics = validation.diagnostics.filter(diagnostic =>
    (diagnostic.nodeId !== undefined && candidateNodeIds.has(diagnostic.nodeId))
    || (diagnostic.ownerId !== undefined && candidateNodeIds.has(diagnostic.ownerId)),
  )
  if (candidateDiagnostics.some(diagnostic => diagnostic.severity === 'error')) {
    return {
      ok: false,
      code: 'SCHEMA_CANDIDATE_INVALID',
      details: { diagnostics: candidateDiagnostics },
    }
  }

  rootChildren.splice(resolvedArrayIndex, 0, node)
  return {
    ok: true,
    eventPayload: {
      nodeId: node.id,
      destination: { kind: 'root', sortScope: resolvedScope, index: resolvedArrayIndex },
    },
  }
}
