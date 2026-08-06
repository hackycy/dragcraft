// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createDesigner } from '../session/create-designer'
import DcDesigner from './DcDesigner'

function createTextDesigner() {
  let nextId = 1
  return createDesigner({
    createNodeId: () => `created-${nextId++}`,
    materials: [{
      type: 'text',
      panel: { title: 'Text' },
      presentation: { kind: 'visual', preview: defineComponent({}) },
    }],
  })
}

describe('dcDesigner', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps pan controls and scoped undo shortcuts on the cut-over workbench', async () => {
    const designer = createTextDesigner()
    designer.execute({
      type: 'create-node',
      materialType: 'text',
      to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    try {
      app.mount(host)
      await nextTick()
      const root = host.querySelector<HTMLElement>('[data-dc-component="designer"]')!
      const search = host.querySelector<HTMLInputElement>('.dc-material-panel__search-input')!
      expect(host.querySelector<HTMLButtonElement>('[data-dc-workspace-control="undo"]')!.disabled).toBe(false)

      search.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true, cancelable: true }))
      expect(designer.exportSchema()?.structure.root).toHaveLength(1)
      root.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true, cancelable: true }))
      await nextTick()
      expect(designer.exportSchema()?.structure.root).toEqual([])
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })

  it('pans the canvas stage and resets it without changing Schema', async () => {
    const designer = createTextDesigner()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    try {
      app.mount(host)
      await nextTick()
      const viewport = host.querySelector<HTMLElement>('.dc-canvas__viewport')!
      const stage = host.querySelector<HTMLElement>('[data-dc-canvas-stage]')!
      host.querySelector<HTMLButtonElement>('[data-dc-workspace-control="hand"]')!.click()
      await nextTick()
      viewport.dispatchEvent(new PointerEvent('pointerdown', {
        button: 0,
        pointerId: 1,
        clientX: 10,
        clientY: 20,
        bubbles: true,
      }))
      viewport.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: 50,
        clientY: 80,
        bubbles: true,
      }))
      await nextTick()
      expect(stage.style.getPropertyValue('--dc-internal-canvas-pan-x')).toBe('40px')
      expect(stage.style.getPropertyValue('--dc-internal-canvas-pan-y')).toBe('60px')
      host.querySelector<HTMLButtonElement>('[data-dc-workspace-control="center"]')!.click()
      await nextTick()
      expect(stage.style.getPropertyValue('--dc-internal-canvas-pan-x')).toBe('0px')
      expect(designer.exportSchema()?.structure.root).toEqual([])
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })

  it('preserves right-panel theme hooks and tab semantics', async () => {
    const designer = createDesigner({
      materials: [],
      extensions: {
        rightRailRenderer: () => h('span', { class: 'right-rail-extension' }, 'Extension'),
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    try {
      app.mount(host)
      await nextTick()
      const right = host.querySelector<HTMLElement>('[data-dc-component="right-sidebar"]')!
      const rail = right.querySelector<HTMLElement>('[data-dc-part="rail"]')!
      const globalTab = right.querySelector<HTMLButtonElement>('#dc-property-tab-global')!
      const panel = right.querySelector<HTMLElement>('#dc-property-panel-global')!
      const toggle = right.querySelector<HTMLButtonElement>('[data-dc-workspace-control="right"]')!

      expect(rail.getAttribute('role')).toBe('tablist')
      expect(rail.getAttribute('aria-label')).toBe('属性检查器')
      expect(rail.querySelector('[data-dc-part="rail-extension"] .right-rail-extension')).not.toBeNull()
      expect(globalTab.getAttribute('role')).toBe('tab')
      expect(globalTab.getAttribute('aria-controls')).toBe('dc-property-panel-global')
      expect(panel.getAttribute('aria-labelledby')).toBe('dc-property-tab-global')
      expect(toggle.getAttribute('aria-label')).toBe(toggle.title)
      expect(toggle.getAttribute('aria-label')).not.toBe('')
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })
})
