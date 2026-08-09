import type { DocumentSchema, NodeDefinition } from '@dragcraft/designer'
import type { RuntimeLayout, RuntimeLayoutEdge, RuntimeRegistry } from './registry'

export type { RuntimeLayoutEdge } from './registry'

export type RuntimePlacement
  = | { kind: 'flow', region: string }
    | {
      kind: 'chrome'
      edge: RuntimeLayoutEdge
      position: 'fixed' | 'sticky' | 'flow'
      reserve: { mode: 'measure' | 'size' | 'none', size?: string | number }
      avoidContent: boolean
    }
    | {
      kind: 'layer'
      layer: string
      mode: 'framework' | 'self'
      anchor: { block: 'start' | 'center' | 'end', inline: 'start' | 'center' | 'end' }
      offset?: {
        blockStart?: string | number
        blockEnd?: string | number
        inlineStart?: string | number
        inlineEnd?: string | number
      }
    }

export interface RuntimeLayoutEntry {
  node: NodeDefinition
  arrayIndex: number
  order: number
  visible: boolean
  placement: RuntimePlacement
}

export interface RuntimeLayoutPlan {
  flow: Map<string, RuntimeLayoutEntry[]>
  chrome: RuntimeLayoutEntry[]
  layers: Map<string, RuntimeLayoutEntry[]>
  insets: Record<RuntimeLayoutEdge, string>
}

const edges: RuntimeLayoutEdge[] = ['block-start', 'block-end', 'inline-start', 'inline-end']

function resolvePlacement(layout: RuntimeLayout): RuntimePlacement {
  const placement = layout.placement
  if (!placement || placement.kind === 'flow') {
    return {
      kind: 'flow',
      region: placement?.region ?? 'content',
    }
  }

  if (placement.kind === 'chrome') {
    return {
      kind: 'chrome',
      edge: placement.edge ?? 'block-start',
      position: placement.position ?? 'fixed',
      reserve: {
        mode: placement.reserve?.mode ?? 'measure',
        size: placement.reserve?.size,
      },
      avoidContent: placement.avoidContent ?? true,
    }
  }

  const anchor = placement.anchor ?? { block: 'end', inline: 'end' }
  return {
    kind: 'layer',
    layer: placement.layer ?? 'float',
    mode: placement.mode ?? (placement.anchor ? 'framework' : 'self'),
    anchor: {
      block: anchor.block ?? 'end',
      inline: anchor.inline ?? 'end',
    },
    offset: placement.offset,
  }
}

function resolveEntry(
  node: NodeDefinition,
  arrayIndex: number,
  registry: RuntimeRegistry,
): RuntimeLayoutEntry {
  const layout: RuntimeLayout = {
    ...(registry[node.type]?.defaultLayout ?? {}),
  }

  return {
    node,
    arrayIndex,
    order: layout.order ?? arrayIndex,
    visible: layout.visible ?? true,
    placement: resolvePlacement(layout),
  }
}

function pushEntry(
  target: Map<string, RuntimeLayoutEntry[]>,
  key: string,
  entry: RuntimeLayoutEntry,
): void {
  const current = target.get(key)
  if (current)
    current.push(entry)
  else
    target.set(key, [entry])
}

function toCssLength(value: string | number | undefined): string | null {
  if (typeof value === 'number')
    return `${value}px`
  return value ?? null
}

function createInsets(chrome: RuntimeLayoutEntry[]): Record<RuntimeLayoutEdge, string> {
  const contributions = new Map<RuntimeLayoutEdge, string[]>(edges.map(edge => [edge, []]))
  for (const entry of chrome) {
    if (entry.placement.kind !== 'chrome'
      || entry.placement.position !== 'fixed'
      || !entry.placement.avoidContent
      || entry.placement.reserve.mode === 'none') {
      continue
    }

    const size = toCssLength(entry.placement.reserve.size)
    if (size)
      contributions.get(entry.placement.edge)?.push(size)
  }

  return Object.fromEntries(edges.map((edge) => {
    const values = contributions.get(edge) ?? []
    return [edge, values.length > 1 ? `calc(${values.join(' + ')})` : (values[0] ?? '0px')]
  })) as Record<RuntimeLayoutEdge, string>
}

export function createRuntimeLayoutPlan(
  schema: DocumentSchema,
  registry: RuntimeRegistry,
): RuntimeLayoutPlan {
  const flow = new Map<string, RuntimeLayoutEntry[]>()
  const chrome: RuntimeLayoutEntry[] = []
  const layers = new Map<string, RuntimeLayoutEntry[]>()

  const nodesById = new Map(schema.nodes.map(node => [node.id, node]))
  for (const [arrayIndex, nodeId] of schema.structure.root.entries()) {
    const node = nodesById.get(nodeId)
    if (!node)
      continue
    const entry = resolveEntry(node, arrayIndex, registry)
    if (!entry.visible)
      continue

    if (entry.placement.kind === 'flow')
      pushEntry(flow, entry.placement.region, entry)
    else if (entry.placement.kind === 'chrome')
      chrome.push(entry)
    else
      pushEntry(layers, entry.placement.layer, entry)
  }

  const sortEntries = (entries: RuntimeLayoutEntry[]) => entries.sort(
    (left, right) => left.order - right.order || left.arrayIndex - right.arrayIndex,
  )
  for (const entries of flow.values())
    sortEntries(entries)
  for (const entries of layers.values())
    sortEntries(entries)
  sortEntries(chrome)

  return { flow, chrome, layers, insets: createInsets(chrome) }
}

export function createFrameworkLayerStyle(
  placement: Extract<RuntimePlacement, { kind: 'layer' }>,
): Record<string, string> {
  if (placement.mode === 'self')
    return { inset: '0' }

  const style: Record<string, string> = {}
  const offset = placement.offset ?? {}
  const blockOffset = placement.anchor.block === 'start'
    ? offset.blockStart
    : offset.blockEnd
  const inlineOffset = placement.anchor.inline === 'start'
    ? offset.inlineStart
    : offset.inlineEnd

  if (placement.anchor.block === 'start') {
    style.top = toCssLength(blockOffset) ?? '0px'
  }
  else if (placement.anchor.block === 'end') {
    style.bottom = toCssLength(blockOffset) ?? '0px'
  }
  else {
    style.top = '50%'
    style.transform = 'translateY(-50%)'
  }

  if (placement.anchor.inline === 'start') {
    style.left = toCssLength(inlineOffset) ?? '0px'
  }
  else if (placement.anchor.inline === 'end') {
    style.right = toCssLength(inlineOffset) ?? '0px'
  }
  else {
    style.left = '50%'
    style.transform = style.transform
      ? `${style.transform} translateX(-50%)`
      : 'translateX(-50%)'
  }

  return style
}
