import type { WidgetDefinition } from './types'
import { describe, expect, it, vi } from 'vitest'
import { buildComponentMap, filterByGroup, getWidgetMetas, registerWidgets } from './index'

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
