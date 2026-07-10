// @vitest-environment happy-dom
import type { DesignerSchema, WidgetMeta } from '..'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
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
      expect(host.querySelector('.dc-canvas-controls__history[role="toolbar"]')).not.toBeNull()
      expect(host.querySelector('.dc-toolbar')).toBeNull()
      expect(host.querySelector('.dc-left-sidebar__rail')).not.toBeNull()
      expect(host.querySelector('.dc-right-sidebar__rail')).not.toBeNull()
      expect(host.querySelector('.dc-property-panel__header')).toBeNull()
      expect(host.querySelector('.dc-device-picker')).toBeNull()
      expect(host.querySelector('[data-dc-workspace-control="pointer"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-workspace-control="hand"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-workspace-control="center"]')).not.toBeNull()
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
