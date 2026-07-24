// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useToolbarPosition } from './useToolbarPosition'

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

describe('useToolbarPosition', () => {
  beforeEach(() => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('stays hidden until reference, floating element, and active state are present', async () => {
    const reference = ref<HTMLElement | null>(null)
    const floating = ref<HTMLElement | null>(null)
    const active = ref(false)
    const { position, update } = useToolbarPosition(reference, floating, active)

    await update()

    expect(position.value.visible).toBe(false)
  })

  it('positions a measured toolbar on the selected node left edge', async () => {
    const referenceEl = mockElement()
    const floatingEl = mockElement({ top: 0, left: 0, right: 36, bottom: 150, width: 36, height: 150 })
    document.body.append(referenceEl, floatingEl)
    const reference = ref<HTMLElement | null>(referenceEl)
    const floating = ref<HTMLElement | null>(floatingEl)
    const active = ref(true)
    const { position, update } = useToolbarPosition(reference, floating, active)

    await nextTick()
    await update()

    expect(position.value.visible).toBe(true)
    expect(position.value).toMatchObject({
      x: 56,
      y: 100,
      placement: 'left-start',
      orientation: 'vertical',
    })
  })

  it('anchors to the owning frame edge and only clamps vertically', async () => {
    const frame = mockElement({ top: 40, left: 80, right: 480, bottom: 640, width: 400, height: 600 })
    frame.setAttribute('data-dc-toolbar-boundary', '')
    const referenceEl = mockElement({ top: 260, left: 140, right: 440, bottom: 340, width: 300, height: 80 })
    const floatingEl = mockElement({ top: 0, left: 0, right: 36, bottom: 150, width: 36, height: 150 })
    const interactionBoundary = mockElement({ top: 100, left: 0, right: 600, bottom: 400, width: 600, height: 300 })
    frame.appendChild(referenceEl)
    document.body.append(interactionBoundary, frame, floatingEl)
    const { position, update } = useToolbarPosition(
      ref(referenceEl),
      ref(floatingEl),
      ref(true),
      {
        boundarySelector: '[data-dc-toolbar-boundary]',
        interactionBoundary: ref(interactionBoundary),
      },
    )

    await nextTick()
    await update()

    expect(position.value).toMatchObject({
      x: 36,
      y: 242,
      placement: 'left-start',
      orientation: 'vertical',
      visible: true,
    })
  })

  it('hides when the node is outside the provided interaction boundary', async () => {
    const referenceEl = mockElement({ top: 500, bottom: 600 })
    const floatingEl = mockElement({ top: 0, left: 0, right: 36, bottom: 150, width: 36, height: 150 })
    const boundaryEl = mockElement({ top: 0, left: 0, right: 400, bottom: 300, width: 400, height: 300 })
    document.body.append(boundaryEl, referenceEl, floatingEl)
    const active = ref(true)
    const { position, update } = useToolbarPosition(
      ref(referenceEl),
      ref(floatingEl),
      active,
      { interactionBoundary: ref(boundaryEl) },
    )

    await nextTick()
    await update()

    expect(position.value.visible).toBe(false)
  })

  it('hides when the shared interaction geometry is not visible', async () => {
    const referenceEl = mockElement()
    const floatingEl = mockElement({ top: 0, left: 0, right: 100, bottom: 36, width: 100, height: 36 })
    document.body.append(referenceEl, floatingEl)
    const interactionGeometry = ref({
      visible: false,
      visibleRect: { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 },
      paintRect: { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 },
    })
    const { position, update } = useToolbarPosition(ref(referenceEl), ref(floatingEl), ref(true), {
      interactionGeometry,
      placement: 'top-end',
      orientation: 'horizontal',
    })

    await nextTick()
    await update()

    expect(position.value.visible).toBe(false)
  })

  it('uses the configured interaction surface for self-positioned layer hosts', async () => {
    const host = mockElement({ top: 0, left: 0, right: 500, bottom: 700, width: 500, height: 700 })
    host.dataset.dcLayerMode = 'self'
    const surface = mockElement({ top: 120, left: 200, right: 260, bottom: 180, width: 60, height: 60 })
    surface.setAttribute('data-dc-node-surface', '')
    const floatingEl = mockElement({ top: 0, left: 0, right: 36, bottom: 100, width: 36, height: 100 })
    host.appendChild(surface)
    document.body.append(host, floatingEl)
    const { position, update } = useToolbarPosition(
      ref(host),
      ref(floatingEl),
      ref(true),
      { selfTargetSelector: '[data-dc-node-surface]' },
    )

    await nextTick()
    await update()

    expect(position.value).toMatchObject({
      x: 156,
      y: 120,
      placement: 'left-start',
      visible: true,
    })
  })

  it('places a horizontal toolbar above the visible container-owned node box', async () => {
    const referenceEl = mockElement({ top: 200, left: 180, right: 320, bottom: 260, width: 140, height: 60 })
    const floatingEl = mockElement({ top: 0, left: 0, right: 120, bottom: 36, width: 120, height: 36 })
    const boundaryEl = mockElement({ top: 0, left: 0, right: 400, bottom: 500, width: 400, height: 500 })
    document.body.append(boundaryEl, referenceEl, floatingEl)
    const interactionGeometry = ref({
      visible: true,
      visibleRect: { top: 200, right: 320, bottom: 260, left: 180, width: 140, height: 60 },
      paintRect: { top: 201, right: 319, bottom: 259, left: 181, width: 138, height: 58 },
    })
    const { position, update } = useToolbarPosition(ref(referenceEl), ref(floatingEl), ref(true), {
      interactionBoundary: ref(boundaryEl),
      interactionGeometry,
      placement: 'top-end',
      orientation: 'horizontal',
    })

    await nextTick()
    await update()

    expect(position.value).toMatchObject({
      x: 200,
      y: 156,
      placement: 'top-end',
      orientation: 'horizontal',
      visible: true,
    })
  })

  it('flips a container-owned toolbar below and shifts it into the viewport', async () => {
    const referenceEl = mockElement({ top: 10, left: 360, right: 410, bottom: 50, width: 50, height: 40 })
    const floatingEl = mockElement({ top: 0, left: 0, right: 120, bottom: 36, width: 120, height: 36 })
    const boundaryEl = mockElement({ top: 0, left: 0, right: 400, bottom: 300, width: 400, height: 300 })
    document.body.append(boundaryEl, referenceEl, floatingEl)
    const interactionGeometry = ref({
      visible: true,
      visibleRect: { top: 10, right: 400, bottom: 50, left: 360, width: 40, height: 40 },
      paintRect: { top: 11, right: 399, bottom: 49, left: 361, width: 38, height: 38 },
    })
    const { position, update } = useToolbarPosition(ref(referenceEl), ref(floatingEl), ref(true), {
      interactionBoundary: ref(boundaryEl),
      interactionGeometry,
      placement: 'top-end',
      orientation: 'horizontal',
    })

    await nextTick()
    await update()

    expect(position.value).toMatchObject({
      x: 272,
      y: 58,
      placement: 'bottom-end',
      orientation: 'horizontal',
      visible: true,
    })
  })
})
