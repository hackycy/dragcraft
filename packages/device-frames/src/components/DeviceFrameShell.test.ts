// @vitest-environment happy-dom
import type { LayoutPlan } from '@dragcraft/core'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import DeviceFrameShell from './DeviceFrameShell'

function makePlan(): LayoutPlan {
  return {
    entries: [],
    regions: new Map(),
    sortScopes: new Map(),
    chrome: [
      {
        node: { id: 'nav', type: 'navbar', props: {} },
        arrayIndex: 0,
        layout: {
          placement: {
            kind: 'chrome',
            edge: 'block-start',
            position: 'fixed',
            reserve: { mode: 'measure' },
            avoidContent: true,
          },
          sortScope: false,
          visible: true,
        },
      },
      {
        node: { id: 'tab', type: 'tabbar', props: {} },
        arrayIndex: 1,
        layout: {
          placement: {
            kind: 'chrome',
            edge: 'block-end',
            position: 'fixed',
            reserve: { mode: 'size', size: 50 },
            avoidContent: true,
          },
          sortScope: false,
          visible: true,
        },
      },
    ],
    layers: new Map([
      ['float', [
        {
          node: { id: 'fab', type: 'fab', props: {} },
          arrayIndex: 2,
          layout: {
            placement: {
              kind: 'layer',
              layer: 'float',
              mode: 'framework',
              anchor: { block: 'end', inline: 'end' },
              avoid: ['safe-area', 'chrome'],
            },
            sortScope: false,
            visible: true,
          },
        },
        {
          node: { id: 'custom', type: 'custom-float', props: {} },
          arrayIndex: 3,
          layout: {
            placement: {
              kind: 'layer',
              layer: 'float',
              mode: 'self',
              anchor: { block: 'end', inline: 'end' },
              avoid: ['safe-area', 'chrome'],
            },
            sortScope: false,
            visible: true,
          },
        },
      ]],
    ]),
    insets: {
      contributors: [
        { edge: 'block-start', sourceNodeId: 'nav', reserve: { mode: 'measure' } },
        { edge: 'block-end', sourceNodeId: 'tab', reserve: { mode: 'size', size: 50 } },
      ],
    },
  }
}

describe('deviceFrameShell', () => {
  it('keeps the declared device viewport width available to root material', () => {
    const css = readFileSync(path.resolve(process.cwd(), 'src/styles/device-frame.css'), 'utf8')
    const frameRule = css.match(/\.dc-device-frame\s*\{[^}]*\}/)?.[0]
    const frameBorderRule = css.match(/\.dc-device-frame::after\s*\{[^}]*\}/)?.[0]
    const frameSurfaceRule = css.match(/\.dc-device-frame__surface\s*\{[^}]*\}/)?.[0]
    const surfaceRule = css.match(/\.dc-device-frame__content-surface\s*\{[^}]*\}/)?.[0]
    const viewportRule = css.match(/\.dc-device-frame__viewport\s*\{[^}]*\}/)?.[0]
    const chromeRule = css.match(/\.dc-device-frame__chrome\s*\{[^}]*\}/)?.[0]
    const blockStartRule = css.match(/\.dc-device-frame__chrome--block-start\s*\{[^}]*\}/)?.[0]
    const blockEndRule = css.match(/\.dc-device-frame__chrome--block-end\s*\{[^}]*\}/)?.[0]
    const layerRule = css.match(/\.dc-device-frame__layer\s*\{[^}]*\}/)?.[0]

    expect(frameRule).toContain('box-sizing: content-box')
    expect(frameRule).toContain('border: 0')
    expect(frameRule).toContain('overflow: visible')
    expect(frameRule).not.toMatch(/\bpadding(?:-block|-inline)?:/)
    expect(frameBorderRule).toContain('box-sizing: border-box')
    expect(frameBorderRule).toContain('inset: calc(-1 * var(--dc-device-frame-border-width))')
    expect(frameBorderRule).toContain('border: var(--dc-device-frame-border-width) solid var(--dc-device-frame-border-color)')
    expect(frameSurfaceRule).toContain('overflow: hidden')
    expect(frameSurfaceRule).toContain('border-radius: calc(var(--dc-device-frame-radius) - var(--dc-device-frame-border-width))')
    expect(surfaceRule).toContain('min-height: 100%')
    expect(surfaceRule).toContain('box-sizing: border-box')
    expect(surfaceRule).not.toMatch(/\bpadding(?:-block|-inline)?:/)
    expect(viewportRule).not.toContain('--dc-selection-gutter')
    expect(viewportRule).toContain('--dc-inset-inline-start: calc(var(--dc-safe-area-inline-start) +')
    expect(viewportRule).toContain('--dc-inset-inline-end: calc(var(--dc-safe-area-inline-end) +')
    expect(chromeRule).toContain('inset: 0;')
    expect(blockStartRule).toContain('top: 0;')
    expect(blockEndRule).toContain('bottom: 0;')
    expect(layerRule).toContain('inset: 0;')
  })

  it('renders content, fixed chrome, and layer nodes from the layout plan', () => {
    const registerPlane = vi.fn()
    const wrapper = mount(DeviceFrameShell, {
      props: {
        selectionPresentation: { registerPlane },
        layoutPlan: makePlan(),
        schema: {
          version: '1.0.0',
          globalConfig: {},
          root: {
            id: 'root',
            type: 'root',
            props: {},
            style: { surface: { backgroundColor: '#fff7e6' } },
            children: [],
          },
        },
        chromeVNodes: [
          h('div', { 'data-test-id': 'nav' }, 'nav'),
          h('div', { 'data-test-id': 'tab' }, 'tab'),
        ],
        layerVNodes: {
          float: [
            h('button', { 'data-test-id': 'fab' }, 'fab'),
            h('button', { 'data-test-id': 'custom' }, 'custom'),
          ],
        },
        forbiddenOverlayVNode: h('div', { 'class': 'dc-forbidden-overlay', 'data-test-id': 'forbidden' }, 'blocked'),
      },
      slots: {
        default: '<div data-test-id="content">content</div>',
      },
    })

    expect(wrapper.find('.dc-device-frame__content [data-test-id="content"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame > .dc-device-frame__surface').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__surface > .dc-device-frame__viewport').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__content-scroller [data-test-id="content"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__content-surface [data-test-id="content"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__content').classes()).not.toContain('dc-container-shell')
    expect(wrapper.find<HTMLElement>('.dc-device-frame__content').element.style.backgroundColor).toBe('#fff7e6')
    expect(wrapper.find<HTMLElement>('.dc-device-frame__content-scroller').element.style.backgroundColor).toBe('#fff7e6')
    expect(wrapper.find<HTMLElement>('.dc-device-frame__content-surface').element.style.backgroundColor).toBe('#fff7e6')
    expect(wrapper.find('.dc-device-frame__scrollbar').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__viewport').attributes()).toHaveProperty('data-dc-overlay-boundary')
    expect(wrapper.find('.dc-device-frame__chrome--block-start [data-test-id="nav"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__chrome--block-end [data-test-id="tab"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__layer-item--framework [data-test-id="fab"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__layer-item--self [data-test-id="custom"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__viewport').attributes('style')).toContain('--dc-sized-inset-block-end: 50px')
    expect(wrapper.find('.dc-device-frame').attributes()).toHaveProperty('data-dc-toolbar-boundary')
    expect(wrapper.find('.dc-device-frame > .dc-forbidden-overlay[data-test-id="forbidden"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__content-surface .dc-forbidden-overlay').exists()).toBe(false)
    expect(wrapper.find('.dc-device-frame > [data-dc-selection-plane="root"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__content-scroller [data-dc-selection-plane="content"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__viewport > [data-dc-selection-plane="viewport"]').exists()).toBe(true)
    expect(registerPlane).toHaveBeenCalledWith('root', expect.any(HTMLElement))
    expect(registerPlane).toHaveBeenCalledWith('content', expect.any(HTMLElement))
    expect(registerPlane).toHaveBeenCalledWith('viewport', expect.any(HTMLElement))
  })

  it('reserves the complete chrome wrapper without selection gutters', async () => {
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      const height = this.classList.contains('dc-node') ? 46 : 44
      return {
        top: 0,
        right: 375,
        bottom: height,
        left: 0,
        width: 375,
        height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect
    }

    const wrapper = mount(DeviceFrameShell, {
      props: {
        layoutPlan: makePlan(),
        schema: {
          version: '1.0.0',
          globalConfig: {},
          root: { id: 'root', type: 'root', props: {}, children: [] },
        },
        chromeVNodes: [
          h('div', { class: 'dc-node' }, [h('div', 'nav')]),
          h('div', { class: 'dc-node' }, [h('div', 'tab')]),
        ],
      },
    })

    try {
      await nextTick()
      await vi.waitFor(() => {
        const viewport = wrapper.find<HTMLElement>('.dc-device-frame__viewport').element
        expect(viewport.style.getPropertyValue('--dc-measured-inset-block-start')).toBe('46px')
      })

      const style = wrapper.find('.dc-device-frame__viewport').attributes('style')
      expect(style).not.toContain('--dc-selection-gutter')
    }
    finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
      wrapper.unmount()
    }
  })
})
