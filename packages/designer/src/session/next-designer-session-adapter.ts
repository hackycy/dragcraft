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
  DesignerSessionMaterials,
} from './types'
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
type ProjectedMaterial = Exclude<ReturnType<DesignerSessionMaterials['get']>, undefined>
type ProjectedDiagnostic = DesignerSessionDocument['diagnostics']['value'][number]
type ProjectedContainerPlan = ReturnType<DesignerSessionMaterials['resolveContainer']>
type ProjectedContainerRegion = Extract<ProjectedContainerPlan, { ok: true }>['plan']['regions'][number]
type ProjectedContainerNodes = ProjectedContainerRegion['nodes']
type ProjectedSchema = NonNullable<DesignerSessionDocument['schema']>['value']
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

function destinationForIndex(
  document: ResolvedDocument,
  destination: { readonly kind: 'root' | 'container', readonly containerId?: string, readonly regionId?: string, readonly index?: number },
): StructuralDestination | undefined {
  const owner = destination.kind === 'root'
    ? { kind: 'page-root' as const }
    : destination.containerId && destination.regionId
      ? { kind: 'container-region' as const, containerId: destination.containerId, regionId: destination.regionId }
      : undefined
  if (!owner)
    return undefined
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

function bundleFromLegacyNode(node: unknown): NodeBundle | undefined {
  if (!node || typeof node !== 'object')
    return undefined
  const nodes: Array<NodeBundle['nodes'][number]> = []
  const containers: Record<string, NodeBundle['containers'][string]> = {}
  const collect = (entry: unknown): string | undefined => {
    if (!entry || typeof entry !== 'object')
      return undefined
    const value = entry as {
      readonly id?: unknown
      readonly type?: unknown
      readonly props?: unknown
      readonly style?: unknown
      readonly container?: { readonly regions?: unknown }
    }
    if (typeof value.id !== 'string' || typeof value.type !== 'string' || !isJsonObject(value.props))
      return undefined
    nodes.push({
      id: value.id,
      type: value.type,
      props: value.props,
      ...(isJsonObject(value.style) ? { style: value.style } : {}),
    })
    const regions = value.container?.regions
    if (isJsonObject(regions)) {
      const regionEntries: Record<string, string[]> = {}
      for (const [regionId, children] of Object.entries(regions)) {
        if (!Array.isArray(children))
          return undefined
        const childIds = children.map(collect)
        if (childIds.includes(undefined))
          return undefined
        regionEntries[regionId] = childIds as string[]
      }
      containers[value.id] = { regions: regionEntries }
    }
    return value.id
  }
  const entryId = collect(node)
  return entryId ? { entryId, nodes, containers } : undefined
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

function projectNode(document: ResolvedDocument, nodeId: string): ProjectedNode | undefined {
  const resolved = document.nodesById.get(nodeId)
  if (!resolved)
    return undefined
  const container = document.containersById.get(nodeId)
  return {
    id: resolved.node.id,
    type: resolved.node.type,
    props: resolved.node.props,
    ...(resolved.node.style ? { style: resolved.node.style } : {}),
    ...(container
      ? {
          container: {
            variant: 'default',
            regions: Object.fromEntries(
              Array.from(container.regions, ([regionId, region]) => [
                regionId,
                region.children.flatMap((child) => {
                  const projected = projectNode(document, child.node.id)
                  return projected ? [projected] : []
                }),
              ]),
            ),
          },
        }
      : {}),
  } as unknown as ProjectedNode
}

function projectRoot(document: ResolvedDocument): ProjectedNode {
  return {
    id: 'root',
    type: 'root',
    props: document.schema.page.props,
    ...(document.schema.page.style ? { style: document.schema.page.style } : {}),
    children: document.root.flatMap((node) => {
      const projected = projectNode(document, node.node.id)
      return projected ? [projected] : []
    }),
  } as unknown as ProjectedNode
}

function projectMaterial(catalog: MaterialCatalog, type: string): ProjectedMaterial | undefined {
  const material = catalog.getMaterial(type)
  if (!material)
    return undefined
  const regions = material.schema?.container?.regions
  return {
    type: material.type,
    title: material.panel?.title ?? material.type,
    ...(material.panel?.titleKey ? { titleKey: material.panel.titleKey } : {}),
    group: material.panel?.group ?? 'default',
    ...(typeof material.panel?.icon === 'string' ? { icon: material.panel.icon } : {}),
    defaultProps: material.schema?.defaultProps ?? {},
    formSchema: material.inspector?.formSchema ?? { sections: [] },
    ...(regions
      ? {
          container: {
            defaultVariant: 'default',
            variants: {
              default: {
                title: material.panel?.title ?? material.type,
                regions: regions.map(region => ({
                  id: region.id,
                  title: region.id,
                  ...(region.accepts || region.cardinality
                    ? {
                        constraints: {
                          ...(region.accepts?.types ? { includeTypes: [...region.accepts.types] } : {}),
                          ...(region.cardinality?.min === undefined ? {} : { minItems: region.cardinality.min }),
                          ...(region.cardinality?.max === undefined ? {} : { maxItems: region.cardinality.max }),
                        },
                      }
                    : {}),
                })),
              },
            },
          },
        }
      : {}),
  } as unknown as ProjectedMaterial
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
  return capability !== 'variantChangeable'
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
      const bundle = bundleFromLegacyNode(action.node)
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
      if (!document.nodesById.has(action.nodeId))
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
      if (!location)
        return { status: 'rejected', code: 'NODE_NOT_FOUND' }
      const to = destinationForIndex(document, location.kind === 'page-root'
        ? { kind: 'root', index: location.index + 1 }
        : {
            kind: 'container',
            containerId: location.containerId,
            regionId: location.regionId,
            index: location.index + 1,
          })
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
    case 'global-config.update':
      return {
        type: 'update-global-config',
        globalConfig: mergeJsonObjects(document.schema.globalConfig, action.config),
      }
    case 'container.change-variant':
      return { status: 'rejected', code: 'CONTAINER_VARIANT_NOT_PERSISTED' }
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
  const root = computed(() => {
    const current = document.value
    return current ? projectRoot(current) : { id: 'root', type: 'root', props: {}, children: [] }
  })
  const rootNodes = computed(() => root.value.children ?? [])

  const session: NextDesignerSessionAdapter = {
    document: {
      schema: computed(() => ({
        version: options.engine.document.value.status === 'rejected'
          ? ''
          : options.engine.document.value.schema.version,
        globalConfig: options.engine.document.value.status === 'rejected'
          ? {}
          : options.engine.document.value.schema.globalConfig,
        root: root.value,
      } as unknown as ProjectedSchema)),
      version: computed(() => options.engine.document.value.status === 'rejected'
        ? ''
        : options.engine.document.value.schema.version),
      root,
      rootNodes,
      globalConfig: computed(() => options.engine.document.value.status === 'rejected'
        ? {}
        : options.engine.document.value.schema.globalConfig),
      diagnostics: computed(() => projectDiagnostics(options.engine)),
      getNode: (nodeId): ProjectedNode | null => {
        const current = document.value
        return current ? projectNode(current, nodeId) ?? null : null
      },
      getOwner: (nodeId) => {
        const location = document.value?.locationsById.get(nodeId)
        if (!location)
          return null
        return location.kind === 'page-root'
          ? { kind: 'root', sortScope: 'content' }
          : { kind: 'container', containerId: location.containerId, regionId: location.regionId }
      },
      getStructurePosition: (nodeId) => {
        const current = document.value
        const location = current?.locationsById.get(nodeId)
        if (!current || !location)
          return null
        const siblings = location.kind === 'page-root'
          ? current.root
          : current.containersById.get(location.containerId)?.regions.get(location.regionId)?.children
        if (!siblings)
          return null
        return {
          owner: location.kind === 'page-root'
            ? { kind: 'root', sortScope: 'content' }
            : { kind: 'container', containerId: location.containerId, regionId: location.regionId },
          index: location.index,
          siblingCount: siblings.length,
          sortScope: location.kind === 'page-root' ? 'content' : false,
          lockedIndices: new Set<number>(),
        }
      },
      getRegionNodes: (containerId, regionId) => {
        const current = document.value
        const region = current?.containersById.get(containerId)?.regions.get(regionId)
        if (!current || !region)
          return []
        return region.children.flatMap((node) => {
          const projected = projectNode(current, node.node.id)
          return projected ? [projected] : []
        })
      },
    },
    materials: {
      get: type => projectMaterial(options.catalog, type),
      getAll: () => options.catalog.getAllMaterials().flatMap((material) => {
        const projected = projectMaterial(options.catalog, material.type)
        return projected ? [projected] : []
      }),
      resolveCapability: (node, capability) => resolveCapability(
        document.value,
        options.catalog,
        node,
        capability,
      ),
      resolveLayout: () => ({
        placement: { kind: 'flow', region: 'content', sortScope: 'content' },
        sortScope: 'content',
        visible: true,
      }),
      resolveContainer: (node): ProjectedContainerPlan => {
        const current = document.value
        const container = current?.containersById.get(node.id)
        const material = options.catalog.getMaterial(node.type)
        const resolved = current?.nodesById.get(node.id)
        if (!current || !container || !material?.schema?.container || resolved?.readOnly)
          return { ok: false, code: 'CONTAINER_UNRESOLVED', containerId: node.id }
        const projectedNode = projectNode(current, node.id)
        if (!projectedNode)
          return { ok: false, code: 'CONTAINER_UNRESOLVED', containerId: node.id }
        const projected = projectMaterial(options.catalog, node.type)
        const variant = projected?.container?.variants.default
        if (!variant)
          return { ok: false, code: 'CONTAINER_UNRESOLVED', containerId: node.id }
        return {
          ok: true,
          plan: {
            containerId: node.id,
            variant,
            regions: Array.from(container.regions, ([regionId, region]) => ({
              definition: variant.regions.find(item => item.id === regionId) ?? {
                id: regionId,
                title: regionId,
              },
              nodes: region.children.flatMap((child) => {
                const childNode = projectNode(current, child.node.id)
                return childNode ? [childNode] : []
              }) as unknown as ProjectedContainerNodes,
              isEmpty: region.children.length === 0,
            })),
          },
        }
      },
      getLockedIndices: nodes => new Set(nodes.flatMap((node, index) => {
        return resolveCapability(document.value, options.catalog, node, 'sortable') ? [] : [index]
      })),
      canCreateSubtree: node => options.catalog.getMaterial(node.type) !== undefined,
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
