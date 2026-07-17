import type { LayoutEdge, LayoutNodeEntry, LayoutPlan, ResolvedChromePlacement, ResolvedLayerPlacement, StyleValueMap } from '@dragcraft/core'
import type { VNode, VNodeChild } from 'vue'
import type { DeviceFrameSelectionPresentationHost } from '../types'
import { h, nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'
import { normalizeStyle, pickBackgroundStyle } from './style-utils'

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

function renderChrome(plan: LayoutPlan | undefined, chromeVNodes: VNode[]): VNodeChild | null {
  if (!plan || chromeVNodes.length === 0)
    return null

  const children = plan.chrome.map((entry, index) => {
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
      'data-dc-reserve-mode': placement.reserve.mode,
    }, [chromeVNodes[index]])
  })

  return h('div', { class: 'dc-device-frame__chrome' }, children)
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

    for (const item of Array.from(viewport.querySelectorAll<HTMLElement>('[data-dc-chrome-edge]'))) {
      if (item.dataset.dcReserveMode !== 'measure')
        continue
      const edge = item.dataset.dcChromeEdge as LayoutEdge
      const rect = getChromeMeasureTarget(item).getBoundingClientRect()
      totals[edge] += edge === 'block-start' || edge === 'block-end' ? rect.height : rect.width
    }

    for (const [edge, value] of Object.entries(totals))
      viewport.style.setProperty(measureVar(edge as LayoutEdge), `${value}px`)
  }

  function refreshObserver(): void {
    const viewport = viewportRef.value
    if (!viewport)
      return
    if (typeof ResizeObserver === 'undefined') {
      update()
      return
    }
    observer?.disconnect()
    observer = new ResizeObserver(update)
    for (const item of Array.from(viewport.querySelectorAll<HTMLElement>('[data-dc-chrome-edge]')))
      observer.observe(getChromeMeasureTarget(item))
    void nextTick(update)
  }

  onMounted(refreshObserver)
  onUpdated(refreshObserver)

  onBeforeUnmount(() => {
    observer?.disconnect()
  })
}

function viewportStyle(plan: LayoutPlan | undefined): Record<string, string> {
  const contributors = plan?.insets.contributors ?? []
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

  function refreshObserver(): void {
    const scroller = scrollerRef.value
    if (!scroller)
      return

    if (typeof ResizeObserver === 'undefined') {
      update()
      return
    }

    observer?.disconnect()
    observer = new ResizeObserver(update)
    if (scroller.firstElementChild instanceof HTMLElement)
      observer.observe(scroller.firstElementChild)
    else
      observer.observe(scroller)
    void nextTick(update)
  }

  onMounted(refreshObserver)
  onUpdated(refreshObserver)
  onBeforeUnmount(() => {
    observer?.disconnect()
  })

  return { thumbStyle, update }
}

export function useFrameViewport(options: () => FrameViewportOptions): () => VNodeChild {
  const viewportRef = ref<HTMLElement | null>(null)
  const scrollerRef = ref<HTMLElement | null>(null)
  useMeasuredChromeInsets(viewportRef)
  const { thumbStyle, update: updateScrollMetrics } = useScrollMetrics(scrollerRef)

  return () => {
    const current = options()
    const surfaceStyle = normalizeStyle(current.surfaceStyle)
    const backgroundStyle = pickBackgroundStyle(surfaceStyle)
    return h('div', {
      'ref': viewportRef,
      'class': 'dc-device-frame__viewport',
      'data-dc-overlay-boundary': '',
      'style': viewportStyle(current.plan),
    }, [
      h('div', { class: 'dc-device-frame__content', style: backgroundStyle }, [
        h('div', {
          ref: scrollerRef,
          class: 'dc-device-frame__content-scroller',
          style: backgroundStyle,
          onScroll: updateScrollMetrics,
        }, [
          h(
            'div',
            {
              'class': 'dc-device-frame__content-surface',
              'data-dc-component': 'container-shell',
              'style': surfaceStyle,
            },
            [
              ...(current.content ?? []),
              h('div', {
                'ref': (element: unknown) => {
                  current.selectionPresentation?.registerPlane('content', element instanceof HTMLElement ? element : null)
                },
                'class': 'dc-device-frame__selection-plane dc-device-frame__selection-plane--content',
                'data-dc-selection-plane': 'content',
                'aria-hidden': 'true',
              }),
            ],
          ),
        ]),
        h('div', { 'class': 'dc-device-frame__scrollbar', 'aria-hidden': 'true' }, [
          h('div', { class: 'dc-device-frame__scrollbar-thumb', style: thumbStyle.value }),
        ]),
      ]),
      renderChrome(current.plan, current.chromeVNodes ?? []),
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
