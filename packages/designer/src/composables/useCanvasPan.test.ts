// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'
import { resolveCanvasStagePixelSnap, useCanvasPan } from './useCanvasPan'

function mountPan() {
  const host = document.createElement('div')
  const viewport = document.createElement('div')
  const stage = document.createElement('div')
  viewport.appendChild(stage)
  host.appendChild(viewport)
  document.body.appendChild(host)
  const viewportRef = ref<HTMLElement | null>(viewport)
  const stageRef = ref<HTMLElement | null>(stage)
  let pan!: ReturnType<typeof useCanvasPan>
  const app = createApp(defineComponent({
    setup() {
      pan = useCanvasPan(viewportRef, stageRef)
      return () => h('div')
    },
  }))
  app.mount(host)
  return { app, host, viewport, pan }
}

describe('useCanvasPan', () => {
  afterEach(() => {
    document.body.innerHTML = ''
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

  it('applies pan and pixel snap as independent stage translations', () => {
    const css = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
    const stageRule = css.match(/\.dc-canvas__stage\s*\{[^}]*\}/)?.[0]
    const boundaryRule = css.match(/\.dc-canvas__content > \.dc-root-renderer > \[data-dc-toolbar-boundary\]\s*\{[^}]*\}/)?.[0]
    const boundedContentRule = css.match(/\.dc-canvas__content--bounded\s*\{[^}]*\}/)?.[0]
    const boundedRootRule = css.match(/\.dc-canvas__content--bounded > \.dc-root-renderer\s*\{[^}]*\}/)?.[0]
    const rootRule = css.match(/\.dc-canvas__content > \.dc-root-renderer\s*\{[^}]*\}/)?.[0]

    expect(stageRule).toContain('translate3d(-50%, -50%, 0)')
    expect(stageRule).toContain('translate3d(var(--_dc-canvas-pan-x, 0px), var(--_dc-canvas-pan-y, 0px), 0)')
    expect(stageRule).toContain('translate3d(var(--_dc-canvas-snap-x, 0px), var(--_dc-canvas-snap-y, 0px), 0)')
    expect(boundaryRule).toContain('margin-block: 0')
    expect(boundaryRule).toContain('margin-inline: auto')
    expect(boundedContentRule).toContain('min-width: 0')
    expect(boundedRootRule).toContain('min-width: 0')
    expect(css.indexOf(boundedRootRule!)).toBeGreaterThan(css.indexOf(rootRule!))
  })

  it('pans the stage without scroll boundaries in hand mode', () => {
    const { app, pan } = mountPan()
    pan.setMode('hand')

    pan.handlePointerDown(new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 }))
    pan.handlePointerMove(new PointerEvent('pointermove', { pointerId: 1, clientX: 80, clientY: 70 }))

    expect(pan.offset.value).toEqual({ x: -20, y: -30 })
    expect(pan.isPanning.value).toBe(true)

    pan.handlePointerMove(new PointerEvent('pointermove', { pointerId: 1, clientX: 180, clientY: 170 }))
    expect(pan.offset.value).toEqual({ x: 80, y: 70 })

    pan.handlePointerUp(new PointerEvent('pointerup', { pointerId: 1 }))
    expect(pan.isPanning.value).toBe(false)

    pan.reset()
    expect(pan.offset.value).toEqual({ x: 0, y: 0 })
    app.unmount()
  })

  it('temporarily enables the hand while Space is held outside editable fields', () => {
    const { app, pan } = mountPan()
    pan.handlePointerEnter()

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true, cancelable: true }))
    expect(pan.panEnabled.value).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }))
    expect(pan.panEnabled.value).toBe(false)
    app.unmount()
  })
})
