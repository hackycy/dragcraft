import type {
  DesignerSchema,
  LayoutEdge,
  LayoutNodeEntry,
  LayoutPlan,
  NodeDestination,
  NodeLayout,
  NodePlacement,
  OwnerResolutionResult,
  RegistryInstance,
  ResolvedChromePlacement,
  ResolvedFlowPlacement,
  ResolvedLayerPlacement,
  ResolvedNodeDestination,
  ResolvedNodeLayout,
  ResolvedNodePlacement,
  ResolvedNodeSource,
  SchemaIndexResult,
  SchemaNode,
} from './types'
import { cloneDeep } from '@dragcraft/utils'
import { buildSchemaIndex } from './schema-index'

export const DEFAULT_LAYOUT_REGION = 'content'
export const DEFAULT_SORT_SCOPE = 'content'
export const DEFAULT_LAYER = 'float'

function resolveFlowPlacement(placement: Extract<NodePlacement, { kind: 'flow' }> | undefined): ResolvedFlowPlacement {
  const region = placement?.region ?? DEFAULT_LAYOUT_REGION
  return {
    kind: 'flow',
    region,
    sortScope: placement?.sortScope === undefined
      ? (region === DEFAULT_LAYOUT_REGION ? DEFAULT_SORT_SCOPE : false)
      : placement.sortScope,
  }
}

function resolveChromePlacement(placement: Extract<NodePlacement, { kind: 'chrome' }>): ResolvedChromePlacement {
  return {
    kind: 'chrome',
    edge: placement.edge,
    position: placement.position ?? 'fixed',
    reserve: {
      mode: placement.reserve?.mode ?? 'measure',
      size: placement.reserve?.size,
    },
    avoidContent: placement.avoidContent ?? true,
  }
}

function resolveLayerPlacement(placement: Extract<NodePlacement, { kind: 'layer' }>): ResolvedLayerPlacement {
  const hasAnchor = placement.anchor !== undefined
  return {
    kind: 'layer',
    layer: placement.layer ?? DEFAULT_LAYER,
    mode: placement.mode ?? (hasAnchor ? 'framework' : 'self'),
    anchor: placement.anchor ?? { block: 'end', inline: 'end' },
    offset: placement.offset,
    avoid: placement.avoid ?? ['safe-area', 'chrome'],
  }
}

function resolvePlacement(placement: NodePlacement | undefined): ResolvedNodePlacement {
  if (!placement || placement.kind === 'flow')
    return resolveFlowPlacement(placement)
  if (placement.kind === 'chrome')
    return resolveChromePlacement(placement)
  return resolveLayerPlacement(placement)
}

export function resolveNodeLayout(
  node: SchemaNode,
  registry: RegistryInstance,
  schema?: DesignerSchema,
): ResolvedNodeLayout {
  const metaLayout = registry.getWidget(node.type)?.defaultLayout
  const layout: NodeLayout = {
    ...(metaLayout ?? {}),
    ...(node.layout ?? {}),
  }
  const placement = resolvePlacement(layout.placement)

  const rawVisible = layout.visible ?? true
  const visible = typeof rawVisible === 'function'
    ? schema !== undefined && rawVisible({ node, schema })
    : rawVisible

  return {
    placement,
    region: placement.kind === 'flow' ? placement.region : undefined,
    sortScope: placement.kind === 'flow' ? placement.sortScope : false,
    order: layout.order,
    visible,
  }
}

function sortEntries(entries: LayoutNodeEntry[]): void {
  entries.sort((a, b) => {
    const orderA = a.layout.order ?? a.arrayIndex
    const orderB = b.layout.order ?? b.arrayIndex
    if (orderA !== orderB)
      return orderA - orderB
    return a.arrayIndex - b.arrayIndex
  })
}

function pushEntry(map: Map<string, LayoutNodeEntry[]>, key: string, entry: LayoutNodeEntry): void {
  const entries = map.get(key)
  if (entries)
    entries.push(entry)
  else
    map.set(key, [entry])
}

function edgeOrder(edge: LayoutEdge): number {
  switch (edge) {
    case 'block-start':
      return 0
    case 'inline-start':
      return 1
    case 'inline-end':
      return 2
    case 'block-end':
      return 3
  }
}

export function createLayoutPlan(
  schema: DesignerSchema,
  registry: RegistryInstance,
): LayoutPlan {
  const children = schema.root.children ?? []
  const entries: LayoutNodeEntry[] = []
  const regions = new Map<string, LayoutNodeEntry[]>()
  const chrome: LayoutNodeEntry[] = []
  const layers = new Map<string, LayoutNodeEntry[]>()
  const sortScopes = new Map<string, LayoutNodeEntry[]>()

  for (let arrayIndex = 0; arrayIndex < children.length; arrayIndex++) {
    const node = children[arrayIndex]
    const layout = resolveNodeLayout(node, registry, schema)
    const entry = { node, arrayIndex, layout }
    entries.push(entry)

    const placement = layout.placement
    if (placement.kind === 'flow') {
      pushEntry(regions, placement.region, entry)
      if (placement.sortScope !== false)
        pushEntry(sortScopes, placement.sortScope, entry)
    }
    else if (placement.kind === 'chrome') {
      chrome.push(entry)
    }
    else {
      pushEntry(layers, placement.layer, entry)
    }
  }

  sortEntries(entries)
  for (const regionEntries of regions.values())
    sortEntries(regionEntries)
  for (const scopeEntries of sortScopes.values())
    sortEntries(scopeEntries)
  for (const layerEntries of layers.values())
    sortEntries(layerEntries)
  chrome.sort((a, b) => {
    const placementA = a.layout.placement as ResolvedChromePlacement
    const placementB = b.layout.placement as ResolvedChromePlacement
    const edgeDelta = edgeOrder(placementA.edge) - edgeOrder(placementB.edge)
    if (edgeDelta !== 0)
      return edgeDelta
    const orderA = a.layout.order ?? a.arrayIndex
    const orderB = b.layout.order ?? b.arrayIndex
    if (orderA !== orderB)
      return orderA - orderB
    return a.arrayIndex - b.arrayIndex
  })

  return {
    entries,
    regions,
    chrome,
    layers,
    sortScopes,
    insets: {
      contributors: chrome
        .map((entry) => {
          const placement = entry.layout.placement as ResolvedChromePlacement
          return placement.avoidContent
            ? { edge: placement.edge, sourceNodeId: entry.node.id, reserve: placement.reserve }
            : null
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    },
  }
}

export function getLayoutRegionEntries(
  plan: LayoutPlan,
  region = DEFAULT_LAYOUT_REGION,
): LayoutNodeEntry[] {
  return plan.regions.get(region) ?? []
}

export function getSortScopeEntries(
  plan: LayoutPlan,
  sortScope = DEFAULT_SORT_SCOPE,
): LayoutNodeEntry[] {
  return plan.sortScopes.get(sortScope) ?? []
}

export function getSortScopeNodes(
  plan: LayoutPlan,
  sortScope = DEFAULT_SORT_SCOPE,
): SchemaNode[] {
  return getSortScopeEntries(plan, sortScope).map(entry => entry.node)
}

export function getSortableArrayIndexForInsert(
  scopeEntries: LayoutNodeEntry[],
  allChildren: SchemaNode[],
  visualIndex: number,
): number {
  if (scopeEntries.length === 0)
    return allChildren.length
  if (visualIndex <= 0)
    return scopeEntries[0].arrayIndex
  if (visualIndex >= scopeEntries.length)
    return scopeEntries[scopeEntries.length - 1].arrayIndex + 1
  return scopeEntries[visualIndex].arrayIndex
}

export function resolveNodeSource(
  schema: DesignerSchema,
  indexed: SchemaIndexResult,
  nodeId: string,
): OwnerResolutionResult<ResolvedNodeSource> {
  const location = indexed.index.get(nodeId)
  if (!location)
    return { ok: false, code: 'NODE_NOT_FOUND' }

  if (location.owner === 'root') {
    return {
      ok: true,
      value: {
        location,
        children: schema.root.children ?? [],
        index: location.index,
        destination: { kind: 'root', index: location.index },
      },
    }
  }

  const owner = indexed.index.get(location.owner)?.node
  const regionId = location.regionId
  const children = regionId ? owner?.container?.regions[regionId] : undefined
  if (!owner || !regionId || !children)
    return { ok: false, code: 'CONTAINER_OWNER_INVALID' }

  return {
    ok: true,
    value: {
      location,
      children,
      index: location.index,
      destination: {
        kind: 'container',
        containerId: owner.id,
        regionId,
        index: location.index,
      },
    },
  }
}

export function resolveDestination(
  schema: DesignerSchema,
  registry: RegistryInstance,
  destination: NodeDestination,
): OwnerResolutionResult<ResolvedNodeDestination> {
  if (destination.kind === 'root') {
    schema.root.children ??= []
    return { ok: true, value: { children: schema.root.children, destination } }
  }

  const location = buildSchemaIndex(schema).index.get(destination.containerId)
  const container = location?.owner === 'root' ? location.node : undefined
  const definition = container && registry.getWidget(container.type)?.container
  const variant = container?.container && definition?.variants[container.container.variant]
  const region = variant?.regions.find(item => item.id === destination.regionId)
  const children = container?.container?.regions[destination.regionId]
  if (!container || !definition || !variant)
    return { ok: false, code: 'CONTAINER_UNRESOLVED' }
  if (!region || !children)
    return { ok: false, code: 'CONTAINER_REGION_UNKNOWN' }
  return { ok: true, value: { children, destination, container, definition, variant, region } }
}

export function clampInsertIndex(index: number | undefined, length: number): number {
  return Math.max(0, Math.min(index ?? length, length))
}

export function stripPageLayout(node: SchemaNode): SchemaNode {
  const clone = cloneDeep(node)
  if (clone.layout) {
    delete clone.layout.placement
    delete clone.layout.order
  }
  return clone
}
