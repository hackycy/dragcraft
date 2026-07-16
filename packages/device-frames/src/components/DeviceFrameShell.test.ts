// @vitest-environment happy-dom
import type { LayoutPlan } from '@dragcraft/core'
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
    expect(wrapper.find('.dc-device-frame__content-scroller [data-dc-selection-plane="content"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__viewport > [data-dc-selection-plane="viewport"]').exists()).toBe(true)
    expect(registerPlane).toHaveBeenCalledWith('content', expect.any(HTMLElement))
    expect(registerPlane).toHaveBeenCalledWith('viewport', expect.any(HTMLElement))
  })

  it('reserves the complete chrome wrapper plus block selection gutters', async () => {
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      const height = this.classList.contains('dc-node') ? 46 : 44
      return {
        top: 0,
        right: 369,
        bottom: height,
        left: 0,
        width: 369,
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
      expect(style).toContain('--dc-selection-gutter-block-start: var(--dc-node-selection-root-block-overlap)')
      expect(style).toContain('--dc-selection-gutter-block-end: var(--dc-node-selection-root-block-overlap)')
    }
    finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
      wrapper.unmount()
    }
  })
})
