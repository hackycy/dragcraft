// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useBlockOverlayGeometry } from './useBlockOverlayGeometry'

function mockElement(rect: Partial<DOMRect> = {}): HTMLElement {
  const el = document.createElement('div')
  el.getBoundingClientRect = vi.fn(() => ({
    top: 100,
    left: 100,
    right: 200,
    bottom: 200,
    width: 100,
    height: 100,
    x: 100,
    y: 100,
    toJSON: () => {},
    ...rect,
  }))
  return el
}

describe('useBlockOverlayGeometry', () => {
  beforeEach(() => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses the overlay boundary for width and the node host for height', async () => {
    const viewport = mockElement({ top: 120, left: 410, right: 790, bottom: 700, width: 380, height: 580 })
    viewport.setAttribute('data-dc-overlay-boundary', '')
    const host = mockElement({ top: 220, left: 420, right: 780, bottom: 278, width: 360, height: 58 })
    const surface = mockElement({ top: 238, left: 460, right: 540, bottom: 258, width: 80, height: 20 })
    surface.setAttribute('data-dc-node-surface', '')
    viewport.appendChild(host)
    host.appendChild(surface)

    const { geometry, update } = useBlockOverlayGeometry(ref(host), ref(true), {
      boundarySelector: '[data-dc-overlay-boundary]',
      selfTargetSelector: '[data-dc-node-surface]',
    })

    await nextTick()
    update()

    expect(geometry.value.visible).toBe(true)
    expect(geometry.value.left).toBe(410)
    expect(geometry.value.width).toBe(380)
    expect(geometry.value.top).toBe(220)
    expect(geometry.value.height).toBe(58)
  })

  it('clips the overlay to the maximum visible overlap with the boundary', async () => {
    const viewport = mockElement({ top: 120, left: 410, right: 790, bottom: 700, width: 380, height: 580 })
    viewport.setAttribute('data-dc-overlay-boundary', '')
    const host = mockElement({ top: 90, left: 420, right: 780, bottom: 150, width: 360, height: 60 })
    viewport.appendChild(host)

    const { geometry, update } = useBlockOverlayGeometry(ref(host), ref(true), {
      boundarySelector: '[data-dc-overlay-boundary]',
    })

    await nextTick()
    update()

    expect(geometry.value.visible).toBe(true)
    expect(geometry.value.left).toBe(410)
    expect(geometry.value.width).toBe(380)
    expect(geometry.value.top).toBe(120)
    expect(geometry.value.height).toBe(30)
  })

  it('insets the paint rect so the interaction stroke remains inside the visible boundary', async () => {
    const viewport = mockElement({ top: 120, left: 410, right: 790, bottom: 700, width: 380, height: 580 })
    viewport.setAttribute('data-dc-overlay-boundary', '')
    const host = mockElement({ top: 220, left: 420, right: 780, bottom: 278, width: 360, height: 58 })
    viewport.appendChild(host)

    const { geometry, update } = useBlockOverlayGeometry(ref(host), ref(true), {
      boundarySelector: '[data-dc-overlay-boundary]',
      paintInset: 1,
    })

    await nextTick()
    update()

    expect(geometry.value).toEqual({
      top: 221,
      left: 411,
      width: 378,
      height: 56,
      visible: true,
    })
  })

  it('preserves a drawable rect when the visible target is thinner than twice the paint inset', async () => {
    const host = mockElement({ top: 100, left: 100, right: 101, bottom: 101, width: 1, height: 1 })
    document.body.appendChild(host)

    try {
      const { geometry, update } = useBlockOverlayGeometry(ref(host), ref(true), { paintInset: 1 })

      await nextTick()
      update()

      expect(geometry.value).toEqual({
        top: 100,
        left: 100,
        width: 1,
        height: 1,
        visible: true,
      })
    }
    finally {
      host.remove()
    }
  })

  it('uses the surface only for self-positioned layer planes', async () => {
    const viewport = mockElement({ top: 120, left: 410, right: 790, bottom: 700, width: 380, height: 580 })
    viewport.setAttribute('data-dc-overlay-boundary', '')
    const host = mockElement({ top: 120, left: 410, right: 790, bottom: 700, width: 380, height: 580 })
    host.dataset.dcLayerMode = 'self'
    const surface = mockElement({ top: 520, left: 720, right: 772, bottom: 572, width: 52, height: 52 })
    surface.setAttribute('data-dc-node-surface', '')
    viewport.appendChild(host)
    host.appendChild(surface)

    const { geometry, update } = useBlockOverlayGeometry(ref(host), ref(true), {
      boundarySelector: '[data-dc-overlay-boundary]',
      selfTargetSelector: '[data-dc-node-surface]',
    })

    await nextTick()
    update()

    expect(geometry.value.visible).toBe(true)
    expect(geometry.value.left).toBe(410)
    expect(geometry.value.width).toBe(380)
    expect(geometry.value.top).toBe(520)
    expect(geometry.value.height).toBe(52)
  })
})
