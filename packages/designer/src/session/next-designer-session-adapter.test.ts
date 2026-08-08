import type { DocumentSchema } from '@dragcraft/core'
import { describe, expect, it } from 'vitest'
import { createAuthoringEngine } from '../authoring/create-authoring-engine'
import { createMaterialCatalog } from '../materials/create-material-catalog'
import { describeDesignerSessionContract } from './designer-session-contract'
import {
  createNextDesignerSessionAdapter,
  createNextDesignerSessionHostState,
} from './next-designer-session-adapter'

function createFixture() {
  const catalog = createMaterialCatalog([
    { type: 'text', panel: { title: 'Text' }, presentation: { kind: 'headless' } },
    {
      type: 'layout',
      panel: { title: 'Layout' },
      presentation: { kind: 'headless' },
      schema: { container: { regions: [{ id: 'main' }] } },
    },
  ])
  const schema: DocumentSchema = {
    version: '1',
    globalConfig: {},
    page: { props: {} },
    nodes: [
      { id: 'ordinary', type: 'text', props: {} },
      { id: 'layout', type: 'layout', props: {} },
      { id: 'region-child', type: 'text', props: {} },
    ],
    structure: {
      root: ['ordinary', 'layout'],
      containers: { layout: { regions: { main: ['region-child'] } } },
    },
  }
  const engine = createAuthoringEngine({
    catalog,
    createNodeId: () => 'generated',
    schema,
  })
  const hostState = createNextDesignerSessionHostState()
  const session = createNextDesignerSessionAdapter({ catalog, engine, hostState })

  return {
    session,
    engine,
    select: (nodeId: string | null) => engine.execute({ type: 'select-node', nodeId }),
    hover: (nodeId: string | null) => engine.execute({ type: 'hover-node', nodeId }),
    setDragTarget: (nodeId: string | null) => {
      hostState.dragTarget.value = nodeId
        ? { sourceNodeId: nodeId, widgetType: null }
        : null
    },
    addHistoryEntry: () => engine.execute({ type: 'update-global-config', globalConfig: { changed: true } }),
  }
}

describeDesignerSessionContract('Next adapter', createFixture)

describe('next adapter backend contract', () => {
  it('translates node creation and root/Region moves into one Next history path', () => {
    const { session } = createFixture()
    expect(session.execute({
      type: 'node.add',
      node: { id: 'added', type: 'text', props: {} },
      destination: { kind: 'root', index: 0 },
    })).toEqual({ ok: true, changed: true })
    expect(session.document.rootNodes.value.map(node => node.id)).toEqual(['added', 'ordinary', 'layout'])
    expect(session.execute({
      type: 'node.move',
      nodeId: 'ordinary',
      destination: { kind: 'container', containerId: 'layout', regionId: 'main', index: 1 },
    })).toEqual({ ok: true, changed: true })
    expect(session.document.getRegionNodes('layout', 'main').map(node => node.id)).toEqual(['region-child', 'ordinary'])
    expect(session.state.history.value.undoCount).toBe(2)
  })

  it('keeps unknown nodes selectable but read-only and recovers conflicted containers', () => {
    const catalog = createMaterialCatalog([{
      type: 'layout',
      presentation: { kind: 'headless' },
      schema: { container: { regions: [{ id: 'main' }] } },
    }])
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'generated',
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [
          { id: 'unknown', type: 'external', props: {} },
          { id: 'layout', type: 'layout', props: {} },
        ],
        structure: {
          root: ['unknown', 'layout'],
          containers: { layout: { regions: { main: [], side: [] } } },
        },
      },
    })
    const session = createNextDesignerSessionAdapter({ catalog, engine })

    expect(engine.document.value.status).toBe('conflicted')
    expect(session.materials.resolveCapability(session.document.getNode('unknown')!, 'selectable')).toBe(true)
    expect(session.materials.resolveCapability(session.document.getNode('unknown')!, 'configurable')).toBe(false)
    expect(session.materials.resolveContainer(session.document.getNode('layout')!)).toMatchObject({
      ok: false,
      code: 'CONTAINER_UNRESOLVED',
    })
  })

  it('exports detached JSON snapshots without exposing the engine document', () => {
    const { session } = createFixture()
    const exported = session.exportSchema()!
    exported.nodes[0]!.props.changed = true
    expect(session.document.getNode('ordinary')?.props).not.toHaveProperty('changed')
    expect(JSON.parse(JSON.stringify(session.exportSchema()))).toEqual(session.exportSchema())
  })
})
