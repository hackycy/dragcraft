import type { DocumentSchema } from '@dragcraft/core'
import type { DesignerSchema } from '@dragcraft/legacy-core'
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
  it('projects root and Region drop destinations for the shared drag seam', () => {
    const { session } = createFixture()
    expect(session.document.resolveDestination?.({ kind: 'root', index: 1 })).toMatchObject({
      ok: true,
      value: { destination: { kind: 'root', index: 1 } },
    })
    const region = session.document.resolveDestination?.({
      kind: 'container',
      containerId: 'layout',
      regionId: 'main',
      index: 1,
    })
    expect(region).toMatchObject({
      ok: true,
      value: {
        destination: { kind: 'container', containerId: 'layout', regionId: 'main', index: 1 },
        container: { id: 'layout' },
        region: { id: 'main' },
      },
    })
    if (region?.ok)
      expect(region.value.children.map(node => node.id)).toEqual(['region-child'])
  })

  it('projects type-defined presentation layouts without adding them to DocumentSchema', () => {
    const catalog = createMaterialCatalog([
      {
        type: 'navbar',
        authoring: { policy: { duplicate: 'denied' } },
        presentation: {
          kind: 'headless',
          layout: {
            placement: {
              kind: 'chrome',
              edge: 'block-start',
              reserve: { mode: 'measure', size: 44 },
            },
          },
        },
      },
      {
        type: 'floating-action',
        presentation: {
          kind: 'headless',
          layout: { placement: { kind: 'layer', mode: 'self' } },
        },
      },
      {
        type: 'tab-bar',
        presentation: {
          kind: 'headless',
          layout: { placement: { kind: 'chrome', edge: 'block-end' } },
        },
      },
      { type: 'text', presentation: { kind: 'headless' } },
    ])
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'generated',
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [
          { id: 'navbar-1', type: 'navbar', props: {} },
          { id: 'text-1', type: 'text', props: {} },
          { id: 'tab-bar-1', type: 'tab-bar', props: {} },
          { id: 'action-1', type: 'floating-action', props: {} },
        ],
        structure: { root: ['navbar-1', 'text-1', 'tab-bar-1', 'action-1'], containers: {} },
      },
    })
    const session = createNextDesignerSessionAdapter({ catalog, engine })

    expect(session.materials.resolveLayout(session.document.getNode('navbar-1')!)).toEqual({
      placement: {
        kind: 'chrome',
        edge: 'block-start',
        position: 'fixed',
        reserve: { mode: 'measure', size: 44 },
        avoidContent: true,
      },
      sortScope: false,
      visible: true,
    })
    expect(session.materials.resolveLayout(session.document.getNode('action-1')!)).toEqual({
      placement: {
        kind: 'layer',
        layer: 'float',
        mode: 'self',
        anchor: { block: 'end', inline: 'end' },
        avoid: ['safe-area', 'chrome'],
      },
      sortScope: false,
      visible: true,
    })
    expect(session.document.getStructurePosition('navbar-1')).toMatchObject({
      owner: { kind: 'root' },
      index: 0,
      siblingCount: 4,
      sortScope: false,
    })
    expect(session.document.getStructurePosition('tab-bar-1')).toMatchObject({
      owner: { kind: 'root' },
      index: 2,
      siblingCount: 4,
      sortScope: false,
    })
    expect(session.document.getStructurePosition('action-1')).toMatchObject({
      owner: { kind: 'root' },
      index: 3,
      siblingCount: 4,
      sortScope: false,
    })
    expect(session.document.getStructurePosition('text-1')).toMatchObject({
      owner: { kind: 'root', sortScope: 'content' },
      index: 0,
      siblingCount: 1,
      sortScope: 'content',
    })
    expect(session.materials.canCreateSubtree(session.document.getNode('navbar-1')!)).toBe(false)
    expect(session.evaluate({ type: 'node.duplicate', nodeId: 'navbar-1' })).toEqual({
      allowed: false,
      code: 'POLICY_DENIED',
    })
    expect(session.execute({ type: 'node.duplicate', nodeId: 'navbar-1' })).toEqual({
      ok: false,
      code: 'POLICY_DENIED',
    })
    expect(session.materials.canCreateSubtree(session.document.getNode('text-1')!)).toBe(true)
    expect(session.exportSchema()?.nodes).toEqual([
      { id: 'navbar-1', type: 'navbar', props: {} },
      { id: 'text-1', type: 'text', props: {} },
      { id: 'tab-bar-1', type: 'tab-bar', props: {} },
      { id: 'action-1', type: 'floating-action', props: {} },
    ])
  })

  it('applies material creation policy to bundle drops without committing history', () => {
    const catalog = createMaterialCatalog([
      {
        type: 'tab-bar',
        presentation: { kind: 'headless' },
        authoring: {
          policy: {
            create: ({ schema }) => schema.nodes.some(node => node.type === 'tab-bar') ? 'denied' : 'allowed',
          },
        },
      },
    ])
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'generated',
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [{ id: 'existing-tab-bar', type: 'tab-bar', props: {} }],
        structure: { root: ['existing-tab-bar'], containers: {} },
      },
    })
    const session = createNextDesignerSessionAdapter({ catalog, engine })
    const action = {
      type: 'node.add' as const,
      node: { id: 'new-tab-bar', type: 'tab-bar', props: {} },
      destination: { kind: 'root' as const, index: 1 },
    }

    expect(session.evaluate(action)).toEqual({ allowed: false, code: 'POLICY_DENIED' })
    expect(session.execute(action)).toEqual({ ok: false, code: 'POLICY_DENIED' })
    expect(session.state.history.value).toMatchObject({ canUndo: false, undoCount: 0 })
    const creatable = session.materials.get('tab-bar')?.creatable
    expect(typeof creatable).toBe('function')
    if (typeof creatable === 'function') {
      expect(creatable({
        widgetType: 'tab-bar',
        schema: session.document.schema!.value,
      })).toEqual({ allowed: false, code: 'POLICY_DENIED' })
    }
  })

  it('builds catalog-declared container Regions for legacy node additions', () => {
    const catalog = createMaterialCatalog([{
      type: 'flex-container',
      presentation: { kind: 'headless' },
      schema: { container: { regions: [{ id: 'default' }] } },
    }])
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'generated',
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [],
        structure: { root: [], containers: {} },
      },
    })
    const session = createNextDesignerSessionAdapter({ catalog, engine })

    expect(session.execute({
      type: 'node.add',
      node: { id: 'new-flex', type: 'flex-container', props: { gap: 12 } },
      destination: { kind: 'root', index: 0 },
    })).toEqual({ ok: true, changed: true })
    expect(session.exportSchema()).toMatchObject({
      nodes: [{ id: 'new-flex', type: 'flex-container', props: { gap: 12 } }],
      structure: { root: ['new-flex'], containers: { 'new-flex': { regions: { default: [] } } } },
    })
  })

  it('rejects non-flow materials for container Region destinations before committing', () => {
    const catalog = createMaterialCatalog([
      {
        type: 'layout',
        presentation: { kind: 'headless' },
        schema: { container: { regions: [{ id: 'main' }] } },
      },
      {
        type: 'navbar',
        presentation: { kind: 'headless', layout: { placement: { kind: 'chrome', edge: 'block-start' } } },
      },
    ])
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'generated',
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [
          { id: 'layout', type: 'layout', props: {} },
          { id: 'navbar', type: 'navbar', props: {} },
        ],
        structure: {
          root: ['layout', 'navbar'],
          containers: { layout: { regions: { main: [] } } },
        },
      },
    })
    const session = createNextDesignerSessionAdapter({ catalog, engine })
    const destination = { kind: 'container' as const, containerId: 'layout', regionId: 'main', index: 0 }

    expect(session.evaluate({
      type: 'node.add',
      node: { id: 'new-navbar', type: 'navbar', props: {} },
      destination,
    })).toEqual({ allowed: false, code: 'CONTAINER_NON_FLOW_MATERIAL' })
    expect(session.execute({ type: 'node.move', nodeId: 'navbar', destination })).toEqual({
      ok: false,
      code: 'CONTAINER_NON_FLOW_MATERIAL',
    })
    expect(session.document.getOwner('navbar')).toEqual({ kind: 'root' })
    expect(session.state.history.value).toMatchObject({ canUndo: false, undoCount: 0 })
  })

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

  it('imports final Documents without converting Legacy schemas', () => {
    const { session } = createFixture()
    const replacement: DocumentSchema = {
      version: '1',
      globalConfig: { replacement: true },
      page: { props: {} },
      nodes: [{ id: 'replacement', type: 'text', props: {} }],
      structure: { root: ['replacement'], containers: {} },
    }

    const action = {
      type: 'schema.import' as const,
      schema: replacement as unknown as DesignerSchema,
    }
    expect(session.evaluate(action)).toEqual({ allowed: true })
    expect(session.execute(action)).toEqual({ ok: true, changed: true })
    expect(session.document.rootNodes.value.map(node => node.id)).toEqual(['replacement'])
    expect(session.state.history.value).toMatchObject({ canRedo: false, canUndo: false })
    expect(session.evaluate({
      type: 'schema.import',
      schema: { version: '1', globalConfig: {}, root: { id: 'root', type: 'root', props: {} } },
    })).toEqual({ allowed: false, code: 'SCHEMA_IMPORT_REJECTED' })
  })
})
