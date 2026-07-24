import type { LayoutEdge, LayoutNodeEntry, LayoutPlan, ResolvedChromePlacement, ResolvedLayerPlacement, StyleValueMap } from '@dragcraft/core'
import type { VNode, VNodeChild } from 'vue'
import type { DeviceFrameSelectionPresentationHost } from '../types'
import { normalizeStyleValueMap } from '@dragcraft/core'
import { h, nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'

export interface FrameViewportOptions {
  content?: VNodeChild[]
  chromeVNodes?: VNode[]
  layerVNodes?: Record<string, VNode[]>
  plan?: LayoutPlan
  surfaceStyle?: StyleValueMap
  selectionPresentation?: DeviceFrameSelectionPresentationHost
}

function renderFrameRootSelectionPlane(
  selectionPresentation: DeviceFrameSelectionPresentationHost | undefined,
): VNode {
  return h('div', {
    'ref': (element: unknown) => {
      selectionPresentation?.registerPlane('root', element instanceof HTMLElement ? element : null)
    },
    'class': 'dc-device-frame__selection-plane dc-device-frame__selection-plane--root',
    'data-dc-selection-plane': 'root',
    'aria-hidden': 'true',
  })
}

export function renderDeviceFrame(
  modifierClass: string,
  selectionPresentation: DeviceFrameSelectionPresentationHost | undefined,
  children: VNodeChild[],
  frameOverlay?: VNodeChild,
): VNode {
  return h('div', {
    'class': ['dc-device-frame', modifierClass],
    'data-dc-toolbar-boundary': '',
    'data-dc-canvas-fit': 'contain',
  }, [
    h('div', { class: 'dc-device-frame__surface' }, children),
    frameOverlay,
    renderFrameRootSelectionPlane(selectionPresentation),
  ])
}

function edgeClass(edge: LayoutEdge): string {
  return `dc-device-frame__chrome--${edge}`
}

function measureVar(edge: LayoutEdge): string {
  return `--dc-measured-inset-${edge}`
}

function sizeVar(edge: LayoutEdge): string {
  return `--dc-sized-inset-${edge}`
}

function sizeToCss(value: string | number | undefined): string {
  if (typeof value === 'number')
    return `${value}px`
  return value ?? '0px'
}

function layerItemStyle(entry: LayoutNodeEntry): Record<string, string> | undefined {
  const placement = entry.layout.placement as ResolvedLayerPlacement
  if (placement.mode !== 'framework')
    return undefined

  const style: Record<string, string> = {}
  const block = placement.anchor.block ?? 'end'
  const inline = placement.anchor.inline ?? 'end'

  if (block === 'start')
    style.top = sizeToCss(placement.offset?.blockStart ?? 'calc(var(--dc-inset-block-start) + 16px)')
  else if (block === 'center')
    style.top = '50%'
  else
    style.bottom = sizeToCss(placement.offset?.blockEnd ?? 'calc(var(--dc-inset-block-end) + 16px)')

  if (inline === 'start')
    style.left = sizeToCss(placement.offset?.inlineStart ?? 'calc(var(--dc-inset-inline-start) + 16px)')
  else if (inline === 'center')
    style.left = '50%'
  else
    style.right = sizeToCss(placement.offset?.inlineEnd ?? 'calc(var(--dc-inset-inline-end) + 16px)')

  if (block === 'center' && inline === 'center')
    style.transform = 'translate(-50%, -50%)'
  else if (block === 'center')
    style.transform = 'translateY(-50%)'
  else if (inline === 'center')
    style.transform = 'translateX(-50%)'

  return style
}

function renderChromeItem(entry: LayoutNodeEntry, vnode: VNode | undefined): VNode {
  const placement = entry.layout.placement as ResolvedChromePlacement
  return h('div', {
    'key': entry.node.id,
    'class': [
      'dc-device-frame__chrome-item',
      edgeClass(placement.edge),
      `dc-device-frame__chrome-item--${placement.position}`,
    ],
    'data-node-id': entry.node.id,
    'data-dc-chrome-edge': placement.edge,
    'data-dc-chrome-position': placement.position,
    'data-dc-reserve-mode': placement.reserve.mode,
    'data-dc-avoid-content': String(placement.avoidContent),
  }, [vnode])
}

function renderChrome(plan: LayoutPlan | undefined, chromeVNodes: VNode[]): VNodeChild | null {
  if (!plan || chromeVNodes.length === 0)
    return null

  const groups: Record<LayoutEdge, { reserved: VNode[], overlay: VNode[] }> = {
    'block-start': { reserved: [], overlay: [] },
    'block-end': { reserved: [], overlay: [] },
    'inline-start': { reserved: [], overlay: [] },
    'inline-end': { reserved: [], overlay: [] },
  }
  for (const [index, entry] of plan.chrome.entries()) {
    const placement = entry.layout.placement as ResolvedChromePlacement
    if (placement.position === 'fixed') {
      const stack = placement.avoidContent ? 'reserved' : 'overlay'
      groups[placement.edge][stack].push(renderChromeItem(entry, chromeVNodes[index]))
    }
  }
  const stacks = (Object.entries(groups) as Array<[
    LayoutEdge,
    { reserved: VNode[], overlay: VNode[] },
  ]>).flatMap(([edge, edgeGroups]) => (['reserved', 'overlay'] as const).flatMap((stack) => {
    const items = edgeGroups[stack]
    return items.length > 0
      ? [h('div', {
          'key': `${edge}:${stack}`,
          'class': [
            'dc-device-frame__chrome-stack',
            `dc-device-frame__chrome-stack--${edge}`,
            `dc-device-frame__chrome-stack--${stack}`,
          ],
          'data-dc-chrome-edge': edge,
          'data-dc-avoid-content-stack': String(stack === 'reserved'),
        }, items)]
      : []
  }))

  return stacks.length > 0
    ? h('div', { class: 'dc-device-frame__chrome' }, stacks)
    : null
}

function groupContentChrome(
  plan: LayoutPlan | undefined,
  chromeVNodes: VNode[],
): Record<LayoutEdge, VNode[]> {
  const groups: Record<LayoutEdge, VNode[]> = {
    'block-start': [],
    'block-end': [],
    'inline-start': [],
    'inline-end': [],
  }
  for (const [index, entry] of (plan?.chrome ?? []).entries()) {
    const placement = entry.layout.placement as ResolvedChromePlacement
    if (placement.position !== 'fixed')
      groups[placement.edge].push(renderChromeItem(entry, chromeVNodes[index]))
  }
  return groups
}

function renderLayers(plan: LayoutPlan | undefined, layerVNodes: Record<string, VNode[]>): VNodeChild[] {
  if (!plan)
    return []

  return Array.from(plan.layers.entries()).map(([layer, entries]) => {
    const vnodes = layerVNodes[layer] ?? []
    const children = entries.map((entry, index) => {
      const placement = entry.layout.placement as ResolvedLayerPlacement
      return h('div', {
        'key': entry.node.id,
        'class': [
          'dc-device-frame__layer-item',
          `dc-device-frame__layer-item--${placement.mode}`,
        ],
        'data-node-id': entry.node.id,
        'data-dc-layer-mode': placement.mode,
        'style': layerItemStyle(entry),
      }, [vnodes[index]])
    })

    return h('div', {
      'key': layer,
      'class': ['dc-device-frame__layer', `dc-device-frame__layer--${layer}`],
      'data-dc-layer': layer,
    }, children)
  })
}

function useMeasuredChromeInsets(viewportRef: { value: HTMLElement | null }): void {
  let observer: ResizeObserver | null = null
  let observedTargets = new Set<HTMLElement>()
  let updateFrame: number | null = null

  function getChromeMeasureTarget(item: HTMLElement): HTMLElement {
    return item.querySelector<HTMLElement>(':scope > .dc-node') ?? item
  }

  function update(): void {
    const viewport = viewportRef.value
    if (!viewport)
      return

    const totals: Record<LayoutEdge, number> = {
      'block-start': 0,
      'block-end': 0,
      'inline-start': 0,
      'inline-end': 0,
    }

    for (const item of Array.from(viewport.querySelectorAll<HTMLElement>('[data-dc-chrome-position="fixed"][data-dc-avoid-content="true"]'))) {
      if (item.dataset.dcReserveMode !== 'measure')
        continue
      const edge = item.dataset.dcChromeEdge as LayoutEdge
      const rect = getChromeMeasureTarget(item).getBoundingClientRect()
      totals[edge] += edge === 'block-start' || edge === 'block-end' ? rect.height : rect.width
    }

    for (const [edge, value] of Object.entries(totals))
      viewport.style.setProperty(measureVar(edge as LayoutEdge), `${value}px`)
  }

  function scheduleUpdate(): void {
    if (updateFrame !== null)
      return
    updateFrame = window.requestAnimationFrame(() => {
      updateFrame = null
      update()
    })
  }

  function refreshObserver(): void {
    const viewport = viewportRef.value
    if (!viewport)
      return
    if (typeof ResizeObserver === 'undefined') {
      scheduleUpdate()
      return
    }
    observer ??= new ResizeObserver(scheduleUpdate)
    const nextTargets = new Set(Array.from(
      viewport.querySelectorAll<HTMLElement>('[data-dc-chrome-position="fixed"][data-dc-avoid-content="true"]'),
      getChromeMeasureTarget,
    ))
    const targetsChanged = nextTargets.size !== observedTargets.size
      || [...nextTargets].some(target => !observedTargets.has(target))
    if (targetsChanged) {
      observer.disconnect()
      for (const target of nextTargets)
        observer.observe(target)
      observedTargets = nextTargets
    }
    void nextTick(scheduleUpdate)
  }

  onMounted(refreshObserver)
  onUpdated(refreshObserver)

  onBeforeUnmount(() => {
    observer?.disconnect()
    if (updateFrame !== null)
      window.cancelAnimationFrame(updateFrame)
  })
}

function viewportStyle(plan: LayoutPlan | undefined): Record<string, string> {
  const fixedChromeIds = new Set((plan?.chrome ?? []).flatMap((entry) => {
    const placement = entry.layout.placement as ResolvedChromePlacement
    return placement.position === 'fixed' ? [entry.node.id] : []
  }))
  const contributors = (plan?.insets.contributors ?? [])
    .filter(contributor => fixedChromeIds.has(contributor.sourceNodeId))
  const sizedTotals: Record<LayoutEdge, string[]> = {
    'block-start': [],
    'block-end': [],
    'inline-start': [],
    'inline-end': [],
  }
  const measuredFallbackTotals: Record<LayoutEdge, string[]> = {
    'block-start': [],
    'block-end': [],
    'inline-start': [],
    'inline-end': [],
  }

  for (const contributor of contributors) {
    if (contributor.reserve.mode === 'size')
      sizedTotals[contributor.edge].push(sizeToCss(contributor.reserve.size))
    else if (contributor.reserve.mode === 'measure' && contributor.reserve.size !== undefined)
      measuredFallbackTotals[contributor.edge].push(sizeToCss(contributor.reserve.size))
  }

  const style: Record<string, string> = {}
  for (const [edge, values] of Object.entries(sizedTotals)) {
    style[sizeVar(edge as LayoutEdge)] = values.length === 0
      ? '0px'
      : values.length === 1
        ? values[0]
        : `calc(${values.join(' + ')})`
  }
  for (const [edge, values] of Object.entries(measuredFallbackTotals)) {
    if (values.length === 0)
      continue
    style[measureVar(edge as LayoutEdge)] = values.length === 1
      ? values[0]
      : `calc(${values.join(' + ')})`
  }
  return style
}

function useScrollMetrics(scrollerRef: { value: HTMLElement | null }) {
  const thumbStyle = ref<Record<string, string>>({
    display: 'none',
  })
  let observer: ResizeObserver | null = null
  let observedTarget: HTMLElement | null = null
  let updateFrame: number | null = null

  function setThumbStyle(next: Record<string, string>): void {
    const prev = thumbStyle.value
    const keys = new Set([...Object.keys(prev), ...Object.keys(next)])
    for (const key of keys) {
      if (prev[key] !== next[key]) {
        thumbStyle.value = next
        return
      }
    }
  }

  function update(): void {
    const scroller = scrollerRef.value
    if (!scroller) {
      setThumbStyle({ display: 'none' })
      return
    }

    const { clientHeight, scrollHeight, scrollTop } = scroller
    if (scrollHeight <= clientHeight + 1) {
      setThumbStyle({ display: 'none' })
      return
    }

    const thumbHeight = Math.max(24, clientHeight * clientHeight / scrollHeight)
    const maxThumbTop = Math.max(0, clientHeight - thumbHeight)
    const maxScrollTop = Math.max(1, scrollHeight - clientHeight)
    const thumbTop = maxThumbTop * (scrollTop / maxScrollTop)

    setThumbStyle({
      height: `${thumbHeight}px`,
      transform: `translateY(${thumbTop}px)`,
    })
  }

  function scheduleUpdate(): void {
    if (updateFrame !== null)
      return
    updateFrame = window.requestAnimationFrame(() => {
      updateFrame = null
      update()
    })
  }

  function refreshObserver(): void {
    const scroller = scrollerRef.value
    if (!scroller)
      return

    if (typeof ResizeObserver === 'undefined') {
      scheduleUpdate()
      return
    }

    observer ??= new ResizeObserver(scheduleUpdate)
    const nextTarget = scroller.firstElementChild instanceof HTMLElement
      ? scroller.firstElementChild
      : scroller
    if (nextTarget !== observedTarget) {
      observer.disconnect()
      observer.observe(nextTarget)
      observedTarget = nextTarget
    }
    void nextTick(scheduleUpdate)
  }

  onMounted(refreshObserver)
  onUpdated(refreshObserver)
  onBeforeUnmount(() => {
    observer?.disconnect()
    if (updateFrame !== null)
      window.cancelAnimationFrame(updateFrame)
  })

  return { thumbStyle, update: scheduleUpdate }
}

export function useFrameViewport(options: () => FrameViewportOptions): () => VNodeChild {
  const viewportRef = ref<HTMLElement | null>(null)
  const scrollerRef = ref<HTMLElement | null>(null)
  useMeasuredChromeInsets(viewportRef)
  const { thumbStyle, update: updateScrollMetrics } = useScrollMetrics(scrollerRef)

  return () => {
    const current = options()
    const surfaceStyle = normalizeStyleValueMap(current.surfaceStyle)
    const chromeVNodes = current.chromeVNodes ?? []
    const contentChrome = groupContentChrome(current.plan, chromeVNodes)
    return h('div', {
      'ref': viewportRef,
      'class': 'dc-device-frame__viewport',
      'data-dc-overlay-boundary': '',
      'style': viewportStyle(current.plan),
    }, [
      h('div', { class: 'dc-device-frame__content' }, [
        h('div', {
          ref: scrollerRef,
          class: 'dc-device-frame__content-scroller',
          onScroll: updateScrollMetrics,
        }, [
          h('div', { class: 'dc-device-frame__content-layout' }, [
            ...contentChrome['block-start'],
            h('div', { class: 'dc-device-frame__content-row' }, [
              contentChrome['inline-start'].length > 0
                ? h('div', {
                    class: 'dc-device-frame__content-edge dc-device-frame__content-edge--inline-start',
                  }, contentChrome['inline-start'])
                : null,
              h(
                'div',
                {
                  'class': 'dc-device-frame__content-surface',
                  'data-dc-component': 'container-shell',
                  'style': surfaceStyle,
                },
                current.content ?? [],
              ),
              contentChrome['inline-end'].length > 0
                ? h('div', {
                    class: 'dc-device-frame__content-edge dc-device-frame__content-edge--inline-end',
                  }, contentChrome['inline-end'])
                : null,
            ]),
            ...contentChrome['block-end'],
            h('div', {
              'ref': (element: unknown) => {
                current.selectionPresentation?.registerPlane('content', element instanceof HTMLElement ? element : null)
              },
              'class': 'dc-device-frame__selection-plane dc-device-frame__selection-plane--content',
              'data-dc-selection-plane': 'content',
              'aria-hidden': 'true',
            }),
          ]),
        ]),
        h('div', { 'class': 'dc-device-frame__scrollbar', 'aria-hidden': 'true' }, [
          h('div', { class: 'dc-device-frame__scrollbar-thumb', style: thumbStyle.value }),
        ]),
      ]),
      renderChrome(current.plan, chromeVNodes),
      ...renderLayers(current.plan, current.layerVNodes ?? {}),
      h('div', {
        'ref': (element: unknown) => {
          current.selectionPresentation?.registerPlane('viewport', element instanceof HTMLElement ? element : null)
        },
        'class': 'dc-device-frame__selection-plane dc-device-frame__selection-plane--viewport',
        'data-dc-selection-plane': 'viewport',
        'aria-hidden': 'true',
      }),
    ])
  }
}
