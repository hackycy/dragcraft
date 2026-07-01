import { describe, expect, it, vi } from 'vitest'
import {
  allWidgetDefinitions,
  getAllWidgetMetas,
  getDefaultComponentMap,
  getWidgetsByGroup,
  registerAllWidgets,
  widgetGroups,
} from './index'

describe('builtin widgets exports', () => {
  it('exposes the default widget definitions and groups', () => {
    expect(allWidgetDefinitions).toHaveLength(10)
    expect(getAllWidgetMetas().map(meta => meta.type)).toEqual([
      'text',
      'button',
      'image',
      'link',
      'divider',
      'form-input',
      'form-textarea',
      'form-select',
      'form-checkbox',
      'form-radio',
    ])
    expect(widgetGroups.map(group => group.name)).toEqual(['basic', 'form'])
  })

  it('builds component maps and filters by group', () => {
    const componentMap = getDefaultComponentMap()

    expect(Object.keys(componentMap)).toEqual(getAllWidgetMetas().map(meta => meta.type))
    expect(getWidgetsByGroup('basic').map(def => def.meta.type)).toEqual([
      'text',
      'button',
      'image',
      'link',
      'divider',
    ])
  })

  it('registers all widget metas with an engine', () => {
    const engine = { registerWidget: vi.fn() }

    registerAllWidgets(engine as never)

    expect(engine.registerWidget).toHaveBeenCalledTimes(allWidgetDefinitions.length)
    expect(engine.registerWidget).toHaveBeenCalledWith(allWidgetDefinitions[0].meta)
  })
})
