import { describe, expect, it, vi } from 'vitest'
// @vitest-environment happy-dom
import { nextTick, ref } from 'vue'
import { createSurfaceReservationManager } from './surface-geometry'

describe('surface reservation geometry', () => {
  it('uses fallback sizes until a measured Frame element is available', async () => {
    const manager = createSurfaceReservationManager()
    const element = ref<HTMLElement | null>(null)
    const unregister = manager.register(element, { edge: 'block-start', fallbackSize: 44 })

    expect(manager.insets.value['block-start']).toBe(44)

    const node = document.createElement('div')
    Object.defineProperty(node, 'getBoundingClientRect', {
      value: () => ({ width: 200, height: 56, top: 0, left: 0, right: 200, bottom: 56 }),
    })
    element.value = node
    await nextTick()

    expect(manager.insets.value['block-start']).toBe(56)
    unregister()
    expect(manager.insets.value['block-start']).toBe(0)
  })

  it('uses layout size instead of a transformed visual rect', async () => {
    const manager = createSurfaceReservationManager()
    const element = ref<HTMLElement | null>(null)
    const node = document.createElement('div')
    Object.defineProperty(node, 'offsetHeight', { value: 50 })
    Object.defineProperty(node, 'getBoundingClientRect', {
      value: () => ({ width: 200, height: 35, top: 0, left: 0, right: 200, bottom: 35 }),
    })
    const unregister = manager.register(element, { edge: 'block-end', fallbackSize: 40 })

    element.value = node
    await nextTick()

    expect(manager.insets.value['block-end']).toBe(50)
    unregister()
  })

  it('composes independent edges without changing document data', () => {
    const manager = createSurfaceReservationManager()
    const start = ref<HTMLElement | null>(null)
    const end = ref<HTMLElement | null>(null)
    const removeStart = manager.register(start, { edge: 'block-start', fallbackSize: 44 })
    const removeEnd = manager.register(end, { edge: 'block-end', fallbackSize: 50 })

    expect(manager.insets.value).toEqual({
      'block-start': 44,
      'block-end': 50,
      'inline-start': 0,
      'inline-end': 0,
    })
    removeStart()
    removeEnd()
  })

  it('remeasures a reservation when ResizeObserver reports a new Frame size', async () => {
    const callbacks: Array<() => void> = []
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) {
        callbacks.push(callback)
      }

      observe() {}
      disconnect() {}
    })
    const manager = createSurfaceReservationManager()
    const element = ref<HTMLElement | null>(null)
    const node = document.createElement('div')
    let height = 44
    Object.defineProperty(node, 'getBoundingClientRect', {
      value: () => ({ width: 200, height, top: 0, left: 0, right: 200, bottom: height }),
    })
    const unregister = manager.register(element, { edge: 'block-start', fallbackSize: 40 })
    element.value = node
    await nextTick()
    expect(manager.insets.value['block-start']).toBe(44)
    height = 68
    callbacks[0]?.()
    expect(manager.insets.value['block-start']).toBe(68)
    unregister()
    vi.unstubAllGlobals()
  })
})
