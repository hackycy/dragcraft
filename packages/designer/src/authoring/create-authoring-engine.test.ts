import type { DocumentSchema } from '@dragcraft/core'
import { describe, expect, it } from 'vitest'
import { createMaterialCatalog } from '../materials/create-material-catalog'
import { createAuthoringEngine } from './create-authoring-engine'

function emptyDocument(): DocumentSchema {
  return {
    version: '1',
    globalConfig: {},
    page: { props: {} },
    nodes: [],
    structure: { root: [], containers: {} },
  }
}

describe('createAuthoringEngine', () => {
  it('commits a created material through the sole execute interface', () => {
    const catalog = createMaterialCatalog([{
      type: 'text',
      schema: { defaultProps: { value: 'Hello' } },
      presentation: { kind: 'headless' },
    }])
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'text-1',
      schema: emptyDocument(),
    })

    expect(engine.execute({
      type: 'create-node',
      materialType: 'text',
      to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
    })).toEqual({ status: 'committed' })
    expect(engine.document.value).toMatchObject({
      status: 'ready',
      schema: {
        nodes: [{ id: 'text-1', type: 'text', props: { value: 'Hello' } }],
        structure: { root: ['text-1'] },
      },
    })
    expect(engine.history.canUndo.value).toBe(true)
  })

  it('moves a node using an owner-relative structural destination', () => {
    const catalog = createMaterialCatalog([
      { type: 'text', presentation: { kind: 'headless' } },
    ])
    const schema = emptyDocument()
    schema.nodes.push(
      { id: 'first', type: 'text', props: {} },
      { id: 'second', type: 'text', props: {} },
    )
    schema.structure.root.push('first', 'second')
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'unused',
      schema,
    })

    expect(engine.execute({
      type: 'move-node',
      nodeId: 'first',
      to: {
        owner: { kind: 'page-root' },
        position: { kind: 'after', nodeId: 'second' },
      },
    })).toEqual({ status: 'committed' })
    expect(engine.document.value).toMatchObject({
      schema: { structure: { root: ['second', 'first'] } },
    })
  })

  it('removes a node through the Core domain operation', () => {
    const catalog = createMaterialCatalog([
      { type: 'text', presentation: { kind: 'headless' } },
    ])
    const schema = emptyDocument()
    schema.nodes.push({ id: 'text-1', type: 'text', props: {} })
    schema.structure.root.push('text-1')
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'unused',
      schema,
    })

    expect(engine.execute({ type: 'remove-node', nodeId: 'text-1' })).toEqual({
      status: 'committed',
    })
    expect(engine.document.value).toMatchObject({
      schema: { nodes: [], structure: { root: [] } },
    })
  })

  it('unwraps a container as one authoring action', () => {
    const catalog = createMaterialCatalog([
      {
        type: 'columns',
        schema: { container: { regions: [{ id: 'main' }, { id: 'aside' }] } },
        presentation: { kind: 'headless' },
      },
      { type: 'text', presentation: { kind: 'headless' } },
    ])
    const schema = emptyDocument()
    schema.nodes.push(
      { id: 'columns-1', type: 'columns', props: {} },
      { id: 'main-child', type: 'text', props: {} },
      { id: 'aside-child', type: 'text', props: {} },
    )
    schema.structure.root.push('columns-1')
    schema.structure.containers['columns-1'] = {
      regions: { main: ['main-child'], aside: ['aside-child'] },
    }
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'unused',
      schema,
    })

    expect(engine.execute({ type: 'unwrap-container', containerId: 'columns-1' })).toEqual({
      status: 'committed',
    })
    expect(engine.document.value).toMatchObject({
      schema: {
        structure: { root: ['main-child', 'aside-child'], containers: {} },
      },
    })
  })

  it('updates node data without exposing the Core operation', () => {
    const catalog = createMaterialCatalog([
      { type: 'text', presentation: { kind: 'headless' } },
    ])
    const schema = emptyDocument()
    schema.nodes.push({ id: 'text-1', type: 'text', props: { value: 'Before' } })
    schema.structure.root.push('text-1')
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'unused',
      schema,
    })

    expect(engine.execute({
      type: 'update-node',
      nodeId: 'text-1',
      node: {
        type: 'text',
        props: { value: 'After' },
        style: { color: 'red' },
      },
    })).toEqual({ status: 'committed' })
    expect(engine.document.value).toMatchObject({
      schema: {
        nodes: [{
          id: 'text-1',
          type: 'text',
          props: { value: 'After' },
          style: { color: 'red' },
        }],
      },
    })
  })

  it('updates global configuration through execute', () => {
    const engine = createAuthoringEngine({
      catalog: createMaterialCatalog([]),
      createNodeId: () => 'unused',
      schema: emptyDocument(),
    })

    expect(engine.execute({
      type: 'update-global-config',
      globalConfig: { locale: 'zh-CN' },
    })).toEqual({ status: 'committed' })
    expect(engine.document.value).toMatchObject({
      schema: { globalConfig: { locale: 'zh-CN' } },
    })
  })

  it('updates the page singleton through execute', () => {
    const engine = createAuthoringEngine({
      catalog: createMaterialCatalog([]),
      createNodeId: () => 'unused',
      schema: emptyDocument(),
    })

    expect(engine.execute({
      type: 'update-page',
      page: { props: { title: 'Home' }, style: { background: 'white' } },
    })).toEqual({ status: 'committed' })
    expect(engine.document.value).toMatchObject({
      schema: {
        page: { props: { title: 'Home' }, style: { background: 'white' } },
      },
    })
  })

  it('duplicates a complete container aggregate through insert-bundle', () => {
    const catalog = createMaterialCatalog([
      {
        type: 'card',
        schema: { container: { regions: [{ id: 'content' }] } },
        presentation: { kind: 'headless' },
      },
      { type: 'text', presentation: { kind: 'headless' } },
    ])
    const schema = emptyDocument()
    schema.nodes.push(
      { id: 'card-1', type: 'card', props: { title: 'Original' } },
      { id: 'text-1', type: 'text', props: { value: 'Child' } },
    )
    schema.structure.root.push('card-1')
    schema.structure.containers['card-1'] = { regions: { content: ['text-1'] } }
    const generatedIds = ['card-copy', 'text-copy']
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => generatedIds.shift()!,
      schema,
    })

    expect(engine.execute({
      type: 'duplicate-node',
      nodeId: 'card-1',
      to: {
        owner: { kind: 'page-root' },
        position: { kind: 'after', nodeId: 'card-1' },
      },
    })).toEqual({ status: 'committed' })
    expect(engine.document.value).toMatchObject({
      schema: {
        nodes: [
          { id: 'card-1', type: 'card', props: { title: 'Original' } },
          { id: 'text-1', type: 'text', props: { value: 'Child' } },
          { id: 'card-copy', type: 'card', props: { title: 'Original' } },
          { id: 'text-copy', type: 'text', props: { value: 'Child' } },
        ],
        structure: {
          root: ['card-1', 'card-copy'],
          containers: {
            'card-copy': { regions: { content: ['text-copy'] } },
          },
        },
      },
    })
  })

  it('commits an authoring batch as one history entry', () => {
    const engine = createAuthoringEngine({
      catalog: createMaterialCatalog([]),
      createNodeId: () => 'unused',
      schema: emptyDocument(),
    })

    expect(engine.execute({
      type: 'batch',
      actions: [
        { type: 'update-page', page: { props: { title: 'Home' } } },
        { type: 'update-global-config', globalConfig: { locale: 'en-US' } },
      ],
    })).toEqual({ status: 'committed' })
    expect(engine.document.value).toMatchObject({
      schema: {
        page: { props: { title: 'Home' } },
        globalConfig: { locale: 'en-US' },
      },
    })
    expect(engine.history.undoCount.value).toBe(1)
  })

  it('rejects an action denied by material Authoring Policy without history', () => {
    const catalog = createMaterialCatalog([{
      type: 'locked-text',
      authoring: { policy: { remove: 'denied' } },
      presentation: { kind: 'headless' },
    }])
    const schema = emptyDocument()
    schema.nodes.push({ id: 'locked-1', type: 'locked-text', props: {} })
    schema.structure.root.push('locked-1')
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'unused',
      schema,
    })
    const before = engine.document.value

    expect(engine.execute({ type: 'remove-node', nodeId: 'locked-1' })).toEqual({
      status: 'rejected',
      code: 'POLICY_DENIED',
    })
    expect(engine.document.value).toBe(before)
    expect(engine.history.undoCount.value).toBe(0)
  })

  it('requires explicit confirmation before a protected action is compiled', () => {
    const catalog = createMaterialCatalog([{
      type: 'protected-text',
      authoring: { policy: { remove: 'confirmation-required' } },
      presentation: { kind: 'headless' },
    }])
    const schema = emptyDocument()
    schema.nodes.push({ id: 'protected-1', type: 'protected-text', props: {} })
    schema.structure.root.push('protected-1')
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'unused',
      schema,
    })

    expect(engine.execute({ type: 'remove-node', nodeId: 'protected-1' })).toEqual({
      status: 'confirmation-required',
      code: 'POLICY_CONFIRMATION_REQUIRED',
    })
    expect(engine.execute({
      type: 'remove-node',
      nodeId: 'protected-1',
      confirmed: true,
    })).toEqual({ status: 'committed' })
  })

  it('undoes and redoes by moving the immutable snapshot cursor', () => {
    const engine = createAuthoringEngine({
      catalog: createMaterialCatalog([]),
      createNodeId: () => 'unused',
      schema: emptyDocument(),
    })
    engine.execute({ type: 'update-global-config', globalConfig: { step: 1 } })
    engine.execute({ type: 'update-global-config', globalConfig: { step: 2 } })

    expect(engine.execute({ type: 'undo' })).toEqual({ status: 'committed' })
    expect(engine.document.value).toMatchObject({ schema: { globalConfig: { step: 1 } } })
    expect(engine.history.canRedo.value).toBe(true)
    expect(engine.execute({ type: 'redo' })).toEqual({ status: 'committed' })
    expect(engine.document.value).toMatchObject({ schema: { globalConfig: { step: 2 } } })
  })

  it('disables snapshot retention when maxHistoryEntries is zero', () => {
    const engine = createAuthoringEngine({
      catalog: createMaterialCatalog([]),
      createNodeId: () => 'unused',
      maxHistoryEntries: 0,
      schema: emptyDocument(),
    })

    expect(engine.execute({
      type: 'update-global-config',
      globalConfig: { saved: true },
    })).toEqual({ status: 'committed' })
    expect(engine.history.canUndo.value).toBe(false)
    expect(engine.history.undoCount.value).toBe(0)
    expect(engine.execute({ type: 'undo' })).toEqual({ status: 'unchanged' })
    expect(engine.document.value).toMatchObject({ schema: { globalConfig: { saved: true } } })
  })

  it('updates reactive selection and hover state without writing history', () => {
    const catalog = createMaterialCatalog([
      { type: 'text', presentation: { kind: 'headless' } },
    ])
    const schema = emptyDocument()
    schema.nodes.push({ id: 'text-1', type: 'text', props: {} })
    schema.structure.root.push('text-1')
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'unused',
      schema,
    })

    expect(engine.execute({ type: 'select-node', nodeId: 'text-1' })).toEqual({
      status: 'committed',
    })
    expect(engine.execute({ type: 'hover-node', nodeId: 'text-1' })).toEqual({
      status: 'committed',
    })
    expect(engine.selection.selectedNodeId.value).toBe('text-1')
    expect(engine.selection.hoveredNodeId.value).toBe('text-1')
    expect(engine.history.undoCount.value).toBe(0)
  })

  it('repairs selection after a commit without restoring it from history', () => {
    const catalog = createMaterialCatalog([
      { type: 'text', presentation: { kind: 'headless' } },
    ])
    const schema = emptyDocument()
    schema.nodes.push({ id: 'text-1', type: 'text', props: {} })
    schema.structure.root.push('text-1')
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'unused',
      schema,
    })
    engine.execute({ type: 'select-node', nodeId: 'text-1' })
    engine.execute({ type: 'hover-node', nodeId: 'text-1' })

    engine.execute({ type: 'remove-node', nodeId: 'text-1' })
    expect(engine.selection.selectedNodeId.value).toBeNull()
    expect(engine.selection.hoveredNodeId.value).toBeNull()

    engine.execute({ type: 'undo' })
    expect(engine.document.value).toMatchObject({ schema: { structure: { root: ['text-1'] } } })
    expect(engine.selection.selectedNodeId.value).toBeNull()
    expect(engine.selection.hoveredNodeId.value).toBeNull()
  })

  it('does not write history for no-op or rejected document actions', () => {
    const engine = createAuthoringEngine({
      catalog: createMaterialCatalog([]),
      createNodeId: () => 'unused',
      schema: emptyDocument(),
    })
    const before = engine.document.value

    expect(engine.execute({ type: 'update-global-config', globalConfig: {} })).toEqual({
      status: 'unchanged',
    })
    expect(engine.document.value).toBe(before)
    expect(engine.execute({
      type: 'move-node',
      nodeId: 'missing',
      to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
    })).toMatchObject({ status: 'rejected', code: 'NODE_NOT_FOUND' })
    expect(engine.document.value).toBe(before)
    expect(engine.history.undoCount.value).toBe(0)
  })

  it('retains at most the configured number of history entries', () => {
    const engine = createAuthoringEngine({
      catalog: createMaterialCatalog([]),
      createNodeId: () => 'unused',
      maxHistoryEntries: 2,
      schema: emptyDocument(),
    })
    for (const step of [1, 2, 3])
      engine.execute({ type: 'update-global-config', globalConfig: { step } })

    expect(engine.history.undoCount.value).toBe(2)
    engine.execute({ type: 'undo' })
    engine.execute({ type: 'undo' })
    expect(engine.document.value).toMatchObject({ schema: { globalConfig: { step: 1 } } })
    expect(engine.execute({ type: 'undo' })).toEqual({ status: 'unchanged' })
  })

  it('uses the default history capacity of fifty entries', () => {
    const engine = createAuthoringEngine({
      catalog: createMaterialCatalog([]),
      createNodeId: () => 'unused',
      schema: emptyDocument(),
    })
    for (let step = 1; step <= 51; step++)
      engine.execute({ type: 'update-global-config', globalConfig: { step } })

    expect(engine.history.undoCount.value).toBe(50)
  })

  it('truncates the redo branch when a new commit follows undo', () => {
    const engine = createAuthoringEngine({
      catalog: createMaterialCatalog([]),
      createNodeId: () => 'unused',
      schema: emptyDocument(),
    })
    engine.execute({ type: 'update-global-config', globalConfig: { step: 1 } })
    engine.execute({ type: 'update-global-config', globalConfig: { step: 2 } })
    engine.execute({ type: 'undo' })
    engine.execute({ type: 'update-global-config', globalConfig: { step: 3 } })

    expect(engine.history.canRedo.value).toBe(false)
    expect(engine.history.redoCount.value).toBe(0)
    expect(engine.execute({ type: 'redo' })).toEqual({ status: 'unchanged' })
    expect(engine.document.value).toMatchObject({ schema: { globalConfig: { step: 3 } } })
  })

  it('preserves degraded status and denies writes to unknown nodes', () => {
    const schema = emptyDocument()
    schema.nodes.push({ id: 'unknown-1', type: 'external', props: { value: 1 } })
    schema.structure.root.push('unknown-1')
    const engine = createAuthoringEngine({
      catalog: createMaterialCatalog([]),
      createNodeId: () => 'unused',
      schema,
    })

    expect(engine.execute({
      type: 'update-page',
      page: { props: { title: 'Still editable' } },
    })).toEqual({ status: 'committed' })
    expect(engine.document.value).toMatchObject({
      status: 'degraded',
      diagnostics: { items: [{ code: 'NODE_TYPE_UNRESOLVED' }] },
    })
    expect(engine.execute({
      type: 'update-node',
      nodeId: 'unknown-1',
      node: { type: 'external', props: { value: 2 } },
    })).toEqual({ status: 'rejected', code: 'NODE_READ_ONLY' })
  })
})
