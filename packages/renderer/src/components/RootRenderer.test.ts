// @vitest-environment happy-dom
import type { DesignerSchema, NodePlacement } from '@dragcraft/core'
import type { Component } from 'vue'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createEngine } from '@dragcraft/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, inject, nextTick, readonly, ref, shallowRef } from 'vue'
import { NODE_SELECTION_PLANE_KEY } from '../selection-presentation'
import RootRenderer from './RootRenderer'

const TestWidget = defineComponent({
  props: { label: { type: String, default: '' } },
  setup(props) {
    const selectionPlane = inject(NODE_SELECTION_PLANE_KEY)
    return () => h('div', {
      'class': 'test-widget',
      'data-test-selection-plane': selectionPlane?.value,
    }, props.label)
  },
})

function makeLayoutSchema(entries: Array<{ id: string, placement?: NodePlacement }>): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: {},
    root: {
      id: 'root',
      type: 'root',
      props: {},
      children: entries.map(({ id, placement }) => ({
        id,
        type: 'test-widget',
        props: { label: id },
        layout: placement ? { placement } : undefined,
      })),
    },
  }
}

function mountDefaultRootRenderer(schema: DesignerSchema) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const engine = createEngine()
  const imported = engine.importSchema(schema)
  if (!imported.ok)
    throw new Error(`Test schema rejected: ${imported.diagnostics.map(item => item.code).join(', ')}`)
  const app = createApp(defineComponent({
    setup: () => () => h(RootRenderer, {
      engine,
      componentMap: { 'test-widget': TestWidget },
    }),
  }))
  app.mount(host)
  return { app, host }
}

function renderedLayoutOrder(host: HTMLElement): string[] {
  return Array.from(host.querySelectorAll<HTMLElement>(
    '.dc-canvas-surface [data-dc-component="node"], .dc-canvas-surface [data-dc-component="drop-indicator"]',
  )).map(element => element.dataset.nodeId ?? element.dataset.dcComponent ?? '')
}

function mountRootRenderer(containerShell: Component) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const engine = createEngine()
  engine.store.setDragTarget({ sourceNodeId: null, widgetType: 'navbar' })

  const app = createApp(defineComponent({
    setup() {
      return () => h(RootRenderer, {
        engine,
        componentMap: {},
        extensions: { containerShell },
        dragOverNodeId: ref('root'),
        isForbidden: ref(true),
        forbiddenReason: ref({ message: '页面只能配置一个导航栏' }),
      })
    },
  }))
  app.mount(host)
  return { app, host }
}

describe('rootRenderer forbidden overlay', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it.each([
    ['a custom sort scope', { kind: 'flow' as const, sortScope: 'hero' }],
    ['sorting disabled', { kind: 'flow' as const, sortScope: false as const }],
  ])('renders content nodes with %s instead of the empty state', (_label, placement) => {
    const { app, host } = mountDefaultRootRenderer(makeLayoutSchema([{ id: 'content-node', placement }]))

    try {
      expect(host.querySelector('[data-node-id="content-node"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-component="empty-state"]')).toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('renders every root layout projection with the default shell', () => {
    const { app, host } = mountDefaultRootRenderer(makeLayoutSchema([
      { id: 'content' },
      { id: 'secondary', placement: { kind: 'flow', region: 'secondary', sortScope: false } },
      { id: 'chrome', placement: { kind: 'chrome', edge: 'block-start' } },
      { id: 'layer', placement: { kind: 'layer', layer: 'float' } },
    ]))

    try {
      expect(Array.from(host.querySelectorAll('[data-dc-component="node"]')).map(element => element.getAttribute('data-node-id')))
        .toEqual(['content', 'secondary', 'chrome', 'layer'])
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('does not render the empty state when only non-content projections exist', () => {
    const { app, host } = mountDefaultRootRenderer(makeLayoutSchema([
      { id: 'secondary', placement: { kind: 'flow', region: 'secondary', sortScope: false } },
      { id: 'chrome', placement: { kind: 'chrome', edge: 'block-start' } },
      { id: 'layer', placement: { kind: 'layer', layer: 'float' } },
    ]))

    try {
      expect(host.querySelectorAll('[data-dc-component="node"]')).toHaveLength(3)
      expect(host.querySelector('[data-dc-component="empty-state"]')).toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('renders the default-scope drop indicator on an empty schema', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const engine = createEngine()
    const app = createApp(defineComponent({
      setup: () => () => h(RootRenderer, {
        engine,
        componentMap: {},
        dragOverNodeId: ref<string | null>('root'),
        dragOverIndex: ref<number | null>(0),
        activeDestination: ref({ kind: 'root' as const, sortScope: 'content', index: 0 }),
      }),
    }))
    app.mount(host)

    try {
      expect(host.querySelector('[data-dc-component="drop-indicator"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-component="empty-state"]')).toBeNull()
    }
    finally {
      app.unmount()
      engine.dispose()
      host.remove()
    }
  })

  it('places the drop indicator at the active custom sort-scope index', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const engine = createEngine()
    const imported = engine.importSchema(makeLayoutSchema([
      { id: 'default-a' },
      { id: 'hero-a', placement: { kind: 'flow', sortScope: 'hero' } },
      { id: 'default-b' },
    ]))
    if (!imported.ok)
      throw new Error(`Test schema rejected: ${imported.diagnostics.map(item => item.code).join(', ')}`)
    const dragOverNodeId = ref<string | null>('root')
    const dragOverIndex = ref<number | null>(1)
    const activeDestination = ref({ kind: 'root' as const, sortScope: 'hero', index: 1 })
    const app = createApp(defineComponent({
      setup: () => () => h(RootRenderer, {
        engine,
        componentMap: { 'test-widget': TestWidget },
        dragOverNodeId,
        dragOverIndex,
        activeDestination,
      }),
    }))
    app.mount(host)

    try {
      expect(renderedLayoutOrder(host)).toEqual([
        'default-a',
        'hero-a',
        'drop-indicator',
        'default-b',
      ])
    }
    finally {
      app.unmount()
      engine.dispose()
      host.remove()
    }
  })

  it('does not render a flow indicator for an unsorted root placement', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const engine = createEngine()
    const imported = engine.importSchema(makeLayoutSchema([{ id: 'content' }]))
    if (!imported.ok)
      throw new Error(`Test schema rejected: ${imported.diagnostics.map(item => item.code).join(', ')}`)
    const app = createApp(defineComponent({
      setup: () => () => h(RootRenderer, {
        engine,
        componentMap: { 'test-widget': TestWidget },
        dragOverNodeId: ref<string | null>('root'),
        dragOverIndex: ref<number | null>(null),
        activeDestination: ref({ kind: 'root' as const }),
      }),
    }))
    app.mount(host)

    try {
      expect(host.querySelector('[data-dc-component="drop-indicator"]')).toBeNull()
    }
    finally {
      app.unmount()
      engine.dispose()
      host.remove()
    }
  })

  it('places an empty custom sort scope indicator in the dragged widget region', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const engine = createEngine()
    engine.registerWidget({
      type: 'secondary-widget',
      title: 'Secondary widget',
      group: 'test',
      defaultProps: {},
      formSchema: { sections: [] },
      defaultLayout: {
        placement: { kind: 'flow', region: 'secondary', sortScope: 'hero' },
      },
    })
    const imported = engine.importSchema(makeLayoutSchema([{ id: 'content' }]))
    if (!imported.ok)
      throw new Error(`Test schema rejected: ${imported.diagnostics.map(item => item.code).join(', ')}`)
    engine.store.setDragTarget({ sourceNodeId: null, widgetType: 'secondary-widget' })
    const app = createApp(defineComponent({
      setup: () => () => h(RootRenderer, {
        engine,
        componentMap: { 'test-widget': TestWidget, 'secondary-widget': TestWidget },
        dragOverNodeId: ref<string | null>('root'),
        dragOverIndex: ref<number | null>(0),
        activeDestination: ref({ kind: 'root' as const, sortScope: 'hero', index: 0 }),
      }),
    }))
    app.mount(host)

    try {
      const secondaryRegion = host.querySelector('[data-dc-layout-region="secondary"]')
      expect(secondaryRegion).not.toBeNull()
      expect(secondaryRegion!.querySelector('[data-dc-component="drop-indicator"]')).not.toBeNull()
    }
    finally {
      app.unmount()
      engine.dispose()
      host.remove()
    }
  })

  it('keeps a cross-region sort-scope indicator in the dragged widget region', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const engine = createEngine()
    engine.registerWidget({
      type: 'secondary-widget',
      title: 'Secondary widget',
      group: 'test',
      defaultProps: {},
      formSchema: { sections: [] },
      defaultLayout: {
        placement: { kind: 'flow', region: 'secondary', sortScope: 'shared' },
      },
    })
    const imported = engine.importSchema(makeLayoutSchema([
      { id: 'content', placement: { kind: 'flow', region: 'content', sortScope: 'shared' } },
      { id: 'secondary', placement: { kind: 'flow', region: 'secondary', sortScope: 'shared' } },
    ]))
    if (!imported.ok)
      throw new Error(`Test schema rejected: ${imported.diagnostics.map(item => item.code).join(', ')}`)
    engine.store.setDragTarget({ sourceNodeId: null, widgetType: 'secondary-widget' })
    const app = createApp(defineComponent({
      setup: () => () => h(RootRenderer, {
        engine,
        componentMap: { 'test-widget': TestWidget, 'secondary-widget': TestWidget },
        dragOverNodeId: ref<string | null>('root'),
        activeDestination: ref({ kind: 'root' as const, sortScope: 'shared', index: 0 }),
      }),
    }))
    app.mount(host)

    try {
      const contentRegion = host.querySelector('[data-dc-layout-region="content"]')
      const secondaryRegion = host.querySelector('[data-dc-layout-region="secondary"]')
      expect(contentRegion?.querySelector('[data-dc-component="drop-indicator"]')).toBeNull()
      expect(secondaryRegion?.firstElementChild?.getAttribute('data-dc-component')).toBe('drop-indicator')
    }
    finally {
      app.unmount()
      engine.dispose()
      host.remove()
    }
  })

  it('gives default chrome and layer projections their layout semantics', () => {
    const { app, host } = mountDefaultRootRenderer(makeLayoutSchema([
      {
        id: 'fixed-header',
        placement: {
          kind: 'chrome',
          edge: 'block-start',
          position: 'fixed',
          reserve: { mode: 'size', size: 48 },
        },
      },
      {
        id: 'fixed-subheader',
        placement: {
          kind: 'chrome',
          edge: 'block-start',
          position: 'fixed',
          reserve: { mode: 'size', size: 32 },
        },
      },
      {
        id: 'sticky-footer',
        placement: { kind: 'chrome', edge: 'block-end', position: 'sticky' },
      },
      {
        id: 'floating-action',
        placement: {
          kind: 'layer',
          layer: 'float',
          mode: 'framework',
          anchor: { block: 'end', inline: 'end' },
        },
      },
    ]))

    try {
      const surface = host.querySelector<HTMLElement>('[data-dc-component="canvas-surface"]')!
      const fixed = host.querySelector<HTMLElement>('[data-dc-chrome-position="fixed"]')!
      const fixedStack = fixed.closest<HTMLElement>('.dc-canvas-surface__chrome-stack--block-start[data-dc-avoid-content-stack="true"]')!
      const sticky = host.querySelector<HTMLElement>('[data-dc-chrome-position="sticky"]')!
      const layer = host.querySelector<HTMLElement>('[data-dc-layer="float"]')!
      const layerItem = host.querySelector<HTMLElement>('[data-dc-layer-mode="framework"]')!

      expect(fixed.style.position).toBe('relative')
      expect(fixedStack.style.position).toBe('absolute')
      expect(fixedStack.style.top).toBe('0px')
      expect(fixedStack.querySelectorAll('[data-dc-chrome-position="fixed"]')).toHaveLength(2)
      expect(fixed.querySelector('.test-widget')?.getAttribute('data-test-selection-plane')).toBe('viewport')
      expect(sticky.style.position).toBe('sticky')
      expect(sticky.style.bottom).toBe('0px')
      expect(sticky.querySelector('.test-widget')?.getAttribute('data-test-selection-plane')).toBe('content')
      expect(layer.style.position).toBe('absolute')
      expect(layerItem.style.position).toBe('absolute')
      expect(layerItem.dataset.dcLayerBlock).toBe('end')
      expect(layerItem.dataset.dcLayerInline).toBe('end')
      expect(surface.style.getPropertyValue('--dc-sized-inset-block-start')).toBe('calc(48px + 32px)')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('places non-fixed inline chrome in side columns around the content surface', () => {
    const { app, host } = mountDefaultRootRenderer(makeLayoutSchema([
      { id: 'content' },
      {
        id: 'sidebar',
        placement: { kind: 'chrome', edge: 'inline-start', position: 'sticky' },
      },
      {
        id: 'rail',
        placement: { kind: 'chrome', edge: 'inline-end', position: 'flow' },
      },
    ]))

    try {
      const row = host.querySelector<HTMLElement>('.dc-canvas-surface__content-row')!
      const start = row.querySelector<HTMLElement>(':scope > .dc-canvas-surface__content-edge--inline-start [data-node-id="sidebar"]')!
      const end = row.querySelector<HTMLElement>(':scope > .dc-canvas-surface__content-edge--inline-end [data-node-id="rail"]')!
      const surface = row.querySelector<HTMLElement>(':scope > .dc-canvas-surface__content')!

      expect(start.closest('.dc-canvas-surface__content-row')).toBe(row)
      expect(end.closest('.dc-canvas-surface__content-row')).toBe(row)
      expect(surface.querySelector('[data-node-id="content"]')).not.toBeNull()
      expect(start.parentElement?.style.position).toBe('sticky')
      expect(start.parentElement?.style.left).toBe('0px')
      expect(start.querySelector('.test-widget')?.getAttribute('data-test-selection-plane')).toBe('content')
      expect(end.parentElement?.style.position).toBe('relative')
      expect(end.querySelector('.test-widget')?.getAttribute('data-test-selection-plane')).toBe('content')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('does not reserve inset for chrome that opts out of content avoidance', () => {
    const { app, host } = mountDefaultRootRenderer(makeLayoutSchema([{
      id: 'overlay-header',
      placement: {
        kind: 'chrome',
        edge: 'block-start',
        position: 'fixed',
        reserve: { mode: 'measure', size: 64 },
        avoidContent: false,
      },
    }]))

    try {
      const surface = host.querySelector<HTMLElement>('[data-dc-component="canvas-surface"]')!
      const chrome = host.querySelector<HTMLElement>('[data-dc-chrome-position="fixed"]')!
      expect(chrome.dataset.dcAvoidContent).toBe('false')
      expect(surface.style.getPropertyValue('--dc-measured-inset-block-start')).toBe('0px')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('uses the shared scroll area inside inset boundaries and keeps selection above business layers', () => {
    const { app, host } = mountDefaultRootRenderer(makeLayoutSchema([{ id: 'content' }]))
    const css = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
    const surfaceRule = css.match(/\.dc-canvas-surface\s*\{[^}]*\}/)?.[0]
    const scrollportRule = css.match(/\.dc-canvas-surface__scrollport\s*\{[^}]*\}/)?.[0]
    const viewportRule = css.match(/\.dc-canvas-surface__scrollport > \[data-dc-part="viewport"\]\s*\{[^}]*\}/)?.[0]
    const scrollbarRule = css.match(/\.dc-canvas-surface__scrollport > \[data-dc-part="scrollbar"\]\s*\{[^}]*\}/)?.[0]
    const contentRowRule = css.match(/\.dc-canvas-surface__content-row\s*\{[^}]*\}/)?.[0]
    const selectionRule = css.match(/\.dc-node-selection-plane\s*\{[^}]*\}/)?.[0]

    try {
      const scrollArea = host.querySelector('.dc-canvas-surface__scrollport[data-dc-component="scroll-area"]')
      expect(scrollArea).not.toBeNull()
      expect(host.querySelectorAll('.dc-canvas-surface [data-dc-component="scroll-area"]')).toHaveLength(1)
      expect(scrollArea?.querySelector(
        ':scope > [data-dc-part="viewport"] > [data-dc-part="content"] > .dc-canvas-surface__content-layout',
      )).not.toBeNull()

      expect(surfaceRule).toContain('display: grid')
      expect(surfaceRule).toContain('grid-template-rows: var(--dc-inset-block-start)')
      expect(scrollportRule).toContain('grid-area: 2 / 2')
      expect(scrollportRule).not.toContain('overflow: auto')
      expect(scrollportRule).not.toMatch(/\bpadding(?:-block|-inline)?:/)
      expect(viewportRule).toContain('overscroll-behavior: contain')
      expect(scrollbarRule).toContain('z-index: 25')
      expect(contentRowRule).toContain('grid-template-columns: max-content minmax(0, 1fr) max-content')
      expect(selectionRule).toContain('z-index: 40')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('shares one safe schema snapshot across all rendered widgets', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const engine = createEngine()
    engine.registerWidget({
      type: 'test-widget',
      title: 'Test widget',
      group: 'test',
      defaultProps: {},
      formSchema: { sections: [] },
      mask: () => true,
      selectable: () => true,
    })
    const imported = engine.importSchema(makeLayoutSchema([
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ]))
    if (!imported.ok)
      throw new Error(`Test schema rejected: ${imported.diagnostics.map(item => item.code).join(', ')}`)
    const getSchema = vi.spyOn(engine.state, 'getSchema')
    const app = createApp(defineComponent({
      setup: () => () => h(RootRenderer, {
        engine,
        componentMap: { 'test-widget': TestWidget },
      }),
    }))
    app.mount(host)
    await nextTick()

    try {
      expect(host.querySelectorAll('[data-dc-component="node"]')).toHaveLength(3)
      expect(getSchema).toHaveBeenCalledTimes(1)
    }
    finally {
      app.unmount()
      engine.dispose()
      host.remove()
    }
  })

  it('keeps Renderer-owned behavior outside a static slot-only Container Shell', () => {
    const SlotOnlyShell = defineComponent({
      setup(_, { attrs, slots }) {
        return () => h('div', {
          'class': 'slot-only-shell',
          'data-test-attrs': Object.keys(attrs).join(','),
        }, slots.default?.())
      },
    })

    const { app, host } = mountRootRenderer(SlotOnlyShell)

    try {
      expect(host.querySelectorAll('[data-dc-component="canvas-surface"]')).toHaveLength(1)
      expect(host.querySelector('.slot-only-shell [data-dc-component="canvas-surface"]')).not.toBeNull()
      expect(host.querySelector('.slot-only-shell')?.getAttribute('data-test-attrs')).toBe('')
      expect(host.querySelectorAll('.dc-forbidden-overlay')).toHaveLength(1)
      expect(host.querySelector('.dc-renderer-frame-boundary > .dc-forbidden-overlay')).not.toBeNull()
      expect(host.querySelector('.slot-only-shell .dc-forbidden-overlay')).toBeNull()
      expect(host.querySelector('.dc-renderer-frame-boundary > [data-dc-selection-plane="root"]')).not.toBeNull()
      expect(host.querySelector('.slot-only-shell [data-dc-selection-plane="content"]')).not.toBeNull()
      expect(host.querySelector('.slot-only-shell [data-dc-selection-plane="viewport"]')).not.toBeNull()
      expect(host.querySelector('.dc-root-renderer > [data-dc-selection-plane="fallback"]')).not.toBeNull()
    }
    finally {
      app.unmount()
    }
  })

  it('switches a host-owned readonly shell ref without replacing Renderer state', async () => {
    const FirstShell = defineComponent({
      setup(_, { slots }) {
        return () => h('div', { class: 'first-shell' }, slots.default?.())
      },
    })
    const SecondShell = defineComponent({
      setup(_, { slots }) {
        return () => h('section', { class: 'second-shell' }, slots.default?.())
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const engine = createEngine()
    const imported = engine.importSchema(makeLayoutSchema([{ id: 'content' }]))
    if (!imported.ok)
      throw new Error(`Test schema rejected: ${imported.diagnostics.map(item => item.code).join(', ')}`)
    const activeShell = shallowRef<Component>(FirstShell)
    const shellSource = readonly(activeShell)
    const app = createApp(defineComponent({
      setup: () => () => h(RootRenderer, {
        engine,
        componentMap: { 'test-widget': TestWidget },
        extensions: { containerShell: shellSource },
      }),
    }))
    app.mount(host)

    try {
      const boundary = host.querySelector('[data-dc-component="renderer-frame-boundary"]')
      const schemaBefore = engine.state.getSchema()
      expect(host.querySelector('.first-shell [data-node-id="content"]')).not.toBeNull()

      activeShell.value = SecondShell
      await nextTick()

      expect(host.querySelector('.first-shell')).toBeNull()
      expect(host.querySelector('.second-shell [data-node-id="content"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-component="renderer-frame-boundary"]')).toBe(boundary)
      expect(engine.state.getSchema()).toEqual(schemaBefore)
    }
    finally {
      app.unmount()
      engine.dispose()
      host.remove()
    }
  })

  it('applies root surface styles in the default container shell', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const engine = createEngine()
    const imported = engine.importSchema({
      version: '1.0.0',
      globalConfig: {},
      root: {
        id: 'root',
        type: 'root',
        props: {},
        style: { surface: { backgroundColor: '#f6ffed' } },
        children: [],
      },
    })
    if (!imported.ok)
      throw new Error(`Test schema rejected: ${imported.diagnostics.map(item => item.code).join(', ')}`)

    const app = createApp(defineComponent({
      setup() {
        return () => h(RootRenderer, {
          engine,
          componentMap: {},
        })
      },
    }))

    try {
      app.mount(host)
      expect(host.querySelector<HTMLElement>('.dc-container-shell')?.style.backgroundColor).toBe('')
      expect(host.querySelector<HTMLElement>('.dc-canvas-surface__content')?.style.backgroundColor).toBe('#f6ffed')
      expect(host.querySelector('[data-dc-component="root-renderer"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-component="container-shell"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-component="canvas-surface"][data-dc-state="empty"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-component="empty-state"] > [data-dc-part="icon"]')).not.toBeNull()
      expect(host.querySelector('.dc-renderer-frame-boundary > [data-dc-selection-plane="root"]')).not.toBeNull()
      expect(host.querySelector('.dc-canvas-surface__content-layout > [data-dc-selection-plane="content"]')).not.toBeNull()
      expect(host.querySelector('.dc-container-shell > [data-dc-selection-plane="content"]')).toBeNull()
      expect(host.querySelector('.dc-canvas-surface > [data-dc-selection-plane="viewport"]')).not.toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })
})
