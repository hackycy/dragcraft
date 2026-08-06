import type { DocumentSchema } from '@dragcraft/core'
import { describe, expect, it } from 'vitest'
import { createMaterialCatalog } from '../materials/create-material-catalog'
import { createAuthoringConfirmationCoordinator } from './create-authoring-confirmation-coordinator'
import { createAuthoringEngine } from './create-authoring-engine'

describe('authoring confirmation coordinator', () => {
  it('confirms protected batch children in order and commits once', async () => {
    const catalog = createMaterialCatalog([{
      type: 'protected-text',
      authoring: { policy: { remove: 'confirmation-required' } },
      presentation: { kind: 'headless' },
    }])
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'first', type: 'protected-text', props: {} },
        { id: 'second', type: 'protected-text', props: {} },
      ],
      structure: { root: ['first', 'second'], containers: {} },
    }
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'unused',
      schema,
    })
    const confirmations: Array<{
      readonly nodeId?: string
      readonly resolve: (confirmed: boolean) => void
    }> = []
    const coordinator = createAuthoringConfirmationCoordinator({
      catalog,
      engine,
      confirm(request) {
        return new Promise<boolean>((resolve) => {
          confirmations.push({ nodeId: request.nodeId, resolve })
        })
      },
    })

    expect(coordinator.execute({
      type: 'batch',
      actions: [
        { type: 'remove-node', nodeId: 'first' },
        { type: 'remove-node', nodeId: 'second' },
      ],
    })).toEqual({
      status: 'confirmation-required',
      code: 'POLICY_CONFIRMATION_REQUIRED',
      actionIndex: 0,
    })
    expect(confirmations.map(item => item.nodeId)).toEqual(['first'])
    expect(engine.document.value).toMatchObject({ schema: { structure: { root: ['first', 'second'] } } })

    confirmations[0]!.resolve(true)
    await Promise.resolve()
    await Promise.resolve()

    expect(confirmations.map(item => item.nodeId)).toEqual(['first', 'second'])
    expect(engine.document.value).toMatchObject({ schema: { structure: { root: ['first', 'second'] } } })

    confirmations[1]!.resolve(true)
    await Promise.resolve()
    await Promise.resolve()

    expect(engine.document.value).toMatchObject({ schema: { structure: { root: [] } } })
    expect(engine.history.undoCount.value).toBe(1)
  })

  it('fails closed after cancellation and allows a later attempt', async () => {
    const catalog = createMaterialCatalog([{
      type: 'protected-text',
      authoring: { policy: { remove: 'confirmation-required' } },
      presentation: { kind: 'headless' },
    }])
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'protected-1', type: 'protected-text', props: {} }],
      structure: { root: ['protected-1'], containers: {} },
    }
    const engine = createAuthoringEngine({
      catalog,
      createNodeId: () => 'unused',
      schema,
    })
    const confirmations: Array<(confirmed: boolean) => void> = []
    const coordinator = createAuthoringConfirmationCoordinator({
      catalog,
      engine,
      confirm: () => new Promise<boolean>(resolve => confirmations.push(resolve)),
    })

    coordinator.execute({ type: 'remove-node', nodeId: 'protected-1' })
    confirmations[0]!(false)
    await Promise.resolve()

    expect(coordinator.execute({ type: 'remove-node', nodeId: 'protected-1' })).toEqual({
      status: 'confirmation-required',
      code: 'POLICY_CONFIRMATION_REQUIRED',
    })
    expect(confirmations).toHaveLength(2)
    expect(engine.document.value).toMatchObject({ schema: { structure: { root: ['protected-1'] } } })
  })

  it('keeps selection responsive while blocking Schema and history actions during confirmation', async () => {
    const catalog = createMaterialCatalog([{
      type: 'protected-text',
      authoring: { policy: { remove: 'confirmation-required' } },
      presentation: { kind: 'headless' },
    }])
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'protected-1', type: 'protected-text', props: {} }],
      structure: { root: ['protected-1'], containers: {} },
    }
    const engine = createAuthoringEngine({ catalog, createNodeId: () => 'unused', schema })
    let cancel!: (confirmed: boolean) => void
    const coordinator = createAuthoringConfirmationCoordinator({
      catalog,
      engine,
      confirm: () => new Promise<boolean>((resolve) => { cancel = resolve }),
    })

    coordinator.execute({ type: 'remove-node', nodeId: 'protected-1' })

    expect(coordinator.execute({ type: 'undo' })).toEqual({
      status: 'rejected',
      code: 'CONFIRMATION_PENDING',
    })
    expect(coordinator.execute({
      type: 'update-global-config',
      globalConfig: { blocked: true },
    })).toEqual({ status: 'rejected', code: 'CONFIRMATION_PENDING' })
    expect(coordinator.execute({ type: 'select-node', nodeId: 'protected-1' }))
      .toEqual({ status: 'committed' })
    expect(engine.selection.selectedNodeId.value).toBe('protected-1')

    cancel(false)
    await Promise.resolve()
  })

  it('discards confirmations made stale by programmatic changes or disposal', async () => {
    const catalog = createMaterialCatalog([{
      type: 'protected-text',
      authoring: { policy: { remove: 'confirmation-required' } },
      presentation: { kind: 'headless' },
    }])
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'protected-1', type: 'protected-text', props: {} }],
      structure: { root: ['protected-1'], containers: {} },
    }
    const engine = createAuthoringEngine({ catalog, createNodeId: () => 'unused', schema })
    const confirmations: Array<(confirmed: boolean) => void> = []
    const coordinator = createAuthoringConfirmationCoordinator({
      catalog,
      engine,
      confirm: () => new Promise<boolean>(resolve => confirmations.push(resolve)),
    })

    coordinator.execute({ type: 'remove-node', nodeId: 'protected-1' })
    expect(engine.execute({ type: 'update-global-config', globalConfig: { changed: true } }))
      .toEqual({ status: 'committed' })
    confirmations[0]!(true)
    await Promise.resolve()
    expect(engine.document.value).toMatchObject({ schema: { structure: { root: ['protected-1'] } } })

    coordinator.execute({ type: 'remove-node', nodeId: 'protected-1' })
    coordinator.dispose()
    confirmations[1]!(true)
    await Promise.resolve()
    expect(engine.document.value).toMatchObject({ schema: { structure: { root: ['protected-1'] } } })
  })

  it('fails closed when the host callback throws or rejects', async () => {
    const catalog = createMaterialCatalog([{
      type: 'protected-text',
      authoring: { policy: { remove: 'confirmation-required' } },
      presentation: { kind: 'headless' },
    }])
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'protected-1', type: 'protected-text', props: {} }],
      structure: { root: ['protected-1'], containers: {} },
    }
    const engine = createAuthoringEngine({ catalog, createNodeId: () => 'unused', schema })
    let calls = 0
    const coordinator = createAuthoringConfirmationCoordinator({
      catalog,
      engine,
      confirm() {
        calls += 1
        if (calls === 1)
          throw new Error('host failed')
        return Promise.reject(new Error('host rejected'))
      },
    })

    expect(coordinator.execute({ type: 'remove-node', nodeId: 'protected-1' }).status)
      .toBe('confirmation-required')
    expect(coordinator.execute({ type: 'remove-node', nodeId: 'protected-1' }).status)
      .toBe('confirmation-required')
    await Promise.resolve()
    expect(coordinator.execute({ type: 'remove-node', nodeId: 'protected-1' }).status)
      .toBe('confirmation-required')
    expect(calls).toBe(3)
    expect(engine.document.value).toMatchObject({ schema: { structure: { root: ['protected-1'] } } })
  })
})
