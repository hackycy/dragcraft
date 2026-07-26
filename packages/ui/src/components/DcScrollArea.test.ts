// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import DcScrollArea from './DcScrollArea'

interface ElementMetrics {
  clientHeight: number
  scrollHeight: number
  scrollTop?: number
}

let frameCallbacks: FrameRequestCallback[]
let resizeObservers: MockResizeObserver[]

class MockResizeObserver {
  readonly observe = vi.fn()
  readonly disconnect = vi.fn()

  constructor(private readonly callback: ResizeObserverCallback) {
    resizeObservers.push(this)
  }

  trigger(): void {
    this.callback([], this as unknown as ResizeObserver)
  }
}

function setElementMetrics(element: HTMLElement, values: ElementMetrics): void {
  Object.defineProperties(element, {
    clientHeight: { configurable: true, value: values.clientHeight },
    scrollHeight: { configurable: true, value: values.scrollHeight },
    scrollTop: { configurable: true, writable: true, value: values.scrollTop ?? 0 },
  })
}

function makePointerEvent(
  type: string,
  options: PointerEventInit & { pointerId?: number, isPrimary?: boolean } = {},
): PointerEvent {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    ...options,
  })
  Object.defineProperties(event, {
    pointerId: { configurable: true, value: options.pointerId ?? 1 },
    isPrimary: { configurable: true, value: options.isPrimary ?? true },
  })
  return event
}

async function flushFrames(): Promise<void> {
  await nextTick()
  let guard = 0
  while (frameCallbacks.length > 0 && guard < 10) {
    const pending = frameCallbacks.splice(0)
    pending.forEach(callback => callback(16))
    await nextTick()
    guard += 1
  }
}

async function mountOverflowing(type: 'auto' | 'always' | 'scroll' | 'hover' = 'hover') {
  const wrapper = mount(DcScrollArea, {
    props: { type },
    slots: { default: '<div data-test="content">content</div>' },
  })
  const viewport = wrapper.find<HTMLElement>('[data-dc-part="viewport"]').element
  const scrollbar = wrapper.find<HTMLElement>('[data-dc-part="scrollbar"]').element
  setElementMetrics(viewport, { clientHeight: 100, scrollHeight: 400 })
  setElementMetrics(scrollbar, { clientHeight: 100, scrollHeight: 100 })
  await flushFrames()
  return { wrapper, viewport, scrollbar }
}

describe('dcScrollArea', () => {
  beforeEach(() => {
    frameCallbacks = []
    resizeObservers = []
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders stable public hooks, forwards root attributes, and hides a non-overflowing thumb', async () => {
    const wrapper = mount(DcScrollArea, {
      attrs: {
        'id': 'panel-scroll',
        'class': 'host-scroll',
        'role': 'tabpanel',
        'aria-label': 'Panel content',
      },
      slots: { default: '<div data-test="content">content</div>' },
    })
    const root = wrapper.find('[data-dc-component="scroll-area"]')
    const viewport = wrapper.find<HTMLElement>('[data-dc-part="viewport"]').element
    const scrollbar = wrapper.find<HTMLElement>('[data-dc-part="scrollbar"]').element
    const thumb = wrapper.find<HTMLElement>('[data-dc-part="thumb"]').element
    setElementMetrics(viewport, { clientHeight: 100, scrollHeight: 100 })
    setElementMetrics(scrollbar, { clientHeight: 100, scrollHeight: 100 })

    await flushFrames()

    expect(root.attributes('id')).toBe('panel-scroll')
    expect(root.attributes('role')).toBe('tabpanel')
    expect(root.attributes('aria-label')).toBe('Panel content')
    expect(root.classes()).toContain('host-scroll')
    expect(root.attributes('data-dc-state')).toBe('hidden')
    expect(wrapper.find('[data-dc-part="content"] [data-test="content"]').exists()).toBe(true)
    expect(thumb.style.display).toBe('none')
  })

  it('calculates proportional thumb geometry and coalesces scroll updates by frame', async () => {
    const { wrapper, viewport } = await mountOverflowing('auto')
    const thumb = wrapper.find<HTMLElement>('[data-dc-part="thumb"]').element
    expect(thumb.style.getPropertyValue('--_dc-scroll-area-thumb-height')).toBe('25px')
    expect(thumb.style.getPropertyValue('--_dc-scroll-area-thumb-offset')).toBe('0px')
    expect(wrapper.attributes('data-dc-state')).toContain('overflowing')
    expect(wrapper.attributes('data-dc-state')).toContain('visible')

    frameCallbacks = []
    const requestFrame = vi.mocked(window.requestAnimationFrame)
    requestFrame.mockClear()
    viewport.scrollTop = 150
    viewport.dispatchEvent(new Event('scroll'))
    viewport.dispatchEvent(new Event('scroll'))
    viewport.dispatchEvent(new Event('scroll'))

    expect(requestFrame).toHaveBeenCalledOnce()
    await flushFrames()
    expect(thumb.style.getPropertyValue('--_dc-scroll-area-thumb-offset')).toBe('37.5px')
    expect(wrapper.emitted('scroll')).toHaveLength(3)
  })

  it('honors the minimum thumb size', async () => {
    const wrapper = mount(DcScrollArea, { props: { type: 'auto' } })
    const viewport = wrapper.find<HTMLElement>('[data-dc-part="viewport"]').element
    const scrollbar = wrapper.find<HTMLElement>('[data-dc-part="scrollbar"]').element
    setElementMetrics(viewport, { clientHeight: 100, scrollHeight: 2000 })
    setElementMetrics(scrollbar, { clientHeight: 100, scrollHeight: 100 })

    await flushFrames()

    expect(wrapper.find<HTMLElement>('[data-dc-part="thumb"]').element.style
      .getPropertyValue('--_dc-scroll-area-thumb-height')).toBe('24px')
  })

  it('implements always and auto visibility from overflow state', async () => {
    const always = mount(DcScrollArea, { props: { type: 'always' } })
    const alwaysViewport = always.find<HTMLElement>('[data-dc-part="viewport"]').element
    const alwaysScrollbar = always.find<HTMLElement>('[data-dc-part="scrollbar"]').element
    setElementMetrics(alwaysViewport, { clientHeight: 100, scrollHeight: 100 })
    setElementMetrics(alwaysScrollbar, { clientHeight: 100, scrollHeight: 100 })
    await flushFrames()
    expect(always.attributes('data-dc-state')).toContain('visible')

    const { wrapper, viewport } = await mountOverflowing('auto')
    expect(wrapper.attributes('data-dc-state')).toContain('visible')
    setElementMetrics(viewport, { clientHeight: 100, scrollHeight: 100 })
    resizeObservers.at(-1)?.trigger()
    await flushFrames()
    expect(wrapper.attributes('data-dc-state')).toBe('hidden')
  })

  it('shows on hover and hides after the configured delay', async () => {
    const { wrapper } = await mountOverflowing('hover')
    vi.useFakeTimers()
    expect(wrapper.attributes('data-dc-state')).toContain('hidden')

    await wrapper.trigger('pointerenter')
    expect(wrapper.attributes('data-dc-state')).toContain('visible')
    await wrapper.trigger('pointerleave')
    vi.advanceTimersByTime(599)
    await nextTick()
    expect(wrapper.attributes('data-dc-state')).toContain('visible')
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.attributes('data-dc-state')).toContain('hidden')
  })

  it('shows while scrolling and hides after scroll idle plus the configured delay', async () => {
    const { wrapper, viewport } = await mountOverflowing('scroll')
    vi.useFakeTimers()
    viewport.scrollTop = 50
    viewport.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(wrapper.attributes('data-dc-state')).toContain('scrolling')
    expect(wrapper.attributes('data-dc-state')).toContain('visible')

    vi.advanceTimersByTime(100)
    await nextTick()
    expect(wrapper.attributes('data-dc-state')).not.toContain('scrolling')
    vi.advanceTimersByTime(599)
    await nextTick()
    expect(wrapper.attributes('data-dc-state')).toContain('visible')
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.attributes('data-dc-state')).toContain('hidden')
  })

  it('supports track jumps, pointer dragging, and ignores non-primary pointers', async () => {
    const { wrapper, viewport, scrollbar } = await mountOverflowing('auto')
    const thumb = wrapper.find<HTMLElement>('[data-dc-part="thumb"]').element
    scrollbar.getBoundingClientRect = () => ({
      top: 0,
      bottom: 100,
      left: 0,
      right: 8,
      width: 8,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    thumb.getBoundingClientRect = () => ({
      top: 0,
      bottom: 25,
      left: 2,
      right: 6,
      width: 4,
      height: 25,
      x: 2,
      y: 0,
      toJSON: () => ({}),
    })
    Object.defineProperties(scrollbar, {
      setPointerCapture: { configurable: true, value: vi.fn() },
      hasPointerCapture: { configurable: true, value: vi.fn(() => false) },
    })

    scrollbar.dispatchEvent(makePointerEvent('pointerdown', { button: 0, clientY: 75, pointerId: 3 }))
    await nextTick()
    expect(viewport.scrollTop).toBe(250)
    expect(wrapper.attributes('data-dc-state')).toContain('dragging')

    scrollbar.dispatchEvent(makePointerEvent('pointermove', { clientY: 100, pointerId: 3 }))
    expect(viewport.scrollTop).toBe(300)
    scrollbar.dispatchEvent(makePointerEvent('pointerup', { clientY: 100, pointerId: 3 }))
    await nextTick()
    expect(wrapper.attributes('data-dc-state')).not.toContain('dragging')

    viewport.scrollTop = 40
    scrollbar.dispatchEvent(makePointerEvent('pointerdown', {
      button: 0,
      clientY: 90,
      pointerId: 4,
      isPrimary: false,
    }))
    expect(viewport.scrollTop).toBe(40)
  })

  it('forwards wheel movement from the overlay track without trapping boundary scroll', async () => {
    const { viewport, scrollbar } = await mountOverflowing('auto')
    const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 40 })
    scrollbar.dispatchEvent(wheel)
    expect(viewport.scrollTop).toBe(40)
    expect(wheel.defaultPrevented).toBe(true)

    viewport.scrollTop = 300
    const boundaryWheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 40 })
    scrollbar.dispatchEvent(boundaryWheel)
    expect(viewport.scrollTop).toBe(300)
    expect(boundaryWheel.defaultPrevented).toBe(false)
  })

  it('keeps one resize observer and cleans resources on unmount', async () => {
    const { wrapper } = await mountOverflowing('auto')
    expect(resizeObservers).toHaveLength(1)
    expect(resizeObservers[0].observe).toHaveBeenCalledTimes(2)
    wrapper.unmount()
    expect(resizeObservers[0].disconnect).toHaveBeenCalledOnce()
  })

  it('keeps structural and visual CSS responsibilities separate', () => {
    const structure = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
    const recipe = readFileSync(path.resolve(process.cwd(), 'styles/recipe.css'), 'utf8')

    expect(structure).toContain('position: absolute')
    expect(structure).toContain('scrollbar-width: none')
    expect(structure).toContain('overflow-y: scroll')
    expect(structure).toContain('right: var(--dc-scroll-area-track-offset, 0px)')
    expect(structure).toContain('right: 0')
    expect(structure).toContain('transform: translateY(var(--_dc-scroll-area-thumb-offset, 0px))')
    expect(structure).not.toContain('translate(-50%')
    expect(structure).not.toContain('background:')
    expect(recipe).toContain('var(--dc-scroll-area-thumb-color, rgba(9, 9, 11, 0.28))')
    expect(recipe).toContain('[data-dc-component="scroll-area"]')
  })
})
