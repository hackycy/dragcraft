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
import type { MaterialPresentationLayout } from '../materials/types'
import type { ResolvedNodeLayout } from '../presentation/semantic'
import type {
  DesignerMaterialCapability,
  DesignerSession,
  DesignerSessionDocument,
  DesignerSessionDropRejectionReason,
  DesignerSessionMaterials,
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
type ProjectedMaterial = Exclude<ReturnType<DesignerSessionMaterials['get']>, undefined>
type ProjectedDiagnostic = DesignerSessionDocument['diagnostics']['value'][number]
type ProjectedContainerPlan = ReturnType<DesignerSessionMaterials['resolveContainer']>
type ProjectedContainerRegion = Extract<ProjectedContainerPlan, { ok: true }>['plan']['regions'][number]
type ProjectedContainerNodes = ProjectedContainerRegion['nodes']
type ProjectedDestination = ReturnType<NonNullable<DesignerSessionDocument['resolveDestination']>>
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
  catalog: MaterialCatalog,
  destination: (
    | { readonly kind: 'root', readonly sortScope?: string, readonly index?: number }
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

  if (destination.kind === 'root' && destination.sortScope) {
    const scopedIds = ids.filter((nodeId) => {
      const node = document.nodesById.get(nodeId)?.node
      return node !== undefined
        && resolveMaterialLayout(catalog.getMaterial(node.type)?.presentation.layout).sortScope === destination.sortScope
    })
    const index = destination.index ?? scopedIds.length
    if (scopedIds.length === 0)
      return { owner, position: { kind: 'end' } }
    if (index <= 0)
      return { owner, position: { kind: 'before', nodeId: scopedIds[0]! } }
    if (index >= scopedIds.length)
      return { owner, position: { kind: 'after', nodeId: scopedIds.at(-1)! } }
    return { owner, position: { kind: 'before', nodeId: scopedIds[index]! } }
  }

  const index = destination.index
  if (index === undefined || index >= ids.length)
    return { owner, position: { kind: 'end' } }
  if (index <= 0)
    return { owner, position: { kind: 'start' } }
  return { owner, position: { kind: 'before', nodeId: ids[index] } }
}

function bundleFromPresentationNode(node: unknown): NodeBundle | undefined {
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

function requiresRootDestination(
  catalog: MaterialCatalog,
  type: string,
  destination: { readonly kind: 'root' | 'container' },
): boolean {
  return destination.kind === 'container'
    && resolveMaterialLayout(catalog.getMaterial(type)?.presentation.layout).placement.kind !== 'flow'
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

function projectMaterial(
  catalog: MaterialCatalog,
  type: string,
  document: ResolvedDocument | null = null,
): ProjectedMaterial | undefined {
  const material = catalog.getMaterial(type)
  if (!material)
    return undefined
  const regions = material.schema?.container?.regions
  const hasCreatePolicy = document !== null && catalog.getAuthoring(type)?.policy?.create !== undefined
  return {
    type: material.type,
    headless: material.presentation.kind === 'headless',
    title: material.panel?.title ?? material.type,
    ...(material.panel?.titleKey ? { titleKey: material.panel.titleKey } : {}),
    group: material.panel?.group ?? 'default',
    ...(typeof material.panel?.icon === 'string' ? { icon: material.panel.icon } : {}),
    defaultProps: material.schema?.defaultProps ?? {},
    formSchema: material.inspector?.formSchema ?? { sections: [] },
    ...(hasCreatePolicy
      ? {
          creatable: () => {
            const policy = evaluateAuthoringPolicy(catalog, document, {
              type: 'create-node',
              materialType: material.type,
              to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
            })
            return policy.decision === 'allowed'
              ? true
              : { allowed: false, code: policy.code }
          },
        }
      : {}),
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

function resolveMaterialLayout(layout: MaterialPresentationLayout | undefined): ResolvedNodeLayout {
  const placement = layout?.placement
  if (!placement || placement.kind === 'flow') {
    const region = placement?.region ?? 'content'
    const sortScope = placement?.sortScope === undefined
      ? region === 'content' ? 'content' : false
      : placement.sortScope
    return {
      placement: { kind: 'flow' as const, region, sortScope },
      region,
      sortScope,
      ...(layout?.order === undefined ? {} : { order: layout.order }),
      visible: layout?.visible ?? true,
    }
  }
  if (placement.kind === 'chrome') {
    return {
      placement: {
        kind: 'chrome' as const,
        edge: placement.edge,
        position: placement.position ?? 'fixed',
        reserve: {
          mode: placement.reserve?.mode ?? 'measure',
          ...(placement.reserve?.size === undefined ? {} : { size: placement.reserve.size }),
        },
        avoidContent: placement.avoidContent ?? true,
      },
      sortScope: false as const,
      ...(layout?.order === undefined ? {} : { order: layout.order }),
      visible: layout?.visible ?? true,
    }
  }
  return {
    placement: {
      kind: 'layer' as const,
      layer: placement.layer ?? 'float',
      mode: placement.mode ?? (placement.anchor ? 'framework' : 'self'),
      anchor: placement.anchor ?? { block: 'end', inline: 'end' },
      ...(placement.offset ? { offset: placement.offset } : {}),
      avoid: placement.avoid
        ? [...placement.avoid] as Array<'safe-area' | 'chrome' | 'viewport'>
        : ['safe-area', 'chrome'] as Array<'safe-area' | 'chrome' | 'viewport'>,
    },
    sortScope: false as const,
    ...(layout?.order === undefined ? {} : { order: layout.order }),
    visible: layout?.visible ?? true,
  }
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
      const to = destinationForIndex(document, catalog, action.destination ?? { kind: 'root' })
      if (!bundle)
        return { status: 'rejected', code: 'NODE_INVALID' }
      if (!catalog.getMaterial(bundle.nodes[0]?.type ?? ''))
        return { status: 'rejected', code: 'MATERIAL_NOT_FOUND' }
      if (!to)
        return { status: 'rejected', code: 'DESTINATION_INVALID' }
      if (requiresRootDestination(catalog, bundle.nodes[0]!.type, action.destination ?? { kind: 'root' }))
        return { status: 'rejected', code: 'CONTAINER_NON_FLOW_MATERIAL' }
      return { type: 'insert-bundle', bundle, to }
    }
    case 'node.move': {
      const node = document.nodesById.get(action.nodeId)?.node
      if (!node)
        return { status: 'rejected', code: 'NODE_NOT_FOUND' }
      const to = destinationForIndex(document, catalog, action.destination)
      if (!to)
        return { status: 'rejected', code: 'DESTINATION_INVALID' }
      if (requiresRootDestination(catalog, node.type, action.destination))
        return { status: 'rejected', code: 'CONTAINER_NON_FLOW_MATERIAL' }
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
      const to = destinationForIndex(document, catalog, destination)
      if (!to)
        return { status: 'rejected', code: 'DESTINATION_INVALID' }
      if (requiresRootDestination(catalog, node.type, destination))
        return { status: 'rejected', code: 'CONTAINER_NON_FLOW_MATERIAL' }
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
  const root = computed(() => {
    const current = document.value
    return current ? projectRoot(current) : { id: 'root', type: 'root', props: {}, children: [] }
  })
  const rootNodes = computed(() => root.value.children ?? [])
  const resolveNodeLayout = (current: ResolvedDocument, nodeId: string): ResolvedNodeLayout => {
    const node = current.nodesById.get(nodeId)?.node
    return resolveMaterialLayout(options.catalog.getMaterial(node?.type ?? '')?.presentation.layout)
  }

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
        const current = document.value
        const location = current?.locationsById.get(nodeId)
        if (!current || !location)
          return null
        if (location.kind !== 'page-root')
          return { kind: 'container', containerId: location.containerId, regionId: location.regionId }
        const sortScope = resolveNodeLayout(current, nodeId).sortScope
        return {
          kind: 'root',
          ...(sortScope === false ? {} : { sortScope }),
        }
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
        if (location.kind === 'page-root') {
          const sortScope = resolveNodeLayout(current, nodeId).sortScope
          if (sortScope === false) {
            return {
              owner: { kind: 'root' as const },
              index: location.index,
              siblingCount: siblings.length,
              sortScope,
              lockedIndices: new Set<number>(),
            }
          }
          const scopedSiblings = siblings.filter(sibling => resolveNodeLayout(current, sibling.node.id).sortScope === sortScope)
          return {
            owner: { kind: 'root' as const, sortScope },
            index: scopedSiblings.findIndex(sibling => sibling.node.id === nodeId),
            siblingCount: scopedSiblings.length,
            sortScope,
            lockedIndices: new Set<number>(),
          }
        }
        return {
          owner: { kind: 'container', containerId: location.containerId, regionId: location.regionId },
          index: location.index,
          siblingCount: siblings.length,
          sortScope: false,
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
      resolveDestination: (destination) => {
        const current = document.value
        if (!current)
          return { ok: false, code: 'NO_DOCUMENT' }
        if (destination.kind === 'root') {
          return {
            ok: true,
            value: {
              children: root.value.children as unknown as ProjectedContainerNodes,
              destination,
            },
          } as ProjectedDestination
        }

        const container = current.containersById.get(destination.containerId)
        const owner = container?.owner
        const material = owner ? options.catalog.getMaterial(owner.node.type) : undefined
        const projected = owner ? projectMaterial(options.catalog, owner.node.type) : undefined
        const definition = projected?.container
        const variant = definition?.variants.default
        const region = variant?.regions.find(item => item.id === destination.regionId)
        const resolvedRegion = container?.regions.get(destination.regionId)
        if (!owner || !definition || !variant || !region || !resolvedRegion || !material?.schema?.container)
          return { ok: false, code: 'CONTAINER_UNRESOLVED' }

        return {
          ok: true,
          value: {
            children: resolvedRegion.children.flatMap((child) => {
              const projectedChild = projectNode(current, child.node.id)
              return projectedChild ? [projectedChild] : []
            }) as unknown as ProjectedContainerNodes,
            destination,
            container: projectNode(current, owner.node.id) as unknown as ProjectedNode,
            definition,
            variant,
            region,
          },
        } as ProjectedDestination
      },
    },
    materials: {
      get: type => projectMaterial(options.catalog, type, document.value),
      getAll: () => options.catalog.getAllMaterials().flatMap((material) => {
        const projected = projectMaterial(options.catalog, material.type, document.value)
        return projected ? [projected] : []
      }),
      resolveCapability: (node, capability) => resolveCapability(
        document.value,
        options.catalog,
        node,
        capability,
      ),
      resolveLayout: node => resolveMaterialLayout(options.catalog.getMaterial(node.type)?.presentation.layout),
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
        const projected = projectMaterial(options.catalog, node.type, current)
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
