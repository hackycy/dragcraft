import type { DocumentSchema } from '@dragcraft/designer'
import { expect, it } from 'vitest'
import { createPageDesigner } from './create-page-designer'
import { GUIDE_SCHEMA_VERSION } from './initial-schema'
import { roundTripGuideSchema } from './schema-round-trip'

function updateNoticeText(designer: ReturnType<typeof createPageDesigner>, text: string) {
  const current = designer.exportSchema()!.nodes.find(node => node.id === 'notice-1')!
  const { id, ...node } = current
  return designer.execute({
    type: 'update-node',
    nodeId: id,
    node: {
      ...node,
      props: { ...node.props, text },
    },
  })
}

it('creates the tutorial through the final material and DocumentSchema contract', () => {
  const designer = createPageDesigner()

  expect('engine' in designer).toBe(false)
  expect(designer.document.value.status).toBe('ready')
  const schema = designer.exportSchema() as DocumentSchema
  expect(schema.nodes.map(node => node.id)).toEqual([
    'page-header-1',
    'notice-1',
    'layout-1',
    'text-1',
    'floating-action-1',
  ])

  designer.dispose()
})

it('keeps no-op and rejected writes out of history', () => {
  const designer = createPageDesigner()

  const noChange = updateNoticeText(designer, '夏日活动已经开始')
  const rejected = designer.execute({
    type: 'update-node',
    nodeId: 'missing',
    node: { type: 'notice', props: { text: '不会写入' } },
  })

  expect(noChange).toEqual({ status: 'unchanged' })
  expect(rejected).toEqual({ status: 'rejected', code: 'NODE_NOT_FOUND' })
  expect(designer.history.undoCount.value).toBe(0)

  designer.dispose()
})

it('records a changed write once and restores it through undo', () => {
  const designer = createPageDesigner()
  const result = updateNoticeText(designer, '修改后的公告')

  expect(result).toEqual({ status: 'committed' })
  expect(designer.history.undoCount.value).toBe(1)
  expect((designer.exportSchema() as DocumentSchema).nodes.find(node => node.id === 'notice-1')?.props.text).toBe('修改后的公告')

  designer.execute({ type: 'undo' })
  expect((designer.exportSchema() as DocumentSchema).nodes.find(node => node.id === 'notice-1')?.props.text).toBe('夏日活动已经开始')

  designer.dispose()
})

it('round-trips the complete DesignerSchema through JSON persistence', () => {
  const designer = createPageDesigner()
  const exported = designer.exportSchema() as DocumentSchema
  const persisted = roundTripGuideSchema(exported)

  expect(designer.importSchema(persisted)).toMatchObject({ status: 'ready' })
  expect(designer.exportSchema()).toEqual(exported)

  designer.dispose()
})

it('rejects a legacy-shaped schema instead of performing a runtime migration', () => {
  const designer = createPageDesigner()
  const original = designer.exportSchema()
  const result = designer.importSchema({
    version: '1.0.0',
    globalConfig: { pageName: '迁移后的活动页' },
    root: { id: 'root', type: 'root', props: {}, children: [] },
  })

  expect(GUIDE_SCHEMA_VERSION).toBe('1')
  expect(result.status).toBe('rejected')
  expect(designer.exportSchema()).toEqual(original)

  designer.dispose()
})
