import type { Ref } from 'vue'
import type { EventHub } from './event-hub'
import type { DesignerSchema, HistoryEntry, SchemaStoreInstance } from './types'
import { ref } from 'vue'
import { EventName } from './constants'
import { cloneSchemaRef } from './schema-utils'

export interface HistoryState {
  canUndo: boolean
  canRedo: boolean
  undoCount: number
  redoCount: number
}

export interface HistoryManagerInstance {
  readonly state: Readonly<Ref<HistoryState>>
  pushSnapshot: (label: string, before: DesignerSchema) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  beginTransaction: (label?: string) => void
  commitTransaction: () => void
  discardTransaction: () => void
  isInTransaction: () => boolean
  clear: () => void
}

export function createHistoryManager(
  store: SchemaStoreInstance,
  eventHub: EventHub,
  maxSize: number = 50,
): HistoryManagerInstance {
  const undoStack: HistoryEntry[] = []
  const redoStack: HistoryEntry[] = []
  const state = ref<HistoryState>({
    canUndo: false,
    canRedo: false,
    undoCount: 0,
    redoCount: 0,
  })

  let inTransaction = false
  let transactionLabel = ''
  let transactionSnapshot: DesignerSchema | null = null

  function resetTransaction(): void {
    inTransaction = false
    transactionLabel = ''
    transactionSnapshot = null
  }

  function trimUndoStack(): void {
    if (undoStack.length > maxSize)
      undoStack.splice(0, undoStack.length - maxSize)
  }

  function pushUndo(label: string, snapshot: DesignerSchema): void {
    undoStack.push({ label, snapshot })
    trimUndoStack()
    redoStack.length = 0
  }

  function emitChange(): void {
    const nextState = {
      canUndo: canUndo(),
      canRedo: canRedo(),
      undoCount: undoStack.length,
      redoCount: redoStack.length,
    }
    state.value = nextState
    eventHub.emit(EventName.HISTORY_CHANGED, nextState)
  }

  function pushSnapshot(label: string, before: DesignerSchema): void {
    if (inTransaction)
      return

    pushUndo(label, before)
    emitChange()
  }

  function undo(): void {
    if (!canUndo())
      return

    const entry = undoStack.pop()!
    const currentSnapshot = cloneSchemaRef(store.schema)
    redoStack.push({ label: entry.label, snapshot: currentSnapshot })

    store.setSchema(entry.snapshot)

    emitChange()
    eventHub.emit(EventName.SCHEMA_CHANGED, store.getSchema())
  }

  function redo(): void {
    if (!canRedo())
      return

    const entry = redoStack.pop()!
    const currentSnapshot = cloneSchemaRef(store.schema)
    undoStack.push({ label: entry.label, snapshot: currentSnapshot })
    trimUndoStack()

    store.setSchema(entry.snapshot)

    emitChange()
    eventHub.emit(EventName.SCHEMA_CHANGED, store.getSchema())
  }

  function canUndo(): boolean {
    return undoStack.length > 0
  }

  function canRedo(): boolean {
    return redoStack.length > 0
  }

  function beginTransaction(label?: string): void {
    if (inTransaction) {
      console.warn('[dragcraft/core] Transaction already in progress, ignoring beginTransaction')
      return
    }
    inTransaction = true
    transactionLabel = label ?? 'transaction'
    transactionSnapshot = cloneSchemaRef(store.schema)
  }

  function commitTransaction(): void {
    if (!inTransaction) {
      console.warn('[dragcraft/core] No transaction in progress, ignoring commitTransaction')
      return
    }

    if (transactionSnapshot) {
      pushUndo(transactionLabel, transactionSnapshot)
    }

    resetTransaction()
    emitChange()
  }

  function discardTransaction(): void {
    if (!inTransaction) {
      console.warn('[dragcraft/core] No transaction in progress, ignoring discardTransaction')
      return
    }

    const restored = transactionSnapshot !== null
    if (transactionSnapshot) {
      store.setSchema(transactionSnapshot)
    }

    resetTransaction()
    emitChange()
    if (restored)
      eventHub.emit(EventName.SCHEMA_CHANGED, store.getSchema())
  }

  function isInTransaction(): boolean {
    return inTransaction
  }

  function clear(): void {
    undoStack.length = 0
    redoStack.length = 0
    resetTransaction()
    emitChange()
  }

  return {
    state,
    pushSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    beginTransaction,
    commitTransaction,
    discardTransaction,
    isInTransaction,
    clear,
  }
}
