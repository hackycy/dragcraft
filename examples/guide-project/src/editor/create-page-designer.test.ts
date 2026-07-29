import { CommandType, EventName } from '@dragcraft/designer'
import { expect, it } from 'vitest'
import { createPageDesigner } from './create-page-designer'
import { createGuideSchema, GUIDE_SCHEMA_VERSION } from './initial-schema'

it('registers the tutorial material protocol before importing the initial schema', () => {
  const designer = createPageDesigner()

  expect(designer.engine.registry.getWidget('notice')?.title).toBe('公告')
  expect(designer.componentMap.notice).toBeDefined()
  expect(designer.engine.state.getNodeById('notice-1')?.type).toBe('notice')
  expect(designer.engine.registry.getWidget('page-header')?.authoring).toBe('schema-managed')
  expect(designer.engine.state.getNodeById('page-header-1')?.type).toBe('page-header')
  expect(designer.engine.state.getNodeById('floating-action-1')?.type).toBe('floating-action')

  designer.dispose()
})

it('keeps no-op and rejected commands out of history and change events', () => {
  const designer = createPageDesigner()
  let schemaChanges = 0
  designer.engine.eventHub.on(EventName.SCHEMA_CHANGED, () => schemaChanges++)

  const noChange = designer.engine.execute({
    type: CommandType.UPDATE_PROPS,
    payload: { nodeId: 'notice-1', props: { text: '夏日活动已经开始' } },
  })
  const rejected = designer.engine.execute({
    type: CommandType.UPDATE_PROPS,
    payload: { nodeId: 'missing', props: { text: '不会写入' } },
  })

  expect(noChange).toEqual({ ok: true, changed: false })
  expect(rejected).toEqual({ ok: false, code: 'COMMAND_REJECTED' })
  expect(designer.engine.history.state.value.undoCount).toBe(0)
  expect(schemaChanges).toBe(0)

  designer.dispose()
})

it('records a changed command once and restores it through undo', () => {
  const designer = createPageDesigner()
  const result = designer.engine.execute({
    type: CommandType.UPDATE_PROPS,
    payload: { nodeId: 'notice-1', props: { text: '修改后的公告' } },
  })

  expect(result).toEqual({ ok: true, changed: true })
  expect(designer.engine.history.state.value.undoCount).toBe(1)
  expect(designer.engine.state.getNodeById('notice-1')?.props.text).toBe('修改后的公告')

  designer.engine.history.undo()
  expect(designer.engine.state.getNodeById('notice-1')?.props.text).toBe('夏日活动已经开始')

  designer.dispose()
})

it('migrates a legacy schema before validating and importing it', () => {
  const legacySchema = createGuideSchema()
  legacySchema.version = '1.0.0'
  legacySchema.globalConfig = { pageName: '迁移后的活动页' }

  const designer = createPageDesigner({ initialSchema: legacySchema })
  const schema = designer.engine.state.getSchema()

  expect(schema.version).toBe(GUIDE_SCHEMA_VERSION)
  expect(schema.globalConfig.title).toBe('迁移后的活动页')
  expect(schema.globalConfig.pageName).toBeUndefined()

  designer.dispose()
})
