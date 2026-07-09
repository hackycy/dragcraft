// @vitest-environment happy-dom
import type { RendererWidgetActionExtra, RendererWidgetMeta } from './index'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createDesigner } from './index'

describe('createDesigner', () => {
  it('accepts renderer widget metadata through the public API', () => {
    const Wrapper = defineComponent({ name: 'TestWrapper', setup: () => () => null })
    const inspectExtra: RendererWidgetActionExtra = {
      key: 'inspect',
      label: 'Inspect',
      type: 'button',
      order: 10,
    }
    const meta: RendererWidgetMeta = {
      type: 'button',
      title: 'Button',
      group: 'basic',
      defaultProps: {},
      formSchema: { sections: [] },
      wrapper: Wrapper,
      actions: {
        extra: [inspectExtra],
      },
    }

    const designer = createDesigner({
      widgetMetas: [meta],
    })

    try {
      expect(designer.engine.registry.getWidget('button')).toMatchObject({
        type: 'button',
        wrapper: Wrapper,
        actions: {
          extra: [inspectExtra],
        },
      })
    }
    finally {
      designer.dispose()
    }
  })
})
