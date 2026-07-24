// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'
import {
  CANVAS_ZOOM_MAX,
  CANVAS_ZOOM_MIN,
  resolveCanvasFitScale,
  resolveCanvasStagePixelSnap,
  useCanvasView,
} from './useCanvasView'

function mountView() {
  const host = document.createElement('div')
  const viewport = document.createElement('div')
  const stage = document.createElement('div')
  viewport.appendChild(stage)
  host.appendChild(viewport)
  document.body.appendChild(host)
  const viewportRef = ref<HTMLElement | null>(viewport)
  const stageRef = ref<HTMLElement | null>(stage)
  let view!: ReturnType<typeof useCanvasView>
  const app = createApp(defineComponent({
    setup() {
      view = useCanvasView(viewportRef, stageRef)
      return () => h('div')
    },
  }))
  app.mount(host)
  return { app, host, viewport, stage, view }
}

function defineDimensions(element: HTMLElement, width: number, height: number): void {
  Object.defineProperties(element, {
    clientWidth: { configurable: true, value: width },
    clientHeight: { configurable: true, value: height },
    offsetWidth: { configurable: true, value: width },
    offsetHeight: { configurable: true, value: height },
  })
}

describe('useCanvasView', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('calculates a contained fit with a 32px edge gutter and never scales above 100%', () => {
    expect(resolveCanvasFitScale({
      viewport: { width: 800, height: 700 },
      frame: { width: 400, height: 1000 },
    })).toBe(0.636)
    expect(resolveCanvasFitScale({
      viewport: { width: 100, height: 100 },
      frame: { width: 100, height: 100 },
    })).toBe(0.36)
    expect(resolveCanvasFitScale({
      viewport: { width: 2000, height: 2000 },
      frame: { width: 100, height: 100 },
    })).toBe(1)
  })

  it('snaps an odd-sized centered stage to the physical pixel grid', () => {
    const geometry = {
      viewport: { left: 280, top: 48, width: 800, height: 1052 },
      stage: { width: 375, height: 887 },
      offset: { x: 0, y: 0 },
    }

    expect(resolveCanvasStagePixelSnap(geometry, 1)).toEqual({ x: -0.5, y: -0.5 })
    expect(resolveCanvasStagePixelSnap(geometry, 2)).toEqual({ x: 0, y: 0 })
  })

  it('applies pan, pixel snap, and scale as independent stage transforms', () => {
    const css = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
    const stageRule = css.match(/\.dc-canvas__stage\s*\{[^}]*\}/)?.[0]
    const boundaryRule = css.match(/\.dc-canvas__content > \.dc-root-renderer > \[data-dc-toolbar-boundary\]\s*\{[^}]*\}/)?.[0]
    const boundedContentRule = css.match(/\.dc-canvas__content--bounded\s*\{[^}]*\}/)?.[0]
    const boundedRootRule = css.match(/\.dc-canvas__content--bounded > \.dc-root-renderer\s*\{[^}]*\}/)?.[0]
    const rootRule = css.match(/\.dc-canvas__content > \.dc-root-renderer\s*\{[^}]*\}/)?.[0]

    expect(stageRule).toContain('translate3d(-50%, -50%, 0)')
    expect(stageRule).toContain('translate3d(var(--_dc-canvas-pan-x, 0px), var(--_dc-canvas-pan-y, 0px), 0)')
    expect(stageRule).toContain('translate3d(var(--_dc-canvas-snap-x, 0px), var(--_dc-canvas-snap-y, 0px), 0)')
    expect(stageRule).toContain('scale(var(--_dc-canvas-view-scale, 1))')
    expect(boundaryRule).toContain('margin-block: 0')
    expect(boundaryRule).toContain('margin-inline: auto')
    expect(boundedContentRule).toContain('min-width: 0')
    expect(boundedRootRule).toContain('min-width: 0')
    expect(css.indexOf(boundedRootRule!)).toBeGreaterThan(css.indexOf(rootRule!))
  })

  it('fits the target below the manual zoom minimum and resets only pan', () => {
    const { app, viewport, view } = mountView()
    const frame = document.createElement('div')
    defineDimensions(viewport, 100, 100)
    defineDimensions(frame, 1000, 1000)
    view.setFitTarget(frame)
    view.offset.value = { x: 40, y: -20 }
    view.scale.value = 1.5

    expect(view.fit()).toBe(true)
    expect(view.scale.value).toBe(0.036)
    expect(view.scale.value).toBeLessThan(CANVAS_ZOOM_MIN)
    expect(view.offset.value).toEqual({ x: 0, y: 0 })

    view.offset.value = { x: 24, y: 12 }
    view.center()
    expect(view.offset.value).toEqual({ x: 0, y: 0 })
    expect(view.scale.value).toBe(0.036)
    app.unmount()
  })

  it('keeps manual zoom within its 10% to 200% bounds', () => {
    const { app, view } = mountView()
    view.scale.value = CANVAS_ZOOM_MIN

    expect(view.canZoomOut.value).toBe(false)
    view.zoomOut()
    expect(view.scale.value).toBe(CANVAS_ZOOM_MIN)

    view.zoomIn()
    expect(view.scale.value).toBe(0.2)

    view.scale.value = CANVAS_ZOOM_MAX
    expect(view.canZoomIn.value).toBe(false)
    view.zoomIn()
    expect(view.scale.value).toBe(CANVAS_ZOOM_MAX)
    app.unmount()
  })

  it('pans the stage without scroll boundaries in hand mode', () => {
    const { app, view } = mountView()
    view.setMode('hand')

    view.handlePointerDown(new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 }))
    view.handlePointerMove(new PointerEvent('pointermove', { pointerId: 1, clientX: 80, clientY: 70 }))

    expect(view.offset.value).toEqual({ x: -20, y: -30 })
    expect(view.isPanning.value).toBe(true)

    view.handlePointerMove(new PointerEvent('pointermove', { pointerId: 1, clientX: 180, clientY: 170 }))
    expect(view.offset.value).toEqual({ x: 80, y: 70 })

    view.handlePointerUp(new PointerEvent('pointerup', { pointerId: 1 }))
    expect(view.isPanning.value).toBe(false)

    view.center()
    expect(view.offset.value).toEqual({ x: 0, y: 0 })
    app.unmount()
  })

  it('measures canvas geometry at most once per animation frame', () => {
    const callbacks: FrameRequestCallback[] = []
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const { app, viewport, stage, view } = mountView()
    const viewportRect = vi.spyOn(viewport, 'getBoundingClientRect')
    const stageRect = vi.spyOn(stage, 'getBoundingClientRect')

    callbacks.shift()!(0)
    requestFrame.mockClear()
    viewportRect.mockClear()
    stageRect.mockClear()
    view.setMode('hand')
    view.handlePointerDown(new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 0, clientY: 0 }))
    view.handlePointerMove(new PointerEvent('pointermove', { pointerId: 1, clientX: 10, clientY: 10 }))
    view.handlePointerMove(new PointerEvent('pointermove', { pointerId: 1, clientX: 20, clientY: 20 }))
    view.handlePointerMove(new PointerEvent('pointermove', { pointerId: 1, clientX: 30, clientY: 30 }))

    expect(requestFrame).toHaveBeenCalledOnce()
    expect(viewportRect).not.toHaveBeenCalled()
    expect(stageRect).not.toHaveBeenCalled()
    callbacks.shift()!(16)
    expect(viewportRect).toHaveBeenCalledOnce()
    expect(stageRect).toHaveBeenCalledOnce()
    app.unmount()
  })

  it('temporarily enables the hand while Space is held outside editable fields', () => {
    const { app, view } = mountView()
    view.handlePointerEnter()

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true, cancelable: true }))
    expect(view.panEnabled.value).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }))
    expect(view.panEnabled.value).toBe(false)
    app.unmount()
  })
})
