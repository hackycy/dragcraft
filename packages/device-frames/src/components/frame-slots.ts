import type { DesignerSchema, LayoutPlan, RegistryInstance, ResolvedLayoutSlotManifest } from '@dragcraft/core'
import type { Slots, VNodeChild } from 'vue'
import { resolveNodeLayout } from '@dragcraft/core'
import { h } from 'vue'

function slotContent(slots: Slots, name: string): VNodeChild[] {
  return slots[name]?.() ?? []
}

function sortedSlotManifests(
  plan: LayoutPlan | undefined,
  predicate: (manifest: ResolvedLayoutSlotManifest) => boolean,
): ResolvedLayoutSlotManifest[] {
  return Array.from(plan?.slotManifests.values() ?? [])
    .filter(manifest => manifest.slot !== 'content')
    .filter(predicate)
    .sort((a, b) => {
      if (a.order !== b.order)
        return a.order - b.order
      return a.slot.localeCompare(b.slot)
    })
}

function reserveTrack(
  className: string,
  manifests: ResolvedLayoutSlotManifest[],
  slots: Slots,
): VNodeChild | null {
  const children = manifests.flatMap(manifest => slotContent(slots, manifest.slot))
  if (children.length === 0)
    return null
  return h('div', { class: className }, children)
}

function overlayLayer(
  manifests: ResolvedLayoutSlotManifest[],
  slots: Slots,
): VNodeChild | null {
  const children = manifests.flatMap((manifest) => {
    const slotChildren = slotContent(slots, manifest.slot)
    if (slotChildren.length === 0)
      return []
    return [
      h('div', {
        class: [
          'dc-device-frame__overlay-item',
          manifest.className,
        ],
      }, slotChildren),
    ]
  })

  if (children.length === 0)
    return null
  return h('div', { class: 'dc-device-frame__overlay' }, children)
}

function positionedOverlay(
  schema: DesignerSchema | undefined,
  registry: RegistryInstance | undefined,
  designMode = true,
): VNodeChild[] {
  if (!schema || !registry)
    return []

  const children = schema.root.children ?? []
  const positioned: Array<{ node: typeof children[0], anchor: { block?: string, inline?: string }, visible: boolean }> = []

  for (const node of children) {
    const layout = resolveNodeLayout(node, registry, schema)
    if (layout.position) {
      // In preview mode, skip invisible nodes entirely
      if (!designMode && !layout.visible)
        continue
      positioned.push({ node, anchor: layout.position.anchor, visible: layout.visible })
    }
  }

  if (positioned.length === 0)
    return []

  return positioned.map(({ node, anchor, visible }) =>
    h('div', {
      'class': [
        'dc-device-frame__overlay-item',
        {
          'dc-device-frame__overlay-item--block-start': anchor.block === 'start',
          'dc-device-frame__overlay-item--block-center': anchor.block === 'center',
          'dc-device-frame__overlay-item--block-end': anchor.block === 'end' || !anchor.block,
          'dc-device-frame__overlay-item--inline-start': anchor.inline === 'start',
          'dc-device-frame__overlay-item--inline-center': anchor.inline === 'center',
          'dc-device-frame__overlay-item--inline-end': anchor.inline === 'end' || !anchor.inline,
          'dc-node--hidden': !visible,
        },
      ],
      'data-node-id': node.id,
    }),
  )
}

function fallbackContent(
  plan: LayoutPlan | undefined,
  slots: Slots,
  consumedSlots: Set<string>,
): VNodeChild[] {
  return Array.from(plan?.slots.keys() ?? [])
    .filter(slot => slot !== 'content' && !consumedSlots.has(slot))
    .flatMap(slot => slotContent(slots, slot))
}

export function renderFrameViewport(
  slots: Slots,
  plan?: LayoutPlan,
  schema?: DesignerSchema,
  registry?: RegistryInstance,
  designMode = true,
): VNodeChild[] {
  const top = sortedSlotManifests(
    plan,
    manifest => manifest.allocation === 'reserve' && manifest.axis === 'block' && manifest.edge === 'start',
  )
  const bottom = sortedSlotManifests(
    plan,
    manifest => manifest.allocation === 'reserve' && manifest.axis === 'block' && manifest.edge === 'end',
  )
  const inlineStart = sortedSlotManifests(
    plan,
    manifest => manifest.allocation === 'reserve' && manifest.axis === 'inline' && manifest.edge === 'start',
  )
  const inlineEnd = sortedSlotManifests(
    plan,
    manifest => manifest.allocation === 'reserve' && manifest.axis === 'inline' && manifest.edge === 'end',
  )
  const overlay = sortedSlotManifests(plan, manifest => manifest.allocation === 'overlay')
  const consumedSlots = new Set([
    ...top.map(manifest => manifest.slot),
    ...bottom.map(manifest => manifest.slot),
    ...inlineStart.map(manifest => manifest.slot),
    ...inlineEnd.map(manifest => manifest.slot),
    ...overlay.map(manifest => manifest.slot),
  ])
  const content = [
    ...(slots.default?.() ?? []),
    ...fallbackContent(plan, slots, consumedSlots),
  ]

  const positioned = positionedOverlay(schema, registry, designMode)

  return [
    reserveTrack('dc-device-frame__dock dc-device-frame__dock--block-start', top, slots),
    reserveTrack('dc-device-frame__dock dc-device-frame__dock--inline-start', inlineStart, slots),
    h('div', { class: 'dc-device-frame__content dc-container-shell' }, content),
    reserveTrack('dc-device-frame__dock dc-device-frame__dock--inline-end', inlineEnd, slots),
    reserveTrack('dc-device-frame__dock dc-device-frame__dock--block-end', bottom, slots),
    overlayLayer(overlay, slots),
    ...(positioned.length > 0 ? [h('div', { class: 'dc-device-frame__overlay dc-device-frame__positioned' }, positioned)] : []),
  ]
}
