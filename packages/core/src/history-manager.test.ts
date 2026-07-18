import type { DesignerSchema } from './types'
import { describe, expect, it, vi } from 'vitest'
import { EventHub } from './event-hub'
import { createHistoryManager } from './history-manager'
import { createSchemaStore } from './schema-store'

function makeSchema(label: string): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: {},
    root: { id: 'root', type: 'root', props: { label }, children: [] },
  }
}

function setup(maxSize = 50) {
  const store = createSchemaStore(makeSchema('initial'))
  const eventHub = new EventHub()
  const history = createHistoryManager(store, eventHub, maxSize)
  return { store, eventHub, history }
}

describe('createHistoryManager', () => {
  it('starts with empty undo/redo stacks', () => {
    const { history } = setup()
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
    expect(history.state.value).toEqual({
      canUndo: false,
      canRedo: false,
      undoCount: 0,
      redoCount: 0,
    })
  })

  it('pushSnapshot enables undo', () => {
    const { store, history } = setup()
    const before = store.getSchema()
    store.setSchema(makeSchema('changed'))
    history.pushSnapshot('test', before)
    expect(history.canUndo()).toBe(true)
    expect(history.canRedo()).toBe(false)
  })

  it('keeps public snapshots isolated from later caller mutations', () => {
    const { store, history } = setup()
    const before = makeSchema('before')
    history.pushSnapshot('test', before)
    before.root.props.label = 'mutated-after-push'
    store.setSchema(makeSchema('after'))

    history.undo()

    expect(store.schema.value.root.props.label).toBe('before')
  })

  it('undo restores previous snapshot and enables redo', () => {
    const { store, history } = setup()
    const before = store.getSchema()
    store.setSchema(makeSchema('changed'))
    history.pushSnapshot('test', before)

    history.undo()
    expect(store.schema.value.root.props.label).toBe('initial')
    expect(history.canRedo()).toBe(true)
    expect(history.canUndo()).toBe(false)
    expect(history.state.value).toMatchObject({ canUndo: false, canRedo: true, undoCount: 0, redoCount: 1 })
  })

  it('redo restores undone snapshot', () => {
    const { store, history } = setup()
    const before = store.getSchema()
    store.setSchema(makeSchema('changed'))
    history.pushSnapshot('test', before)

    history.undo()
    history.redo()
    expect(store.schema.value.root.props.label).toBe('changed')
    expect(history.canUndo()).toBe(true)
    expect(history.canRedo()).toBe(false)
  })

  it('undo does nothing when stack is empty', () => {
    const { store, history } = setup()
    const snap = store.getSchema()
    history.undo()
    expect(store.schema.value).toEqual(snap)
  })

  it('redo does nothing when stack is empty', () => {
    const { store, history } = setup()
    const snap = store.getSchema()
    history.redo()
    expect(store.schema.value).toEqual(snap)
  })

  it('pushSnapshot clears redo stack', () => {
    const { store, history } = setup()
    history.pushSnapshot('a', store.getSchema())
    store.setSchema(makeSchema('b'))
    history.undo()
    expect(history.canRedo()).toBe(true)

    store.setSchema(makeSchema('c'))
    history.pushSnapshot('c', store.getSchema())
    expect(history.canRedo()).toBe(false)
  })

  it('maxSize trims undo stack', () => {
    const { store, history } = setup(2)
    history.pushSnapshot('a', store.getSchema())
    store.setSchema(makeSchema('b'))
    history.pushSnapshot('b', store.getSchema())
    store.setSchema(makeSchema('c'))
    history.pushSnapshot('c', store.getSchema())

    // Stack was trimmed to maxSize=2, so 'a' is gone
    expect(history.canUndo()).toBe(true)
    history.undo() // restores 'c' snapshot
    history.undo() // restores 'b' snapshot
    expect(history.canUndo()).toBe(false)
  })

  it('emits HISTORY_CHANGED on push/undo/redo', () => {
    const { store, eventHub, history } = setup()
    const listener = vi.fn()
    eventHub.on('history:changed', listener)

    history.pushSnapshot('a', store.getSchema())
    expect(listener).toHaveBeenCalledTimes(1)

    history.undo()
    expect(listener).toHaveBeenCalledTimes(2)

    history.redo()
    expect(listener).toHaveBeenCalledTimes(3)
  })

  it('undo emits SCHEMA_CHANGED', () => {
    const { store, eventHub, history } = setup()
    const listener = vi.fn()
    eventHub.on('schema:changed', listener)

    history.pushSnapshot('a', store.getSchema())
    store.setSchema(makeSchema('b'))
    history.undo()
    expect(listener).toHaveBeenCalled()
  })

  describe('transactions', () => {
    it('transaction suppresses pushSnapshot', () => {
      const { store, history } = setup()
      history.beginTransaction()
      history.pushSnapshot('a', store.getSchema())
      history.pushSnapshot('b', store.getSchema())
      history.commitTransaction()

      // Only one undo entry (from commit)
      expect(history.canUndo()).toBe(true)
      history.undo()
      expect(history.canUndo()).toBe(false)
    })

    it('commitTransaction creates single undo entry', () => {
      const { store, history } = setup()
      history.beginTransaction('my-transaction')
      store.setSchema(makeSchema('changed'))
      history.commitTransaction()

      expect(history.canUndo()).toBe(true)
      history.undo()
      expect(store.schema.value.root.props.label).toBe('initial')
    })

    it('discardTransaction rolls back to pre-transaction state', () => {
      const { store, history } = setup()
      history.beginTransaction()
      store.setSchema(makeSchema('discarded'))
      history.discardTransaction()

      expect(store.schema.value.root.props.label).toBe('initial')
      expect(history.canUndo()).toBe(false)
    })

    it('discardTransaction emits the restored schema', () => {
      const { store, eventHub, history } = setup()
      const schemas: DesignerSchema[] = []
      const transactionStates: boolean[] = []
      eventHub.on('schema:changed', (schema) => {
        schemas.push(schema as DesignerSchema)
        transactionStates.push(history.isInTransaction())
      })
      history.beginTransaction()
      store.setSchema(makeSchema('discarded'))

      history.discardTransaction()

      expect(schemas.map(schema => schema.root.props.label)).toEqual(['initial'])
      expect(transactionStates).toEqual([false])
    })

    it('nested beginTransaction warns and ignores', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { history } = setup()
      history.beginTransaction()
      history.beginTransaction()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('already in progress'))
      warn.mockRestore()
      history.commitTransaction()
    })

    it('commitTransaction without begin warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { history } = setup()
      history.commitTransaction()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('No transaction'))
      warn.mockRestore()
    })

    it('discardTransaction without begin warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { history } = setup()
      history.discardTransaction()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('No transaction'))
      warn.mockRestore()
    })

    it('isInTransaction reflects state', () => {
      const { history } = setup()
      expect(history.isInTransaction()).toBe(false)
      history.beginTransaction()
      expect(history.isInTransaction()).toBe(true)
      history.commitTransaction()
      expect(history.isInTransaction()).toBe(false)
    })
  })

  it('clear resets all stacks and transaction', () => {
    const { store, eventHub, history } = setup()
    const listener = vi.fn()
    eventHub.on('history:changed', listener)

    history.pushSnapshot('a', store.getSchema())
    history.clear()
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
    expect(history.isInTransaction()).toBe(false)
  })
})
