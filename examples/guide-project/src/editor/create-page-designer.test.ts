import { CommandType } from '@dragcraft/designer'
import { expect, it } from 'vitest'
import { createActivityDesigner } from './create-activity-designer'
import { createContainerDesigner } from './create-container-designer'
import { createGuideSchema } from './create-guide-schema'
import { createLayoutDesigner } from './create-layout-designer'
import { createPageDesigner } from './create-page-designer'

it('keeps the activity stage limited to ordinary activity widgets', () => {
  const designer = createActivityDesigner()

  expect(designer.engine.registry.getWidget('notice')?.title).toBe('公告')
  expect(designer.engine.registry.getWidget('page-header')).toBeUndefined()
  expect(designer.engine.registry.getWidget('column-container')).toBeUndefined()
  expect(designer.engine.state.getNodeById('notice-1')?.type).toBe('notice')

  designer.dispose()
})

it('adds layout and container protocols in their later tutorial stages', () => {
  const layoutDesigner = createLayoutDesigner()
  const containerDesigner = createContainerDesigner()

  expect(layoutDesigner.engine.registry.getWidget('page-header')?.authoring).toBe('schema-managed')
  expect(layoutDesigner.engine.registry.getWidget('column-container')).toBeUndefined()
  expect(containerDesigner.engine.registry.getWidget('column-container')?.title).toBe('分栏容器')

  layoutDesigner.dispose()
  containerDesigner.dispose()
})

it('registers the tutorial material protocol before importing the initial schema', () => {
  const designer = createPageDesigner()

  expect(designer.engine.registry.getWidget('notice')?.title).toBe('公告')
  expect(designer.componentMap.notice).toBeDefined()
  expect(designer.engine.state.getNodeById('notice-1')?.type).toBe('notice')
  expect(designer.engine.registry.getWidget('page-header')?.authoring).toBe('schema-managed')
  expect(designer.engine.state.getNodeById('page-header-1')?.type).toBe('page-header')

  designer.dispose()
})

it('rejects an over-capacity container migration without changing the schema or history', () => {
  const initialSchema = createGuideSchema()
  initialSchema.root.children?.push({
    id: 'column-1',
    type: 'column-container',
    props: { gap: 12 },
    container: {
      variant: 'single',
      regions: {
        content: Array.from({ length: 5 }, (_, index) => ({
          id: `text-${index + 1}`,
          type: 'guide-text',
          props: { content: `文本 ${index + 1}` },
        })),
      },
    },
  })
  const designer = createContainerDesigner({ initialSchema })
  const before = designer.engine.exportSchema()

  expect(designer.engine.execute({
    type: CommandType.CHANGE_CONTAINER_VARIANT,
    payload: { containerId: 'column-1', variant: 'split' },
  })).toMatchObject({
    ok: false,
    code: 'GUIDE_CONTAINER_CAPACITY_EXCEEDED',
  })
  expect(designer.engine.exportSchema()).toEqual(before)
  expect(designer.engine.history.canUndo()).toBe(false)

  designer.dispose()
})
