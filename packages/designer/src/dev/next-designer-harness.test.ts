import type { DocumentSchema } from '@dragcraft/core'
import { describe, expect, it } from 'vitest'
import { getDesignerSession } from '../session/get-designer-session'
import { createNextDesignerHarness } from './next-designer-harness'

const schema: DocumentSchema = {
  version: '1',
  globalConfig: {},
  page: { props: {} },
  nodes: [{ id: 'text-1', type: 'text', props: { content: 'Next' } }],
  structure: { root: ['text-1'], containers: {} },
}

describe('createNextDesignerHarness', () => {
  it('mounts a Next session without constructing a Legacy Engine', () => {
    const instance = createNextDesignerHarness({
      componentMap: {},
      createNodeId: () => 'text-2',
      materials: [{ type: 'text', presentation: { kind: 'headless' } }],
      schema,
    })
    const session = getDesignerSession(instance)

    expect('engine' in instance).toBe(false)
    expect(session.document.rootNodes.value.map(node => node.id)).toEqual(['text-1'])
    expect(session.execute({
      type: 'node.add',
      node: { id: 'text-2', type: 'text', props: { content: 'Added' } },
      destination: { kind: 'root', index: 1 },
    })).toEqual({ ok: true, changed: true })
    expect(session.document.rootNodes.value.map(node => node.id)).toEqual(['text-1', 'text-2'])

    instance.dispose()
  })

  it('imports and exports final DocumentSchema through the registered session', () => {
    const instance = createNextDesignerHarness({
      componentMap: {},
      materials: [{ type: 'text', presentation: { kind: 'headless' } }],
      schema,
    })
    const replacement: DocumentSchema = {
      version: '1',
      globalConfig: { title: 'Replacement' },
      page: { props: {} },
      nodes: [{ id: 'text-2', type: 'text', props: { content: 'Replacement' } }],
      structure: { root: ['text-2'], containers: {} },
    }

    expect(instance.importSchema(replacement)).toEqual({ ok: true, changed: true })
    expect(instance.exportSchema()).toEqual(replacement)
    expect(instance.exportSchema()).not.toHaveProperty('root')

    instance.dispose()
  })
})
