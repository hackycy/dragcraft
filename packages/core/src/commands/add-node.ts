import type { AddNodePayload, CommandContext, CommandExecutionResult, CommandResult, DesignerSchema } from '../types'
import { cloneDeep } from '@dragcraft/utils'
import { validateSubtreeCreation } from '../authoring-policy'
import { createContainerState, createRegisteredNode, resolvePlacementDecision } from '../container-placement'
import { collectSubtreeIds } from '../helpers'
import { clampInsertIndex, createLayoutPlan, getSortableArrayIndexForInsert, getSortScopeEntries, resolveDestination, resolveNodeLayout, stripPageLayout } from '../layout'
import { buildSchemaIndex } from '../schema-index'
import { cloneSchema } from '../schema-utils'
import { validateSchema } from '../schema-validation'
import { getLockedIndicesFromEntries, getLockedIndicesFromNodes, isInsertAllowed } from '../sortable'

type CreationFailure = Extract<CommandExecutionResult, { ok: false }>

function reportCreationBlocked(nodeType: string, creation: CreationFailure): CreationFailure {
  const blockedType = typeof creation.details?.widgetType === 'string'
    ? creation.details.widgetType
    : nodeType
  const fallbackCode = creation.code === 'NODE_NOT_CREATABLE'
    || creation.code === 'SCHEMA_MANAGED_CREATION_FORBIDDEN'
    || creation.code === 'AUTHORING_PREDICATE_FAILED'
    || creation.code === 'AUTHORING_PREDICATE_INVALID'
    ? undefined
    : creation.code
  const reason = creation.message ?? creation.messageKey ?? fallbackCode
  console.warn(
    `[dragcraft/core] ADD_NODE: blocked by creatable constraint for widget type "${blockedType}"${reason ? ` (${reason})` : ''}`,
  )
  return creation
}

export function addNodeHandler(ctx: CommandContext, payload: AddNodePayload): CommandResult {
  const { draft: rawSchema, registry } = ctx
  const safeSchema = ctx.schema as DesignerSchema
  const meta = registry.getWidget(payload.node.type)
  const destination = payload.destination ?? { kind: 'root' as const }

  const node = cloneDeep(payload.node)
  const suppliedCreation = validateSubtreeCreation(node, ctx.schema, registry)
  if (!suppliedCreation.ok)
    return reportCreationBlocked(node.type, suppliedCreation)
  if (node.container && !meta)
    return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }
  if (node.container && !meta?.container)
    return { ok: false, code: 'CONTAINER_CAPABILITY_MISMATCH' }
  if (destination.kind === 'container' && meta?.container)
    return { ok: false, code: 'CONTAINER_NESTING_FORBIDDEN' }

  const initializesContainer = Boolean(meta?.container && !node.container)
  if (meta?.container && !node.container) {
    const initialized = createContainerState(
      node,
      safeSchema,
      registry,
      createRegisteredNode(registry),
    )
    if (!initialized.ok)
      return initialized
    node.container = initialized.state
  }

  if (initializesContainer) {
    const initializedCreation = validateSubtreeCreation(node, ctx.schema, registry)
    if (!initializedCreation.ok)
      return reportCreationBlocked(node.type, initializedCreation)
  }
  const candidateNodeIds = collectSubtreeIds(node)

  const idCandidate = cloneSchema(safeSchema)
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
    const candidate = cloneSchema(safeSchema)
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
    const targetResult = resolveDestination(safeSchema, registry, destination)
    if (!targetResult.ok)
      return targetResult
    const target = targetResult.value
    if (!target.container || !target.definition || !target.variant || !target.region)
      return { ok: false, code: 'CONTAINER_DESTINATION_REQUIRED' }

    const index = clampInsertIndex(destination.index, target.children.length)
    const lockedIndices = getLockedIndicesFromNodes(target.children, registry, safeSchema)
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
        schema: safeSchema,
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

    const candidate = cloneSchema(safeSchema)
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

    const draftTarget = resolveDestination(rawSchema, registry, destination)
    if (!draftTarget.ok)
      return draftTarget
    draftTarget.value.children.splice(index, 0, stripPageLayout(node))
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
    const scopeEntries = getSortScopeEntries(createLayoutPlan(safeSchema, registry), resolvedScope)
    const lockedIndices = getLockedIndicesFromEntries(scopeEntries, registry, safeSchema)
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

  const candidate = cloneSchema(safeSchema)
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
