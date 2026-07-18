import type { LayoutEdge, LayoutPlan, ResolvedChromePlacement, ResolvedLayerPlacement, StyleValueMap } from '@dragcraft/core'
import type { Component, PropType, VNode } from 'vue'
import type { NodeSelectionPresentationHost } from '../selection-presentation'
import { DEFAULT_LAYOUT_REGION } from '@dragcraft/core'
import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'

const CHROME_MEASURE_SELECTOR = '[data-dc-chrome-position="fixed"][data-dc-reserve-mode="measure"][data-dc-avoid-content="true"]'

function sizeToCss(value: string | number | undefined): string {
  return typeof value === 'number' ? `${value}px` : value ?? '0px'
}

function edgeStyle(edge: LayoutEdge): Record<string, string> {
  switch (edge) {
    case 'block-start':
      return { top: '0px', right: '0px', left: '0px' }
    case 'block-end':
      return { right: '0px', bottom: '0px', left: '0px' }
    case 'inline-start':
      return { top: '0px', bottom: '0px', left: '0px' }
    case 'inline-end':
      return { top: '0px', right: '0px', bottom: '0px' }
  }
}

function chromeItemStyle(placement: ResolvedChromePlacement): Record<string, string> {
  if (placement.position === 'flow')
    return { position: 'relative', pointerEvents: 'auto' }
  if (placement.position === 'fixed') {
    return {
      position: 'relative',
      zIndex: '20',
      pointerEvents: 'auto',
    }
  }
  return {
    position: 'sticky',
    zIndex: '20',
    pointerEvents: 'auto',
    ...edgeStyle(placement.edge),
  }
}

function fixedChromeStackStyle(edge: LayoutEdge): Record<string, string> {
  const style: Record<string, string> = {
    position: 'absolute',
    display: 'flex',
    pointerEvents: 'none',
  }
  if (edge === 'block-start' || edge === 'block-end') {
    style.flexDirection = edge === 'block-start' ? 'column' : 'column-reverse'
    style.left = '0px'
    style.right = '0px'
    style[edge === 'block-start' ? 'top' : 'bottom'] = '0px'
  }
  else {
    style.flexDirection = edge === 'inline-start' ? 'row' : 'row-reverse'
    style.top = 'var(--dc-inset-block-start)'
    style.bottom = 'var(--dc-inset-block-end)'
    style[edge === 'inline-start' ? 'left' : 'right'] = '0px'
  }
  return style
}

function layerItemStyle(placement: ResolvedLayerPlacement): Record<string, string> {
  if (placement.mode === 'self') {
    return {
      position: 'absolute',
      inset: '0px',
      pointerEvents: 'none',
    }
  }

  const style: Record<string, string> = {
    position: 'absolute',
    pointerEvents: 'auto',
  }
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

function insetVariables(plan: LayoutPlan | undefined): Record<string, string> {
  const sized: Record<LayoutEdge, string[]> = {
    'block-start': [],
    'block-end': [],
    'inline-start': [],
    'inline-end': [],
  }
  const measuredFallback: Record<LayoutEdge, string[]> = {
    'block-start': [],
    'block-end': [],
    'inline-start': [],
    'inline-end': [],
  }
  for (const entry of plan?.chrome ?? []) {
    const placement = entry.layout.placement as ResolvedChromePlacement
    if (placement.position !== 'fixed' || !placement.avoidContent)
      continue
    if (placement.reserve.mode === 'size')
      sized[placement.edge].push(sizeToCss(placement.reserve.size))
    else if (placement.reserve.mode === 'measure' && placement.reserve.size !== undefined)
      measuredFallback[placement.edge].push(sizeToCss(placement.reserve.size))
  }
  const result: Record<string, string> = {}
  for (const [edge, sizes] of Object.entries(sized)) {
    result[`--dc-sized-inset-${edge}`] = sizes.length > 1
      ? `calc(${sizes.join(' + ')})`
      : sizes[0] ?? '0px'
  }
  for (const [edge, sizes] of Object.entries(measuredFallback)) {
    result[`--dc-measured-inset-${edge}`] = sizes.length > 1
      ? `calc(${sizes.join(' + ')})`
      : sizes[0] ?? '0px'
  }
  return result
}

const DefaultContainerShell = defineComponent({
  name: 'DcDefaultContainerShell',

  props: {
    isEmpty: {
      type: Boolean,
      default: false,
    },
    regionVNodes: {
      type: Object as PropType<Record<string, VNode[]>>,
      default: () => ({}),
    },
    chromeVNodes: {
      type: Array as PropType<VNode[]>,
      default: () => [],
    },
    layerVNodes: {
      type: Object as PropType<Record<string, VNode[]>>,
      default: () => ({}),
    },
    forbiddenOverlayVNode: {
      type: Object as PropType<VNode | null>,
      default: null,
    },
    layoutPlan: {
      type: Object as PropType<LayoutPlan>,
      default: undefined,
    },
    surfaceStyle: {
      type: Object as PropType<StyleValueMap>,
      default: undefined,
    },
    selectionPresentation: {
      type: Object as PropType<NodeSelectionPresentationHost>,
      default: undefined,
    },
  },

  setup(props, { slots }) {
    const shellRef = ref<HTMLElement | null>(null)
    let resizeObserver: ResizeObserver | null = null

    function updateMeasuredInsets(): void {
      const shell = shellRef.value
      if (!shell)
        return
      const totals: Record<LayoutEdge, number> = {
        'block-start': 0,
        'block-end': 0,
        'inline-start': 0,
        'inline-end': 0,
      }
      for (const item of Array.from(shell.querySelectorAll<HTMLElement>(CHROME_MEASURE_SELECTOR))) {
        const edge = item.dataset.dcChromeEdge as LayoutEdge
        const rect = item.getBoundingClientRect()
        totals[edge] += edge === 'block-start' || edge === 'block-end' ? rect.height : rect.width
      }
      for (const [edge, value] of Object.entries(totals))
        shell.style.setProperty(`--dc-measured-inset-${edge}`, `${value}px`)
    }

    function refreshMeasuredInsets(): void {
      resizeObserver?.disconnect()
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(updateMeasuredInsets)
        for (const item of Array.from(shellRef.value?.querySelectorAll<HTMLElement>(CHROME_MEASURE_SELECTOR) ?? []))
          resizeObserver.observe(item)
      }
      void nextTick(updateMeasuredInsets)
    }

    onMounted(refreshMeasuredInsets)
    onUpdated(refreshMeasuredInsets)
    onBeforeUnmount(() => resizeObserver?.disconnect())

    return () => {
      const additionalRegions = Object.entries(props.regionVNodes)
        .filter(([region]) => region !== DEFAULT_LAYOUT_REGION)
        .map(([region, nodes]) => h('div', {
          'key': region,
          'class': 'dc-container-shell__region',
          'data-dc-layout-region': region,
        }, nodes))
      const contentChrome: Record<LayoutEdge, VNode[]> = {
        'block-start': [],
        'block-end': [],
        'inline-start': [],
        'inline-end': [],
      }
      const fixedChrome: Record<LayoutEdge, { reserved: VNode[], overlay: VNode[] }> = {
        'block-start': { reserved: [], overlay: [] },
        'block-end': { reserved: [], overlay: [] },
        'inline-start': { reserved: [], overlay: [] },
        'inline-end': { reserved: [], overlay: [] },
      }
      for (const [index, entry] of (props.layoutPlan?.chrome ?? []).entries()) {
        const placement = entry.layout.placement as ResolvedChromePlacement
        const item = h('div', {
          'key': entry.node.id,
          'class': ['dc-container-shell__chrome-item', `dc-container-shell__chrome-item--${placement.position}`],
          'data-dc-chrome-edge': placement.edge,
          'data-dc-chrome-position': placement.position,
          'data-dc-reserve-mode': placement.reserve.mode,
          'data-dc-avoid-content': String(placement.avoidContent),
          'style': chromeItemStyle(placement),
        }, [props.chromeVNodes[index]])
        if (placement.position === 'fixed') {
          const stack = placement.avoidContent ? 'reserved' : 'overlay'
          fixedChrome[placement.edge][stack].push(item)
        }
        else {
          contentChrome[placement.edge].push(item)
        }
      }
      const fixedChromeStacks = (Object.entries(fixedChrome) as Array<[
        LayoutEdge,
        { reserved: VNode[], overlay: VNode[] },
      ]>).flatMap(([edge, groups]) => (['reserved', 'overlay'] as const).flatMap((stack) => {
        const items = groups[stack]
        return items.length > 0
          ? [h('div', {
              'key': `${edge}:${stack}`,
              'class': [
                'dc-container-shell__chrome-stack',
                `dc-container-shell__chrome-stack--${edge}`,
                `dc-container-shell__chrome-stack--${stack}`,
              ],
              'data-dc-chrome-edge': edge,
              'data-dc-avoid-content-stack': String(stack === 'reserved'),
              'style': fixedChromeStackStyle(edge),
            }, items)]
          : []
      }))
      const layers = Array.from(props.layoutPlan?.layers.entries() ?? []).map(([layer, entries]) => {
        const vnodes = props.layerVNodes[layer] ?? []
        return h('div', {
          'key': layer,
          'class': 'dc-container-shell__layer',
          'data-dc-layer': layer,
          'style': { position: 'absolute', inset: '0px', zIndex: '30', pointerEvents: 'none' },
        }, entries.map((entry, index) => {
          const placement = entry.layout.placement as ResolvedLayerPlacement
          return h('div', {
            'key': entry.node.id,
            'class': ['dc-container-shell__layer-item', `dc-container-shell__layer-item--${placement.mode}`],
            'data-dc-layer-mode': placement.mode,
            'data-dc-layer-block': placement.anchor.block ?? 'end',
            'data-dc-layer-inline': placement.anchor.inline ?? 'end',
            'style': layerItemStyle(placement),
          }, [vnodes[index]])
        }))
      })
      return h(
        'div',
        {
          'ref': shellRef,
          'class': 'dc-container-shell',
          'data-dc-component': 'container-shell',
          'data-dc-state': props.isEmpty ? 'empty' : undefined,
          'style': insetVariables(props.layoutPlan),
        },
        [
          h('div', {
            class: 'dc-container-shell__content',
            style: {
              position: 'relative',
              boxSizing: 'border-box',
            },
          }, [
            h('div', { class: 'dc-container-shell__content-layout' }, [
              ...contentChrome['block-start'],
              h('div', { class: 'dc-container-shell__content-row' }, [
                contentChrome['inline-start'].length > 0
                  ? h('div', {
                      class: 'dc-container-shell__content-edge dc-container-shell__content-edge--inline-start',
                    }, contentChrome['inline-start'])
                  : null,
                h('div', { class: 'dc-container-shell__content-surface', style: props.surfaceStyle }, [
                  ...(slots.default?.() ?? []),
                  ...additionalRegions,
                ]),
                contentChrome['inline-end'].length > 0
                  ? h('div', {
                      class: 'dc-container-shell__content-edge dc-container-shell__content-edge--inline-end',
                    }, contentChrome['inline-end'])
                  : null,
              ]),
              ...contentChrome['block-end'],
              h('div', {
                'ref': (element: unknown) => {
                  props.selectionPresentation?.registerPlane('content', element instanceof HTMLElement ? element : null)
                },
                'class': 'dc-node-selection-plane dc-node-selection-plane--content',
                'data-dc-selection-plane': 'content',
                'aria-hidden': 'true',
              }),
            ]),
          ]),
          fixedChromeStacks.length > 0
            ? h('div', {
                class: 'dc-container-shell__chrome',
                style: { position: 'absolute', inset: '0px', zIndex: '20', pointerEvents: 'none' },
              }, fixedChromeStacks)
            : null,
          ...layers,
          h('div', {
            'ref': (element: unknown) => {
              props.selectionPresentation?.registerPlane('root', element instanceof HTMLElement ? element : null)
            },
            'class': 'dc-node-selection-plane dc-node-selection-plane--root',
            'data-dc-selection-plane': 'root',
            'aria-hidden': 'true',
          }),
          h('div', {
            'ref': (element: unknown) => {
              props.selectionPresentation?.registerPlane('viewport', element instanceof HTMLElement ? element : null)
            },
            'class': 'dc-node-selection-plane dc-node-selection-plane--viewport',
            'data-dc-selection-plane': 'viewport',
            'aria-hidden': 'true',
          }),
          props.forbiddenOverlayVNode,
        ],
      )
    }
  },
})

const DefaultContainerShellWithOverlay = DefaultContainerShell as Component & { __dcHandlesForbiddenOverlay?: boolean }
DefaultContainerShellWithOverlay.__dcHandlesForbiddenOverlay = true

export default DefaultContainerShell
