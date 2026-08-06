import { describe, expect, it } from 'vitest'
import { createPageDesigner } from './create-page-designer'
import { createGuideSchema } from './initial-schema'
import { createMinimalDesigner } from './minimal-designer'

describe('full guide Designer setup', () => {
  it('installs the guide materials and DocumentSchema through createDesigner', () => {
    const designer = createPageDesigner()

    expect(designer.document.value.status).toBe('ready')
    expect(designer.exportSchema()).toEqual(createGuideSchema())
    expect(designer.exportSchema()?.nodes.map(node => node.type)).toEqual([
      'page-header',
      'notice',
      'column-container',
      'guide-text',
      'floating-action',
    ])

    designer.dispose()
  })

  it('creates the minimal setup from one material and one document', () => {
    const designer = createMinimalDesigner()

    expect(designer.document.value).toMatchObject({
      status: 'ready',
      schema: {
        nodes: [{ id: 'welcome-text', type: 'guide-text', props: { content: '欢迎使用 Dragcraft' } }],
        structure: { root: ['welcome-text'], containers: {} },
      },
    })
    designer.dispose()
  })

  it('keeps unchanged and rejected actions out of history', () => {
    const designer = createPageDesigner()
    const notice = designer.exportSchema()!.nodes.find(node => node.id === 'notice-1')!

    expect(designer.execute({
      type: 'update-node',
      nodeId: notice.id,
      node: { type: notice.type, props: { ...notice.props } },
    })).toEqual({ status: 'unchanged' })
    expect(designer.execute({
      type: 'remove-node',
      nodeId: 'missing',
    })).toEqual({ status: 'rejected', code: 'NODE_NOT_FOUND' })
    expect(designer.history.undoCount.value).toBe(0)
    designer.dispose()
  })

  it('records a changed action once and restores the snapshot through undo', () => {
    const designer = createPageDesigner()
    const notice = designer.exportSchema()!.nodes.find(node => node.id === 'notice-1')!

    expect(designer.execute({
      type: 'update-node',
      nodeId: notice.id,
      node: { type: notice.type, props: { ...notice.props, text: '修改后的公告' } },
    })).toEqual({ status: 'committed' })
    expect(designer.history.undoCount.value).toBe(1)
    expect(designer.exportSchema()?.nodes.find(node => node.id === 'notice-1')?.props.text)
      .toBe('修改后的公告')

    expect(designer.execute({ type: 'undo' })).toEqual({ status: 'committed' })
    expect(designer.exportSchema()?.nodes.find(node => node.id === 'notice-1')?.props.text)
      .toBe('夏日活动已经开始')
    designer.dispose()
  })
})
