// @vitest-environment happy-dom
import type { DesignerSchema, RendererWidgetActionExtra, RendererWidgetMeta } from './index'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createDesigner } from './index'

describe('createDesigner', () => {
  it('registers container metas before importing the initial schema', () => {
    const initialSchema: DesignerSchema = {
      version: '1.0.0',
      globalConfig: {},
      root: {
        id: 'root',
        type: 'root',
        props: {},
        children: [{
          id: 'layout',
          type: 'single-layout',
          props: {},
          container: { variant: 'single', regions: {} },
        }],
      },
    }
    const designer = createDesigner({
      engineOptions: { initialSchema },
      widgetMetas: [{
        type: 'single-layout',
        title: 'Single layout',
        group: 'layout',
        defaultProps: {},
        formSchema: { sections: [] },
        container: {
          defaultVariant: 'single',
          variants: {
            single: {
              title: 'Single',
              regions: [{ id: 'content', title: 'Content' }],
            },
          },
        },
      }],
    })

    expect(designer.engine.state.getNodeById('layout')?.container).toEqual({
      variant: 'single',
      regions: { content: [] },
    })
    expect(designer.engine.exportSchema().version).toBe('1.0.0')
    designer.dispose()
  })

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
