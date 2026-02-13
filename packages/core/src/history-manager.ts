import type { EventHub } from './event-hub'
import type { DesignerSchema, HistoryEntry, SchemaStoreInstance } from './types'
import { cloneDeep } from '@dragcraft/utils'
import { toRaw } from '@vue/reactivity'
import { EventName } from './constants'

export interface HistoryManagerInstance {
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

  let inTransaction = false
  let transactionLabel = ''
  let transactionSnapshot: DesignerSchema | null = null

  function emitChange(): void {
    eventHub.emit(EventName.HISTORY_CHANGED, {
      canUndo: canUndo(),
      canRedo: canRedo(),
      undoCount: undoStack.length,
      redoCount: redoStack.length,
    })
  }

  function pushSnapshot(label: string, before: DesignerSchema): void {
    if (inTransaction)
      return

    undoStack.push({ label, snapshot: before })

    while (undoStack.length > maxSize) {
      undoStack.shift()
    }

    redoStack.length = 0
    emitChange()
  }

  function undo(): void {
    if (!canUndo())
      return

    const entry = undoStack.pop()!
    const currentSnapshot = cloneDeep(toRaw(store.schema.value))
    redoStack.push({ label: entry.label, snapshot: currentSnapshot })

    store.setSchema(entry.snapshot)

    emitChange()
    eventHub.emit(EventName.SCHEMA_CHANGED, store.getSchema())
  }

  function redo(): void {
    if (!canRedo())
      return

    const entry = redoStack.pop()!
    const currentSnapshot = cloneDeep(toRaw(store.schema.value))
    undoStack.push({ label: entry.label, snapshot: currentSnapshot })

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
    transactionSnapshot = cloneDeep(toRaw(store.schema.value))
  }

  function commitTransaction(): void {
    if (!inTransaction) {
      console.warn('[dragcraft/core] No transaction in progress, ignoring commitTransaction')
      return
    }

    if (transactionSnapshot) {
      undoStack.push({ label: transactionLabel, snapshot: transactionSnapshot })
      while (undoStack.length > maxSize) {
        undoStack.shift()
      }
      redoStack.length = 0
    }

    inTransaction = false
    transactionLabel = ''
    transactionSnapshot = null
    emitChange()
  }

  function discardTransaction(): void {
    if (!inTransaction) {
      console.warn('[dragcraft/core] No transaction in progress, ignoring discardTransaction')
      return
    }

    if (transactionSnapshot) {
      store.setSchema(transactionSnapshot)
    }

    inTransaction = false
    transactionLabel = ''
    transactionSnapshot = null
    emitChange()
  }

  function isInTransaction(): boolean {
    return inTransaction
  }

  function clear(): void {
    undoStack.length = 0
    redoStack.length = 0
    inTransaction = false
    transactionLabel = ''
    transactionSnapshot = null
    emitChange()
  }

  return {
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
