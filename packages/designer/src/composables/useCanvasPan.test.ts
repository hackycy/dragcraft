// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'
import { useCanvasPan } from './useCanvasPan'

function mountPan() {
  const host = document.createElement('div')
  const viewport = document.createElement('div')
  host.appendChild(viewport)
  document.body.appendChild(host)
  const viewportRef = ref<HTMLElement | null>(viewport)
  let pan!: ReturnType<typeof useCanvasPan>
  const app = createApp(defineComponent({
    setup() {
      pan = useCanvasPan(viewportRef)
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

  it('pans the viewport in hand mode', () => {
    const { app, viewport, pan } = mountPan()
    viewport.scrollLeft = 50
    viewport.scrollTop = 20
    pan.setMode('hand')

    pan.handlePointerDown(new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 }))
    pan.handlePointerMove(new PointerEvent('pointermove', { pointerId: 1, clientX: 80, clientY: 70 }))

    expect(viewport.scrollLeft).toBe(70)
    expect(viewport.scrollTop).toBe(50)
    expect(pan.isPanning.value).toBe(true)

    pan.handlePointerUp(new PointerEvent('pointerup', { pointerId: 1 }))
    expect(pan.isPanning.value).toBe(false)
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
