import type {
  DeepReadonly,
  DocumentSchema,
  JsonObject,
  JsonValue,
  NodeBundle,
  ResolvedDocument,
  StructuralDestination,
} from '@dragcraft/core'
import type { Ref } from 'vue'
import type { AuthoringEngine, SchemaAuthoringAction } from '../authoring/types'
import type { MaterialCatalog } from '../materials/create-material-catalog'
import type {
  DesignerMaterialCapability,
  DesignerSession,
  DesignerSessionDocument,
  DesignerSessionDropRejectionReason,
} from './types'
import { resolveSchema } from '@dragcraft/core'
import { computed, ref } from 'vue'
import { evaluateAuthoringPolicy } from '../authoring/policy'

export interface NextDesignerSessionHostState {
  readonly activeDestination: Ref<ActiveDestinationValue>
  readonly containerDropDecision: Ref<ContainerDropDecisionValue>
  readonly dragTarget: Ref<DragTargetValue>
  readonly forbiddenReason: Ref<DesignerSessionDropRejectionReason | null>
  readonly isForbidden: Ref<boolean>
}

type ProjectedNode = Exclude<ReturnType<DesignerSessionDocument['getNode']>, null>
type ProjectedDiagnostic = DesignerSessionDocument['diagnostics']['value'][number]
type DragTargetValue = DesignerSession['state']['dragTarget']['value']
type ActiveDestinationValue = DesignerSession['state']['drag']['activeDestination']['value']
type ContainerDropDecisionValue = DesignerSession['state']['drag']['containerDropDecision']['value']
type SessionAuthoringAction = Parameters<DesignerSession['execute']>[0]
type SessionActionResult = ReturnType<DesignerSession['execute']>

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function mergeJsonObjects(base: DeepReadonly<JsonObject>, patch: Record<string, unknown>): JsonObject {
  const result: JsonObject = {}
  for (const [key, value] of Object.entries(base))
    result[key] = value as JsonValue
  for (const [key, value] of Object.entries(patch)) {
    const current = result[key]
    if (isJsonObject(current) && isJsonObject(value))
      result[key] = mergeJsonObjects(current, value)
    else
      result[key] = value as JsonValue
  }
  return result
}

function nodesForIds(document: ResolvedDocument, nodeIds: readonly string[]): readonly ProjectedNode[] {
  return nodeIds.flatMap((nodeId) => {
    const node = document.nodesById.get(nodeId)?.node
    return node ? [node] : []
  })
}

function destinationForIndex(
  document: ResolvedDocument,
  destination: (
    | { readonly kind: 'root', readonly index?: number }
    | { readonly kind: 'container', readonly containerId: string, readonly regionId: string, readonly index?: number }
  ),
): StructuralDestination | undefined {
  const owner = destination.kind === 'root'
    ? { kind: 'page-root' as const }
    : { kind: 'container-region' as const, containerId: destination.containerId, regionId: destination.regionId }
  const ids = owner.kind === 'page-root'
    ? document.schema.structure.root
    : document.schema.structure.containers[owner.containerId]?.regions[owner.regionId]
  if (!ids)
    return undefined

  const index = destination.index
  if (index === undefined || index >= ids.length)
    return { owner, position: { kind: 'end' } }
  if (index <= 0)
    return { owner, position: { kind: 'start' } }
  return { owner, position: { kind: 'before', nodeId: ids[index] } }
}

function bundleFromPresentationNode(node: unknown): NodeBundle | undefined {
  if (!node || typeof node !== 'object' || Array.isArray(node))
    return undefined
  const value = node as {
    readonly id?: unknown
    readonly type?: unknown
    readonly props?: unknown
    readonly style?: unknown
  }
  if (typeof value.id !== 'string' || typeof value.type !== 'string' || !isJsonObject(value.props))
    return undefined
  return {
    entryId: value.id,
    nodes: [{
      id: value.id,
      type: value.type,
      props: value.props,
      ...(isJsonObject(value.style) ? { style: value.style } : {}),
    }],
    containers: {},
  }
}

function bundleForNodeAdd(node: unknown, catalog: MaterialCatalog): NodeBundle | undefined {
  const presentationBundle = bundleFromPresentationNode(node)
  if (!presentationBundle)
    return undefined
  const entry = presentationBundle.nodes.find(item => item.id === presentationBundle.entryId)
  if (!entry)
    return undefined
  const bundle = catalog.createBundle(entry.type, () => entry.id)
  if (!bundle)
    return undefined
  return {
    ...bundle,
    nodes: bundle.nodes.map(item => item.id === bundle.entryId
      ? {
          id: item.id,
          type: entry.type,
          props: entry.props,
          ...(entry.style ? { style: entry.style } : {}),
        }
      : item),
  }
}

export interface CreateNextDesignerSessionAdapterOptions {
  readonly catalog: MaterialCatalog
  readonly engine: AuthoringEngine
  readonly hostState?: NextDesignerSessionHostState
}

export interface NextDesignerSessionAdapter extends DesignerSession {
  readonly exportSchema: () => DocumentSchema | null
}

export function createNextDesignerSessionHostState(): NextDesignerSessionHostState {
  return {
    activeDestination: ref(null),
    containerDropDecision: ref(null),
    dragTarget: ref(null),
    forbiddenReason: ref(null),
    isForbidden: ref(false),
  }
}

function resolveCapability(
  document: ResolvedDocument | null,
  catalog: MaterialCatalog,
  node: { readonly id: string, readonly type: string },
  capability: DesignerMaterialCapability,
): boolean {
  const resolved = document?.nodesById.get(node.id)
  if (!catalog.getMaterial(node.type))
    return resolved?.readOnly ? capability === 'selectable' : false
  if (resolved?.readOnly)
    return capability === 'selectable'
  return true
}

function projectDiagnostics(engine: AuthoringEngine): readonly ProjectedDiagnostic[] {
  return engine.document.value.diagnostics.items.map(diagnostic => ({
    code: diagnostic.code,
    severity: diagnostic.severity,
    ...(diagnostic.nodeId ? { nodeId: diagnostic.nodeId } : {}),
    ...(diagnostic.containerId ? { ownerId: diagnostic.containerId } : {}),
    ...(diagnostic.regionId ? { regionId: diagnostic.regionId } : {}),
    ...(diagnostic.path ? { path: diagnostic.path } : {}),
    ...(diagnostic.details ? { details: diagnostic.details } : {}),
  })) as ProjectedDiagnostic[]
}

interface NextActionFailure { readonly status: 'rejected', readonly code: string }
type CompiledSchemaAction = SchemaAuthoringAction | NextActionFailure

function compileSchemaAction(
  action: SessionAuthoringAction,
  document: ResolvedDocument,
  catalog: MaterialCatalog,
): CompiledSchemaAction {
  switch (action.type) {
    case 'node.add': {
      const bundle = bundleForNodeAdd(action.node, catalog)
      const to = destinationForIndex(document, action.destination ?? { kind: 'root' })
      if (!bundle)
        return { status: 'rejected', code: 'NODE_INVALID' }
      if (!catalog.getMaterial(bundle.nodes[0]?.type ?? ''))
        return { status: 'rejected', code: 'MATERIAL_NOT_FOUND' }
      if (!to)
        return { status: 'rejected', code: 'DESTINATION_INVALID' }
      return { type: 'insert-bundle', bundle, to }
    }
    case 'node.move': {
      const node = document.nodesById.get(action.nodeId)?.node
      if (!node)
        return { status: 'rejected', code: 'NODE_NOT_FOUND' }
      const to = destinationForIndex(document, action.destination)
      if (!to)
        return { status: 'rejected', code: 'DESTINATION_INVALID' }
      return { type: 'move-node', nodeId: action.nodeId, to }
    }
    case 'node.remove':
      if (!document.nodesById.has(action.nodeId))
        return { status: 'rejected', code: 'NODE_NOT_FOUND' }
      return { type: 'remove-node', nodeId: action.nodeId }
    case 'node.duplicate': {
      const location = document.locationsById.get(action.nodeId)
      const node = document.nodesById.get(action.nodeId)?.node
      if (!location || !node)
        return { status: 'rejected', code: 'NODE_NOT_FOUND' }
      const destination: (
        | { readonly kind: 'root', readonly index: number }
        | { readonly kind: 'container', readonly containerId: string, readonly regionId: string, readonly index: number }
      ) = location.kind === 'page-root'
        ? { kind: 'root', index: location.index + 1 }
        : {
            kind: 'container',
            containerId: location.containerId,
            regionId: location.regionId,
            index: location.index + 1,
          }
      const to = destinationForIndex(document, destination)
      if (!to)
        return { status: 'rejected', code: 'DESTINATION_INVALID' }
      return { type: 'duplicate-node', nodeId: action.nodeId, to }
    }
    case 'node.update': {
      const current = document.nodesById.get(action.nodeId)?.node
      if (!current)
        return { status: 'rejected', code: 'NODE_NOT_FOUND' }
      return {
        type: 'update-node',
        nodeId: action.nodeId,
        node: {
          type: current.type,
          props: mergeJsonObjects(current.props, action.props),
          ...(action.style
            ? { style: mergeJsonObjects(current.style ?? {}, action.style as Record<string, unknown>) }
            : current.style ? { style: current.style as unknown as JsonObject } : {}),
        },
      }
    }
    case 'page.update':
      return {
        type: 'update-page',
        page: {
          props: mergeJsonObjects(document.schema.page.props, action.props),
          ...(action.style
            ? { style: mergeJsonObjects(document.schema.page.style ?? {}, action.style as Record<string, unknown>) }
            : document.schema.page.style
              ? { style: document.schema.page.style as unknown as JsonObject }
              : {}),
        },
      }
    case 'global-config.update':
      return {
        type: 'update-global-config',
        globalConfig: mergeJsonObjects(document.schema.globalConfig, action.config),
      }
    case 'schema.import':
      return { status: 'rejected', code: 'SCHEMA_IMPORT_REQUIRES_DOCUMENT_SCHEMA' }
    default:
      return { status: 'rejected', code: 'ACTION_UNSUPPORTED' }
  }
}

function resultFromNextAction(result: ReturnType<AuthoringEngine['execute']>): SessionActionResult {
  if (result.status === 'committed')
    return { ok: true, changed: true }
  if (result.status === 'unchanged')
    return { ok: true, changed: false }
  return { ok: false, code: result.code }
}

function actionDecision(
  action: SessionAuthoringAction,
  engine: AuthoringEngine,
  catalog: MaterialCatalog,
): { allowed: boolean, code?: string } {
  if (action.type === 'history.undo')
    return { allowed: engine.history.canUndo.value }
  if (action.type === 'history.redo')
    return { allowed: engine.history.canRedo.value }
  if (action.type === 'selection.set' || action.type === 'hover.set') {
    const current = engine.resolvedDocument.value
    return action.nodeId === null || current?.nodesById.has(action.nodeId)
      ? { allowed: true }
      : { allowed: false, code: 'NODE_NOT_FOUND' }
  }
  if (action.type === 'drag.set')
    return { allowed: true }
  if (action.type === 'schema.import') {
    const resolution = resolveSchema(action.schema, catalog.schemaDefinitions)
    return resolution.status === 'rejected'
      ? { allowed: false, code: 'SCHEMA_IMPORT_REJECTED' }
      : { allowed: true }
  }
  const current = engine.resolvedDocument.value
  if (!current)
    return { allowed: false, code: 'NO_DOCUMENT' }
  const compiled = compileSchemaAction(action, current, catalog)
  if ('status' in compiled)
    return { allowed: false, code: compiled.code }
  const policy = evaluateAuthoringPolicy(catalog, current, compiled as SchemaAuthoringAction)
  if (policy.decision === 'denied' || policy.decision === 'confirmation-required')
    return { allowed: false, code: policy.code }
  return { allowed: true }
}

/**
 * Projects the independent Next Authoring Engine through the existing internal
 * DesignerSession seam. It has no runtime dependency on legacy backend code.
 */
export function createNextDesignerSessionAdapter(
  options: CreateNextDesignerSessionAdapterOptions,
): NextDesignerSessionAdapter {
  const hostState = options.hostState ?? createNextDesignerSessionHostState()
  const document = computed(() => options.engine.resolvedDocument.value)
  const schema = computed<DeepReadonly<DocumentSchema> | null>(() => {
    const state = options.engine.document.value
    return state.status === 'rejected' ? null : state.schema
  })
  const rootNodes = computed(() => {
    const current = document.value
    return current
      ? current.schema.structure.root.flatMap((nodeId) => {
          const node = current.nodesById.get(nodeId)?.node
          return node ? [node] : []
        })
      : []
  })
  const session: NextDesignerSessionAdapter = {
    document: {
      schema,
      version: computed(() => options.engine.document.value.status === 'rejected'
        ? ''
        : options.engine.document.value.schema.version),
      rootNodes,
      globalConfig: computed(() => options.engine.document.value.status === 'rejected'
        ? {}
        : options.engine.document.value.schema.globalConfig),
      diagnostics: computed(() => projectDiagnostics(options.engine)),
      getNode: (nodeId): ProjectedNode | null => {
        const current = document.value
        return current?.nodesById.get(nodeId)?.node ?? null
      },
      isNodeReadOnly: nodeId => document.value?.nodesById.get(nodeId)?.readOnly ?? false,
      getOwner: (nodeId) => {
        const current = document.value
        const location = current?.locationsById.get(nodeId)
        if (!current || !location)
          return null
        if (location.kind !== 'page-root')
          return { kind: 'container', containerId: location.containerId, regionId: location.regionId }
        return { kind: 'root' }
      },
      getStructurePosition: (nodeId) => {
        const current = document.value
        const location = current?.locationsById.get(nodeId)
        if (!current || !location)
          return null
        const siblingIds = location.kind === 'page-root'
          ? current.schema.structure.root
          : current.schema.structure.containers[location.containerId]?.regions[location.regionId]
        if (!siblingIds)
          return null
        const siblings = nodesForIds(current, siblingIds)
        if (location.kind === 'page-root') {
          return {
            owner: { kind: 'root' as const },
            index: location.index,
            siblingCount: siblings.length,
          }
        }
        return {
          owner: { kind: 'container', containerId: location.containerId, regionId: location.regionId },
          index: location.index,
          siblingCount: siblings.length,
        }
      },
      getRegionIds: (containerId) => {
        const state = options.engine.document.value
        if (state.status === 'rejected')
          return []
        return Object.keys(state.schema.structure.containers[containerId]?.regions ?? {})
      },
      getRegionNodes: (containerId, regionId) => {
        const current = document.value
        if (current) {
          const childIds = current.schema.structure.containers[containerId]?.regions[regionId]
          return childIds ? nodesForIds(current, childIds) : []
        }
        const state = options.engine.document.value
        if (state.status === 'rejected')
          return []
        const childIds = state.schema.structure.containers[containerId]?.regions[regionId]
        if (!childIds)
          return []
        return childIds.flatMap((nodeId) => {
          const node = state.schema.nodes.find(item => item.id === nodeId)
          return node ? [node] : []
        })
      },
    },
    materials: {
      get: type => options.catalog.getMaterial(type),
      getAll: () => options.catalog.getAllMaterials(),
      resolveCapability: (node, capability) => resolveCapability(
        document.value,
        options.catalog,
        node,
        capability,
      ),
      getLockedIndices: nodes => new Set(nodes.flatMap((node, index) => {
        return resolveCapability(document.value, options.catalog, node, 'sortable') ? [] : [index]
      })),
      canCreateSubtree: node => actionDecision(
        { type: 'node.duplicate', nodeId: node.id },
        options.engine,
        options.catalog,
      ).allowed,
      canDeleteSubtree: node => resolveCapability(document.value, options.catalog, node, 'deletable'),
    },
    state: {
      selectedNodeId: options.engine.selection.selectedNodeId,
      hoveredNodeId: options.engine.selection.hoveredNodeId,
      dragTarget: hostState.dragTarget,
      drag: {
        activeDestination: hostState.activeDestination,
        containerDropDecision: hostState.containerDropDecision,
        isForbidden: hostState.isForbidden,
        forbiddenReason: hostState.forbiddenReason,
      },
      history: computed(() => ({
        canUndo: options.engine.history.canUndo.value,
        canRedo: options.engine.history.canRedo.value,
        undoCount: options.engine.history.undoCount.value,
        redoCount: options.engine.history.redoCount.value,
      })),
    },
    evaluate: action => actionDecision(action, options.engine, options.catalog),
    execute: (action): SessionActionResult => {
      const decision = actionDecision(action, options.engine, options.catalog)
      if (!decision.allowed)
        return { ok: false, code: decision.code ?? 'ACTION_NOT_ALLOWED' }
      if (action.type === 'selection.set')
        return resultFromNextAction(options.engine.execute({ type: 'select-node', nodeId: action.nodeId }))
      if (action.type === 'hover.set')
        return resultFromNextAction(options.engine.execute({ type: 'hover-node', nodeId: action.nodeId }))
      if (action.type === 'drag.set') {
        const changed = hostState.dragTarget.value?.sourceNodeId !== action.target?.sourceNodeId
          || hostState.dragTarget.value?.widgetType !== action.target?.widgetType
        hostState.dragTarget.value = action.target
        return { ok: true, changed }
      }
      if (action.type === 'history.undo')
        return resultFromNextAction(options.engine.execute({ type: 'undo' }))
      if (action.type === 'history.redo')
        return resultFromNextAction(options.engine.execute({ type: 'redo' }))
      if (action.type === 'schema.import') {
        const result = options.engine.importSchema(action.schema)
        return result.status === 'rejected'
          ? { ok: false, code: 'SCHEMA_IMPORT_REJECTED' }
          : { ok: true, changed: true }
      }
      const current = options.engine.resolvedDocument.value
      if (!current)
        return { ok: false, code: 'NO_DOCUMENT' }
      const compiled = compileSchemaAction(action, current, options.catalog)
      if ('status' in compiled)
        return { ok: false, code: compiled.code }
      return resultFromNextAction(options.engine.execute(compiled))
    },
    exportSchema: options.engine.exportSchema,
  }
  return session
}
