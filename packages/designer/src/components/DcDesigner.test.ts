// @vitest-environment happy-dom
import type { Component } from 'vue'
import type { DesignerSchema, DesignerWidgetMeta, WidgetMeta } from '..'
import { ContainerRegionOutlet } from '@dragcraft/renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createDesigner } from '..'
import DcDesigner from './DcDesigner'

function makeMeta(): WidgetMeta {
  return {
    type: 'button',
    title: 'Button',
    group: 'basic',
    defaultProps: {},
    formSchema: { sections: [] },
  } as WidgetMeta
}

function makeSchema(): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: {},
    root: {
      id: 'root',
      type: 'root',
      props: {},
      children: [],
    },
  }
}

async function flushFocus(): Promise<void> {
  await nextTick()
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 10))
}

function dispatchDragEvent(target: Element, type: string): void {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
      setDragImage: vi.fn(),
    },
  })
  target.dispatchEvent(event)
}

describe('dcDesigner', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders canvas-scoped interaction and floating history controls without a top toolbar', async () => {
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      widgetMetas: [makeMeta()],
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(DcDesigner, { instance: designer }),
    })

    try {
      app.mount(host)
      await nextTick()

      expect(host.querySelector('[data-dc-canvas-interaction-layer]')).not.toBeNull()
      expect(host.querySelector('[data-dc-canvas-stage]')).not.toBeNull()
      expect(host.querySelector('.dc-canvas-controls__history[role="toolbar"]')).not.toBeNull()
      expect(host.querySelector('.dc-toolbar')).toBeNull()
      expect(host.querySelector('.dc-left-sidebar__rail')).not.toBeNull()
      expect(host.querySelector('.dc-right-sidebar__rail')).not.toBeNull()
      expect(host.querySelector('.dc-property-panel__header')).toBeNull()
      expect(host.querySelector('.dc-device-picker')).toBeNull()
      expect(host.querySelector('[data-dc-workspace-control="pointer"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-workspace-control="hand"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-workspace-control="center"]')).not.toBeNull()
      const root = host.querySelector<HTMLElement>('[data-dc-component="designer"]')
      expect(root?.dataset.dcState?.split(' ')).toContain('compact')
      expect(root?.style.getPropertyValue('--_dc-workspace-left-width')).toBe('280px')
      expect(root?.querySelector(':scope > [data-dc-part="body"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-component="canvas-controls"] [data-dc-part="toolbar"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-component="material-panel"] [data-dc-part="search-input"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-component="material-panel"] [data-dc-part="search-icon"] svg')).not.toBeNull()
      const materialGroup = host.querySelector<HTMLElement>('[data-dc-component="material-group"]')
      const materialGroupHeader = materialGroup?.querySelector<HTMLButtonElement>(':scope > [data-dc-part="header"]')
      expect(materialGroupHeader?.querySelector('[data-dc-part="toggle"] svg')).not.toBeNull()
      materialGroupHeader?.click()
      await nextTick()
      expect(materialGroup?.getAttribute('data-dc-state')).toBe('collapsed')
      expect(materialGroup?.querySelector('[data-dc-part="toggle"]')?.classList.contains('dc-material-group__toggle--collapsed')).toBe(true)
      expect(host.querySelector('[data-dc-component="property-panel"] > [data-dc-part="content"]')).not.toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('wires container outlet destinations through the designer canvas', async () => {
    const splitMeta: DesignerWidgetMeta = {
      type: 'split-layout',
      title: 'Split',
      group: 'layout',
      defaultProps: {},
      formSchema: { sections: [] },
      container: {
        defaultVariant: 'split',
        variants: {
          split: {
            title: 'Split',
            regions: [{ id: 'left', title: 'Left' }],
          },
        },
      },
      containerAdapter: { resolveDropIndex: () => 0 },
    }
    const imageMeta: DesignerWidgetMeta = {
      type: 'image',
      title: 'Image',
      group: 'content',
      defaultProps: { src: 'test.png' },
      formSchema: { sections: [] },
    }
    const SplitComponent = defineComponent({
      setup: () => () => h(ContainerRegionOutlet, {
        regionId: 'left',
        class: 'designer-test-region',
      }),
    })
    const componentMap: Record<string, Component> = {
      'split-layout': SplitComponent,
      'image': defineComponent({ setup: () => () => h('img') }),
    }
    const designer = createDesigner({
      engineOptions: {
        initialSchema: {
          version: '1.0.0',
          globalConfig: {},
          root: {
            id: 'root',
            type: 'root',
            props: {},
            children: [{
              id: 'layout',
              type: 'split-layout',
              props: {},
              container: { variant: 'split', regions: { left: [] } },
            }],
          },
        },
      },
      widgetMetas: [splitMeta, imageMeta],
      componentMap,
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()
      const material = Array.from(host.querySelectorAll<HTMLElement>('.dc-material-item'))
        .find(item => item.textContent?.includes('Image'))!
      const region = host.querySelector<HTMLElement>('.designer-test-region')!

      dispatchDragEvent(material, 'dragstart')
      dispatchDragEvent(region, 'dragover')
      dispatchDragEvent(region, 'drop')
      await nextTick()

      expect(designer.engine.state.getNodeById('layout')!.container!.regions.left[0])
        .toMatchObject({ type: 'image', props: { src: 'test.png' } })
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('pans the canvas stage freely and resets it to the center origin', async () => {
    const designer = createDesigner({ engineOptions: { initialSchema: makeSchema() } })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()
      const viewport = host.querySelector<HTMLElement>('.dc-canvas__viewport')!
      const stage = host.querySelector<HTMLElement>('[data-dc-canvas-stage]')!
      const hand = host.querySelector<HTMLButtonElement>('[data-dc-workspace-control="hand"]')!
      const reset = host.querySelector<HTMLButtonElement>('[data-dc-workspace-control="center"]')!

      hand.click()
      await nextTick()
      viewport.dispatchEvent(new PointerEvent('pointerdown', {
        button: 0,
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
        cancelable: true,
      }))
      viewport.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: -120,
        clientY: 260,
        bubbles: true,
        cancelable: true,
      }))
      await nextTick()

      expect(stage.style.getPropertyValue('--_dc-canvas-pan-x')).toBe('-220px')
      expect(stage.style.getPropertyValue('--_dc-canvas-pan-y')).toBe('160px')
      expect(viewport.scrollLeft).toBe(0)
      expect(viewport.scrollTop).toBe(0)

      reset.click()
      await nextTick()

      expect(stage.style.getPropertyValue('--_dc-canvas-pan-x')).toBe('0px')
      expect(stage.style.getPropertyValue('--_dc-canvas-pan-y')).toBe('0px')
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('shrink-wraps the canvas stage when the container shell declares a toolbar boundary', async () => {
    const BoundaryShell = defineComponent({
      setup(_, { slots }) {
        return () => h('div', { 'data-dc-toolbar-boundary': '' }, slots.default?.())
      },
    })
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      extensions: {
        rendererExtensions: {
          containerShell: BoundaryShell,
        },
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()
      await nextTick()

      expect(host.querySelector('.dc-canvas__content')?.classList)
        .toContain('dc-canvas__content--bounded')
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('renders optional host controls only in sidebar rails', async () => {
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      extensions: {
        leftRailRenderer: () => h('button', { class: 'host-left-rail-control' }, 'Left'),
        rightRailRenderer: () => h('button', { class: 'host-right-rail-control' }, 'Right'),
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()

      expect(host.querySelector('.dc-canvas-controls__extension')).toBeNull()
      expect(host.querySelector('.dc-left-sidebar__rail .host-left-rail-control')).not.toBeNull()
      expect(host.querySelector('.dc-right-sidebar__rail .host-right-rail-control')).not.toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('handles scoped history shortcuts without intercepting form inputs', async () => {
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      widgetMetas: [makeMeta()],
    })
    const undo = vi.spyOn(designer.engine.history, 'undo')
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()
      const root = host.querySelector('.dc-designer')!
      const search = host.querySelector('.dc-material-panel__search-input')!

      root.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true, cancelable: true }))
      search.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true, cancelable: true }))

      expect(undo).toHaveBeenCalledTimes(1)
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('reactively enables the built-in undo control', async () => {
    const designer = createDesigner({ engineOptions: { initialSchema: makeSchema() } })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()
      const undo = host.querySelector<HTMLButtonElement>('[data-dc-workspace-control="undo"]')!
      expect(undo.disabled).toBe(true)

      designer.engine.history.pushSnapshot('test', designer.engine.state.getSchema())
      await nextTick()

      expect(undo.disabled).toBe(false)
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('moves focus into compact drawers and restores it after Escape', async () => {
    const designer = createDesigner({ engineOptions: { initialSchema: makeSchema() } })
    designer.workspace.setMode('compact')
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()

      const leftControl = host.querySelector<HTMLButtonElement>('[data-dc-workspace-control="left"]')!
      const rightControl = host.querySelector<HTMLButtonElement>('[data-dc-workspace-control="right"]')!

      leftControl.click()
      await flushFocus()
      const leftPanel = host.querySelector<HTMLElement>('.dc-designer__panel--left')!
      expect(leftPanel.contains(document.activeElement)).toBe(true)

      rightControl.click()
      await flushFocus()
      const rightPanel = host.querySelector<HTMLElement>('.dc-designer__panel--right')!
      expect(designer.workspace.leftOpen.value).toBe(false)
      expect(designer.workspace.rightOpen.value).toBe(true)
      expect(rightPanel.contains(document.activeElement)).toBe(true)
      expect(host.querySelector('[data-dc-component="designer"]')?.getAttribute('data-dc-state')).toContain('compact')
      expect(host.querySelector('[data-dc-component="designer"] [data-dc-part="backdrop"]')).not.toBeNull()

      rightPanel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
      await flushFocus()
      expect(designer.workspace.rightOpen.value).toBe(false)
      expect(document.activeElement).toBe(rightControl)
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })
})
