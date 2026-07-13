import type { ContainerDefinition } from '@dragcraft/core'
import type { WidgetDefinition } from './types'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { buildComponentMap, defineContainerWidget, filterByGroup, getWidgetMetas, registerWidgets } from './index'

const componentA = { name: 'WidgetA' }
const componentB = { name: 'WidgetB' }

const definitions: WidgetDefinition[] = [
  {
    meta: {
      type: 'a',
      title: 'A',
      group: 'basic',
      defaultProps: {},
      formSchema: { sections: [] },
    },
    component: componentA,
  },
  {
    meta: {
      type: 'b',
      title: 'B',
      group: 'form',
      defaultProps: {},
      formSchema: { sections: [] },
    },
    component: componentB,
  },
]

describe('widgets helpers', () => {
  it('preserves metadata inference through defineContainerWidget', () => {
    const definition = defineContainerWidget({
      meta: {
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
        } satisfies ContainerDefinition,
        designTime: { nested: true },
      },
      component: componentA,
    })

    expect(definition.meta.container.defaultVariant).toBe('single')
    expectTypeOf(definition.meta.designTime).toEqualTypeOf<{ nested: boolean }>()
  })

  it('accepts widget definitions with core-compatible extended metadata', () => {
    type ExtendedMeta = WidgetDefinition['meta'] & {
      actions: { extra: [{ key: 'inspect', label: 'Inspect', type: 'button', order: 10 }] }
    }

    const definition: WidgetDefinition<ExtendedMeta> = {
      meta: {
        type: 'c',
        title: 'C',
        group: 'basic',
        defaultProps: {},
        formSchema: { sections: [] },
        actions: { extra: [{ key: 'inspect', label: 'Inspect', type: 'button', order: 10 }] },
      },
      component: componentA,
    }

    expect(definition.meta.actions.extra[0].key).toBe('inspect')
  })

  it('builds component maps from widget definitions', () => {
    expect(buildComponentMap(definitions)).toEqual({
      a: componentA,
      b: componentB,
    })
  })

  it('extracts metas and filters by group', () => {
    expect(getWidgetMetas(definitions).map(meta => meta.type)).toEqual(['a', 'b'])
    expect(filterByGroup(definitions, 'basic')).toEqual([definitions[0]])
  })

  it('registers widget metas with an engine', () => {
    const engine = { registerWidget: vi.fn() }

    registerWidgets(engine as never, definitions)

    expect(engine.registerWidget).toHaveBeenCalledTimes(2)
    expect(engine.registerWidget).toHaveBeenCalledWith(definitions[0].meta)
    expect(engine.registerWidget).toHaveBeenCalledWith(definitions[1].meta)
  })
})
