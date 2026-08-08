import type { Ref } from 'vue'
import type { EventHub } from './event-hub'
import type { DeepReadonly, DesignerSchema, HistoryEntry, SchemaStoreInstance } from './types'
import { ref } from 'vue'
import { EventName } from './constants'
import { cloneSchema, deepFreeze } from './schema-utils'

export interface HistoryState {
  canUndo: boolean
  canRedo: boolean
  undoCount: number
  redoCount: number
}

export interface HistoryManagerInstance {
  readonly state: Readonly<Ref<HistoryState>>
  pushSnapshot: (label: string, before: DeepReadonly<DesignerSchema>) => void
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

type OwnedSnapshotPusher = (label: string, before: DeepReadonly<DesignerSchema>) => void

const ownedSnapshotPushers = new WeakMap<HistoryManagerInstance, OwnedSnapshotPusher>()

export function pushOwnedHistorySnapshot(
  history: HistoryManagerInstance,
  label: string,
  before: DeepReadonly<DesignerSchema>,
): void {
  const pushOwned = ownedSnapshotPushers.get(history)
  if (pushOwned)
    pushOwned(label, before)
  else
    history.pushSnapshot(label, before)
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
  let transactionSnapshot: DeepReadonly<DesignerSchema> | null = null

  function resetTransaction(): void {
    inTransaction = false
    transactionLabel = ''
    transactionSnapshot = null
  }

  function trimUndoStack(): void {
    if (undoStack.length > maxSize)
      undoStack.splice(0, undoStack.length - maxSize)
  }

  function pushUndo(label: string, snapshot: DeepReadonly<DesignerSchema>): void {
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

  function pushOwnedSnapshot(label: string, before: DeepReadonly<DesignerSchema>): void {
    if (inTransaction)
      return

    pushUndo(label, before)
    emitChange()
  }

  function pushSnapshot(label: string, before: DeepReadonly<DesignerSchema>): void {
    if (inTransaction)
      return
    pushOwnedSnapshot(label, deepFreeze(cloneSchema(before)))
  }

  function undo(): void {
    if (!canUndo())
      return

    const entry = undoStack.pop()!
    const currentSnapshot = store.getSnapshot()
    redoStack.push({ label: entry.label, snapshot: currentSnapshot })

    store.restoreSnapshot(entry.snapshot)

    emitChange()
    eventHub.emit(EventName.SCHEMA_CHANGED, store.getSnapshot())
  }

  function redo(): void {
    if (!canRedo())
      return

    const entry = redoStack.pop()!
    const currentSnapshot = store.getSnapshot()
    undoStack.push({ label: entry.label, snapshot: currentSnapshot })
    trimUndoStack()

    store.restoreSnapshot(entry.snapshot)

    emitChange()
    eventHub.emit(EventName.SCHEMA_CHANGED, store.getSnapshot())
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
    transactionSnapshot = store.getSnapshot()
  }

  function commitTransaction(): void {
    if (!inTransaction) {
      console.warn('[dragcraft/core] No transaction in progress, ignoring commitTransaction')
      return
    }

    if (transactionSnapshot && transactionSnapshot !== store.getSnapshot()) {
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

    const restored = transactionSnapshot !== null && transactionSnapshot !== store.getSnapshot()
    if (restored)
      store.restoreSnapshot(transactionSnapshot!)

    resetTransaction()
    emitChange()
    if (restored)
      eventHub.emit(EventName.SCHEMA_CHANGED, store.getSnapshot())
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

  const history: HistoryManagerInstance = {
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
  ownedSnapshotPushers.set(history, pushOwnedSnapshot)
  return history
}
