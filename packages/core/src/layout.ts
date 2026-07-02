import type {
  DesignerSchema,
  LayoutNodeEntry,
  LayoutPlan,
  LayoutSlotManifest,
  NodeLayout,
  RegistryInstance,
  ResolvedLayoutSlotManifest,
  ResolvedNodeLayout,
  SchemaNode,
} from './types'

export const DEFAULT_LAYOUT_SLOT = 'content'
export const DEFAULT_SORT_SCOPE = 'content'
const DEFAULT_LAYOUT_AXIS = 'block'
const DEFAULT_LAYOUT_EDGE = 'start'
const DEFAULT_SLOT_ORDER = 0

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

function resolveSlotManifest(
  slot: string,
  manifest: LayoutSlotManifest | undefined,
): ResolvedLayoutSlotManifest | null {
  if (!manifest) {
    return slot === DEFAULT_LAYOUT_SLOT
      ? {
          slot,
          allocation: 'reserve',
          axis: DEFAULT_LAYOUT_AXIS,
          edge: DEFAULT_LAYOUT_EDGE,
          order: DEFAULT_SLOT_ORDER,
        }
      : null
  }

  return {
    ...manifest,
    slot,
    axis: manifest.axis ?? DEFAULT_LAYOUT_AXIS,
    edge: manifest.edge ?? DEFAULT_LAYOUT_EDGE,
    order: manifest.order ?? DEFAULT_SLOT_ORDER,
  }
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

  const slotManifests = new Map<string, ResolvedLayoutSlotManifest>()

  for (const meta of registry.getAllWidgets()) {
    for (const [slot, manifest] of Object.entries(meta.layoutManifest?.slots ?? {})) {
      const resolved = resolveSlotManifest(slot, manifest)
      if (resolved)
        slotManifests.set(slot, resolved)
    }
  }

  for (const entry of entries) {
    pushEntry(slots, entry.layout.slot, entry)

    const sortScope = entry.layout.sortScope
    if (sortScope !== false)
      pushEntry(sortScopes, sortScope, entry)

    if (!slotManifests.has(entry.layout.slot)) {
      const manifest = registry.getWidget(entry.node.type)?.layoutManifest?.slots?.[entry.layout.slot]
      const resolved = resolveSlotManifest(entry.layout.slot, manifest)
      if (resolved)
        slotManifests.set(entry.layout.slot, resolved)
    }
  }

  for (const slotEntries of slots.values())
    sortEntries(slotEntries)
  for (const scopeEntries of sortScopes.values())
    sortEntries(scopeEntries)

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
