import type {
  DesignerSchema,
  LayoutNodeEntry,
  LayoutPlan,
  NodeLayout,
  RegistryInstance,
  ResolvedLayoutSlotManifest,
  ResolvedNodeLayout,
  SchemaNode,
} from './types'

export const DEFAULT_LAYOUT_SLOT = 'content'
export const DEFAULT_SORT_SCOPE = 'content'

export function resolveNodeLayout(
  node: SchemaNode,
  registry: RegistryInstance,
): ResolvedNodeLayout {
  const metaLayout = registry.getWidget(node.type)?.defaultLayout
  const layout: NodeLayout = {
    ...(metaLayout ?? {}),
    ...(node.layout ?? {}),
  }
  const slot = layout.slot ?? DEFAULT_LAYOUT_SLOT
  const sortScope = layout.sortScope === undefined
    ? (slot === DEFAULT_LAYOUT_SLOT ? DEFAULT_SORT_SCOPE : false)
    : layout.sortScope

  return {
    slot,
    sortScope,
    order: layout.order,
    data: layout.data,
  }
}

function sortEntries(entries: LayoutNodeEntry[]): LayoutNodeEntry[] {
  return [...entries].sort((a, b) => {
    const orderA = a.layout.order ?? a.arrayIndex
    const orderB = b.layout.order ?? b.arrayIndex
    if (orderA !== orderB)
      return orderA - orderB
    return a.arrayIndex - b.arrayIndex
  })
}

function createDefaultSlotManifest(slot: string): ResolvedLayoutSlotManifest {
  return {
    slot,
    allocation: 'reserve',
    axis: 'block',
    edge: 'start',
    order: 0,
  }
}

function resolveSlotManifests(
  entries: LayoutNodeEntry[],
  registry: RegistryInstance,
): Map<string, ResolvedLayoutSlotManifest> {
  const manifests = new Map<string, ResolvedLayoutSlotManifest>()

  for (const meta of registry.getAllWidgets()) {
    for (const [slot, manifest] of Object.entries(meta.layoutManifest?.slots ?? {})) {
      manifests.set(slot, {
        ...manifest,
        slot,
        axis: manifest.axis ?? 'block',
        edge: manifest.edge ?? 'start',
        order: manifest.order ?? 0,
      })
    }
  }

  for (const entry of entries) {
    const slot = entry.layout.slot
    if (manifests.has(slot))
      continue

    const metaSlotManifest = registry.getWidget(entry.node.type)?.layoutManifest?.slots?.[slot]
    if (metaSlotManifest) {
      manifests.set(slot, {
        ...metaSlotManifest,
        slot,
        axis: metaSlotManifest.axis ?? 'block',
        edge: metaSlotManifest.edge ?? 'start',
        order: metaSlotManifest.order ?? 0,
      })
    }
    else if (slot === DEFAULT_LAYOUT_SLOT) {
      manifests.set(slot, createDefaultSlotManifest(slot))
    }
  }

  return manifests
}

export function createLayoutPlan(
  schema: DesignerSchema,
  registry: RegistryInstance,
): LayoutPlan {
  const children = schema.root.children ?? []
  const entries = children.map((node, arrayIndex): LayoutNodeEntry => ({
    node,
    arrayIndex,
    layout: resolveNodeLayout(node, registry),
  }))

  const slots = new Map<string, LayoutNodeEntry[]>()
  const sortScopes = new Map<string, LayoutNodeEntry[]>()

  for (const entry of entries) {
    const slotEntries = slots.get(entry.layout.slot) ?? []
    slotEntries.push(entry)
    slots.set(entry.layout.slot, slotEntries)

    if (entry.layout.sortScope !== false) {
      const scopeEntries = sortScopes.get(entry.layout.sortScope) ?? []
      scopeEntries.push(entry)
      sortScopes.set(entry.layout.sortScope, scopeEntries)
    }
  }

  for (const [slot, slotEntries] of slots) {
    slots.set(slot, sortEntries(slotEntries))
  }
  for (const [scope, scopeEntries] of sortScopes) {
    sortScopes.set(scope, sortEntries(scopeEntries))
  }
  const slotManifests = resolveSlotManifests(entries, registry)

  return { entries, slots, sortScopes, slotManifests }
}

export function getLayoutSlotEntries(
  plan: LayoutPlan,
  slot = DEFAULT_LAYOUT_SLOT,
): LayoutNodeEntry[] {
  return plan.slots.get(slot) ?? []
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
