// @vitest-environment happy-dom
import type { Component } from 'vue'
import type { UseNodeSelectionProjectionReturn } from './useNodeSelectionProjection'
import { afterEach, describe, expect, it } from 'vitest'
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

  it('keeps the complete root material width when the presentation plane is narrower', async () => {
    const node = document.createElement('div')
    const plane = document.createElement('div')
    const mountPoint = document.createElement('div')
    document.body.append(node, plane, mountPoint)
    mockRect(node, { top: -20, right: 389, bottom: 60, left: 20, width: 369, height: 80 })
    mockRect(plane, { top: 0, right: 385, bottom: 500, left: 24, width: 361, height: 500 })

    const presentation = createNodeSelectionPresentation()
    presentation.registerPlane('content', plane)
    const nodeRef = ref<HTMLElement | null>(node)
    const selected = ref(true)
    const planeRef = ref<'content' | 'viewport'>('content')
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
        plane: 'content',
        rect: { top: -20, left: -4, width: 369, height: 80 },
      })

      selected.value = false
      await nextTick()
      expect(result?.projection.value).toBeNull()
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

      expect(result?.projection.value?.rect).toEqual({
        top: 20,
        left: 50,
        width: 160,
        height: 60,
      })
    }
    finally {
      app.unmount()
    }
  })
})
