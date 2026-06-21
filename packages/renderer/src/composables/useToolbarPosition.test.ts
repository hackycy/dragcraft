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
    vi.restoreAllMocks()
  })

  it('initializes with hidden position', () => {
    const elRef = ref<HTMLElement | null>(null)
    const active = ref(false)

    // onBeforeUnmount will warn outside component, but composable still works
    const { position } = useToolbarPosition(elRef, active)

    expect(position.value).toEqual({ top: 0, left: 0, visible: false })
  })

  it('computes position to the right of the element when active', async () => {
    const el = mockElement({ top: 100, left: 100, right: 200, bottom: 200 })
    const elRef = ref<HTMLElement | null>(el)
    const active = ref(true)

    const { position, update } = useToolbarPosition(elRef, active, { gap: 8, toolbarWidth: 32 })

    // Wait for the immediate watcher to fire
    await nextTick()

    // Manually trigger update to ensure position is computed
    update()

    expect(position.value.visible).toBe(true)
    expect(position.value.top).toBe(100)
    expect(position.value.left).toBe(208) // 200 + gap(8)
  })

  it('flips to left side when element is near right edge', async () => {
    const el = mockElement({ top: 100, left: 900, right: 1000, bottom: 200 })
    const elRef = ref<HTMLElement | null>(el)
    const active = ref(true)

    const { position, update } = useToolbarPosition(elRef, active, { gap: 8, toolbarWidth: 32 })

    await nextTick()
    update()

    expect(position.value.visible).toBe(true)
    // Should flip: left = rect.left - gap - toolbarWidth = 900 - 8 - 32 = 860
    expect(position.value.left).toBe(860)
  })

  it('clamps top to clip bounds', async () => {
    // Element partially above viewport
    const el = mockElement({ top: -20, left: 100, right: 200, bottom: 80 })
    const elRef = ref<HTMLElement | null>(el)
    const active = ref(true)

    const { position, update } = useToolbarPosition(elRef, active)

    await nextTick()
    update()

    expect(position.value.visible).toBe(true)
    expect(position.value.top).toBe(0) // clamped to viewport top
  })

  it('hides when element is fully outside viewport', async () => {
    const el = mockElement({ top: -200, left: 100, right: 200, bottom: -100 })
    const elRef = ref<HTMLElement | null>(el)
    const active = ref(true)

    const { position, update } = useToolbarPosition(elRef, active)

    await nextTick()
    update()

    expect(position.value.visible).toBe(false)
  })

  it('hides when element ref is null', async () => {
    const elRef = ref<HTMLElement | null>(null)
    const active = ref(true)

    const { position, update } = useToolbarPosition(elRef, active)

    await nextTick()
    update()

    expect(position.value.visible).toBe(false)
  })

  it('does not update ref when values are unchanged (avoids unnecessary re-renders)', async () => {
    const el = mockElement({ top: 100, left: 100, right: 200, bottom: 200 })
    const elRef = ref<HTMLElement | null>(el)
    const active = ref(true)

    const { position, update } = useToolbarPosition(elRef, active, { gap: 8, toolbarWidth: 32 })

    await nextTick()
    update()

    const firstPos = position.value
    update()
    const secondPos = position.value

    // Same reference means no unnecessary ref update
    expect(firstPos).toBe(secondPos)
  })

  it('handles elements inside scrollable containers', async () => {
    // Create a scrollable parent
    const parent = document.createElement('div')
    parent.style.overflow = 'auto'
    parent.getBoundingClientRect = vi.fn(() => ({
      top: 50,
      left: 50,
      right: 500,
      bottom: 400,
      width: 450,
      height: 350,
      x: 50,
      y: 50,
      toJSON: () => {},
    }))
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      if (el === parent) {
        return { overflowY: 'auto', overflowX: 'visible' } as CSSStyleDeclaration
      }
      return { overflowY: 'visible', overflowX: 'visible' } as CSSStyleDeclaration
    })

    const el = mockElement({ top: 100, left: 100, right: 200, bottom: 200 })
    parent.appendChild(el)
    document.body.appendChild(parent)

    const elRef = ref<HTMLElement | null>(el)
    const active = ref(true)

    const { position, update } = useToolbarPosition(elRef, active, { gap: 8, toolbarWidth: 32 })

    await nextTick()
    update()

    expect(position.value.visible).toBe(true)
    // Top should be clamped to parent's top (50) since parent clips Y
    expect(position.value.top).toBeGreaterThanOrEqual(50)

    document.body.removeChild(parent)
  })
})
