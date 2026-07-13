import type { DesignerEngine, DesignerSchema, SchemaNode } from '@dragcraft/core'
import type { RendererContext } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { createNodeActionRegistry } from '../action-registry'
import { useNodeActions } from './useNodeActions'

function makeNode(id: string): SchemaNode {
  return { id, type: 'text', props: {} }
}

function makeContext(schema: DesignerSchema): RendererContext {
  const registry = {
    getWidget: vi.fn(() => ({
      type: 'text',
      title: 'Text',
      group: 'g',
      defaultProps: {},
      formSchema: { sections: [] },
    })),
  } as unknown as DesignerEngine['registry']
  const engine = {
    store: { schema: { value: schema } },
    state: { getSchema: () => schema },
    registry,
  } as unknown as DesignerEngine
  return {
    engine,
    actionRegistry: createNodeActionRegistry(),
    actionInterceptors: [],
  } as unknown as RendererContext
}

describe('useNodeActions', () => {
  it('builds a root owner from the resolved page sort scope', () => {
    const node = makeNode('root-child')
    const schema: DesignerSchema = {
      version: '1.0.0',
      globalConfig: {},
      root: { id: 'root', type: 'root', props: {}, children: [node] },
    }

    const { actionContext } = useNodeActions(() => node, makeContext(schema))

    expect(actionContext.value.owner).toEqual({ kind: 'root', sortScope: 'content' })
    expect(actionContext.value.index).toBe(0)
    expect(actionContext.value.siblingCount).toBe(1)
  })

  it('builds a container owner and region sibling coordinates', () => {
    const child = makeNode('child')
    const container: SchemaNode = {
      id: 'layout',
      type: 'layout',
      props: {},
      container: { variant: 'split', regions: { left: [makeNode('first'), child] } },
    }
    const schema: DesignerSchema = {
      version: '1.0.0',
      globalConfig: {},
      root: { id: 'root', type: 'root', props: {}, children: [container] },
    }

    const { actionContext } = useNodeActions(() => child, makeContext(schema))

    expect(actionContext.value.owner).toEqual({
      kind: 'container',
      containerId: 'layout',
      regionId: 'left',
    })
    expect(actionContext.value.index).toBe(1)
    expect(actionContext.value.siblingCount).toBe(2)
    expect(actionContext.value.sortScope).toBe(false)
  })
})
