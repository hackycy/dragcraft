// @vitest-environment happy-dom
import type { Component } from 'vue'
import type { NodeSelectionPlane } from '../selection-presentation'
import type { UseNodeSelectionProjectionReturn } from './useNodeSelectionProjection'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, provide, ref } from 'vue'
import {
  createNodeSelectionPresentation,
  NODE_SELECTION_PRESENTATION_KEY,
} from '../selection-presentation'
import { useNodeSelectionProjection } from './useNodeSelectionProjection'

function mockRect(element: HTMLElement, rect: Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left' | 'width' | 'height'>): void {
  element.getBoundingClientRect = () => ({
    ...rect,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  }) as DOMRect
}

describe('useNodeSelectionProjection', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('projects a root segment across the complete root plane while preserving material bounds', async () => {
    const node = document.createElement('div')
    const plane = document.createElement('div')
    const mountPoint = document.createElement('div')
    document.body.append(node, plane, mountPoint)
    mockRect(node, { top: 120, right: 398, bottom: 200, left: 23, width: 375, height: 80 })
    mockRect(plane, { top: 0, right: 401, bottom: 700, left: 20, width: 381, height: 700 })

    const presentation = createNodeSelectionPresentation()
    presentation.registerPlane('root', plane)
    const nodeRef = ref<HTMLElement | null>(node)
    const selected = ref(true)
    const planeRef = ref<NodeSelectionPlane>('root')
    let result: UseNodeSelectionProjectionReturn | undefined

    const Consumer = defineComponent({
      setup() {
        result = useNodeSelectionProjection(nodeRef, selected, {
          kind: 'root-segment',
          plane: planeRef,
        })
        return () => null
      },
    })
    const app = createApp(defineComponent({
      setup() {
        provide(NODE_SELECTION_PRESENTATION_KEY, presentation)
        return () => h(Consumer as Component)
      },
    }))

    try {
      app.mount(mountPoint)
      await nextTick()
      result?.update()

      expect(result?.projection.value).toEqual({
        kind: 'root-segment',
        plane: 'root',
        materialBounds: { top: 120, left: 3, width: 375, height: 80 },
        bounds: { top: 120, left: 0, width: 381, height: 80 },
      })

      selected.value = false
      await nextTick()
      expect(result?.projection.value).toBeNull()
    }
    finally {
      app.unmount()
    }
  })

  it('keeps a root projection aligned when an ancestor scrolls below the fixed root plane', async () => {
    const scroller = document.createElement('div')
    scroller.style.overflow = 'auto'
    const node = document.createElement('div')
    const plane = document.createElement('div')
    const mountPoint = document.createElement('div')
    scroller.append(node)
    document.body.append(scroller, plane, mountPoint)
    let nodeTop = 120
    node.getBoundingClientRect = () => ({
      top: nodeTop,
      right: 398,
      bottom: nodeTop + 80,
      left: 23,
      width: 375,
      height: 80,
      x: 23,
      y: nodeTop,
      toJSON: () => ({}),
    }) as DOMRect
    mockRect(plane, { top: 0, right: 401, bottom: 700, left: 20, width: 381, height: 700 })

    const presentation = createNodeSelectionPresentation()
    presentation.registerPlane('root', plane)
    let result: UseNodeSelectionProjectionReturn | undefined
    const Consumer = defineComponent({
      setup() {
        result = useNodeSelectionProjection(ref(node), ref(true), {
          kind: 'root-segment',
          plane: ref('root'),
        })
        return () => null
      },
    })
    const app = createApp(defineComponent({
      setup() {
        provide(NODE_SELECTION_PRESENTATION_KEY, presentation)
        return () => h(Consumer as Component)
      },
    }))

    try {
      app.mount(mountPoint)
      await vi.waitFor(() => {
        expect(result?.projection.value?.bounds.top).toBe(120)
      })

      nodeTop = 90
      scroller.dispatchEvent(new Event('scroll'))

      await vi.waitFor(() => {
        expect(result?.projection.value?.bounds.top).toBe(90)
      })
    }
    finally {
      app.unmount()
    }
  })

  it('projects complete container material bounds without visible-intersection insets', async () => {
    const node = document.createElement('div')
    const plane = document.createElement('div')
    const mountPoint = document.createElement('div')
    document.body.append(node, plane, mountPoint)
    mockRect(node, { top: 120, right: 310, bottom: 180, left: 150, width: 160, height: 60 })
    mockRect(plane, { top: 100, right: 400, bottom: 500, left: 100, width: 300, height: 400 })

    const presentation = createNodeSelectionPresentation()
    presentation.registerPlane('content', plane)
    const nodeRef = ref<HTMLElement | null>(node)
    let result: UseNodeSelectionProjectionReturn | undefined

    const Consumer = defineComponent({
      setup() {
        result = useNodeSelectionProjection(nodeRef, ref(true), {
          kind: 'material-bounds',
          plane: ref('content'),
        })
        return () => null
      },
    })
    const app = createApp(defineComponent({
      setup() {
        provide(NODE_SELECTION_PRESENTATION_KEY, presentation)
        return () => h(Consumer as Component)
      },
    }))

    try {
      app.mount(mountPoint)
      await nextTick()
      result?.update()

      expect(result?.projection.value).toEqual({
        kind: 'material-bounds',
        plane: 'content',
        materialBounds: { top: 20, left: 50, width: 160, height: 60 },
        bounds: { top: 20, left: 50, width: 160, height: 60 },
      })
    }
    finally {
      app.unmount()
    }
  })

  it('restores scaled visual rectangles to the selection plane local coordinates', async () => {
    const node = document.createElement('div')
    const plane = document.createElement('div')
    const mountPoint = document.createElement('div')
    document.body.append(node, plane, mountPoint)
    mockRect(node, { top: 70, right: 170, bottom: 110, left: 50, width: 120, height: 40 })
    mockRect(plane, { top: 20, right: 210, bottom: 320, left: 10, width: 200, height: 300 })

    const presentation = createNodeSelectionPresentation()
    presentation.registerPlane('root', plane)
    let result: UseNodeSelectionProjectionReturn | undefined
    const viewScale = ref(0.5)
    const Consumer = defineComponent({
      setup() {
        result = useNodeSelectionProjection(ref(node), ref(true), {
          kind: 'root-segment',
          plane: ref('root'),
          viewScale,
        })
        return () => null
      },
    })
    const app = createApp(defineComponent({
      setup() {
        provide(NODE_SELECTION_PRESENTATION_KEY, presentation)
        return () => h(Consumer as Component)
      },
    }))

    try {
      app.mount(mountPoint)
      await nextTick()
      result?.update()

      expect(result?.projection.value).toEqual({
        kind: 'root-segment',
        plane: 'root',
        materialBounds: { top: 100, left: 80, width: 240, height: 80 },
        bounds: { top: 100, left: 0, width: 400, height: 80 },
      })
    }
    finally {
      app.unmount()
    }
  })
})
