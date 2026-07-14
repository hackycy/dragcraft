// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useNodeInteractionGeometry } from './useNodeInteractionGeometry'

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

describe('useNodeInteractionGeometry', () => {
  beforeEach(() => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('uses the overlay boundary width for root-owned nodes', async () => {
    const viewport = mockElement({ top: 120, left: 410, right: 790, bottom: 700, width: 380, height: 580 })
    viewport.setAttribute('data-dc-overlay-boundary', '')
    const host = mockElement({ top: 220, left: 420, right: 780, bottom: 278, width: 360, height: 58 })
    viewport.appendChild(host)

    const { geometry, update } = useNodeInteractionGeometry(ref(host), ref(true), {
      mode: 'root-band',
      boundarySelector: '[data-dc-overlay-boundary]',
    })

    await nextTick()
    update()

    expect(geometry.value.visibleRect).toEqual({
      top: 220,
      right: 790,
      bottom: 278,
      left: 410,
      width: 380,
      height: 58,
    })
  })

  it('uses the visible wrapper border box for container-owned nodes', async () => {
    const viewport = mockElement({ top: 120, left: 410, right: 790, bottom: 700, width: 380, height: 580 })
    viewport.setAttribute('data-dc-overlay-boundary', '')
    const host = mockElement({ top: 220, left: 450, right: 610, bottom: 278, width: 160, height: 58 })
    viewport.appendChild(host)

    const { geometry, update } = useNodeInteractionGeometry(ref(host), ref(true), {
      mode: 'node-box',
      boundarySelector: '[data-dc-overlay-boundary]',
    })

    await nextTick()
    update()

    expect(geometry.value.visibleRect).toEqual({
      top: 220,
      right: 610,
      bottom: 278,
      left: 450,
      width: 160,
      height: 58,
    })
  })

  it('clips a container-owned node to its visible overlap', async () => {
    const viewport = mockElement({ top: 120, left: 410, right: 790, bottom: 700, width: 380, height: 580 })
    viewport.setAttribute('data-dc-overlay-boundary', '')
    const host = mockElement({ top: 90, left: 390, right: 480, bottom: 150, width: 90, height: 60 })
    viewport.appendChild(host)

    const { geometry, update } = useNodeInteractionGeometry(ref(host), ref(true), {
      mode: 'node-box',
      boundarySelector: '[data-dc-overlay-boundary]',
    })

    await nextTick()
    update()

    expect(geometry.value.visibleRect).toEqual({
      top: 120,
      right: 480,
      bottom: 150,
      left: 410,
      width: 70,
      height: 30,
    })
  })

  it('derives the paint rect from the shared visible rect', async () => {
    const host = mockElement({ top: 220, left: 450, right: 610, bottom: 278, width: 160, height: 58 })
    document.body.appendChild(host)

    const { geometry, update } = useNodeInteractionGeometry(ref(host), ref(true), {
      mode: 'node-box',
      paintInset: 1,
    })

    await nextTick()
    update()

    expect(geometry.value.paintRect).toEqual({
      top: 221,
      right: 609,
      bottom: 277,
      left: 451,
      width: 158,
      height: 56,
    })
  })

  it.each([
    { width: 0, height: 40, right: 100, bottom: 140 },
    { width: 40, height: 0, right: 140, bottom: 100 },
  ])('hides a zero-sized node box', async (rect) => {
    const host = mockElement(rect)
    document.body.appendChild(host)
    const { geometry, update } = useNodeInteractionGeometry(ref(host), ref(true), {
      mode: 'node-box',
    })

    await nextTick()
    update()

    expect(geometry.value.visible).toBe(false)
  })

  it('uses the material surface only for self-positioned root layers', async () => {
    const viewport = mockElement({ top: 120, left: 410, right: 790, bottom: 700, width: 380, height: 580 })
    viewport.setAttribute('data-dc-overlay-boundary', '')
    const host = mockElement({ top: 120, left: 410, right: 790, bottom: 700, width: 380, height: 580 })
    host.dataset.dcLayerMode = 'self'
    const surface = mockElement({ top: 520, left: 720, right: 772, bottom: 572, width: 52, height: 52 })
    surface.setAttribute('data-dc-node-surface', '')
    viewport.appendChild(host)
    host.appendChild(surface)

    const { geometry, update } = useNodeInteractionGeometry(ref(host), ref(true), {
      mode: 'root-band',
      boundarySelector: '[data-dc-overlay-boundary]',
      selfTargetSelector: '[data-dc-node-surface]',
    })

    await nextTick()
    update()

    expect(geometry.value.visibleRect).toMatchObject({
      top: 520,
      left: 410,
      width: 380,
      height: 52,
    })
  })
})
