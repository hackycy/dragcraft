import { expect, it } from 'vitest'
import { createPageDesigner } from './create-page-designer'

it('registers the tutorial material protocol before importing the initial schema', () => {
  const designer = createPageDesigner()

  expect(designer.engine.registry.getWidget('notice')?.title).toBe('公告')
  expect(designer.componentMap.notice).toBeDefined()
  expect(designer.engine.state.getNodeById('notice-1')?.type).toBe('notice')
  expect(designer.engine.registry.getWidget('page-header')?.authoring).toBe('schema-managed')
  expect(designer.engine.state.getNodeById('page-header-1')?.type).toBe('page-header')

  designer.dispose()
})
