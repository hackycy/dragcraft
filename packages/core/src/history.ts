import type { State } from './types'

export interface HistoryOptions {
  maxSize?: number
}

export interface HistoryManager {
  push: (snapshot: State) => void
  undo: (currentState: State) => State | null
  redo: (currentState: State) => State | null
  canUndo: () => boolean
  canRedo: () => boolean
  clear: () => void
}

export function createHistoryManager(options: HistoryOptions = {}): HistoryManager {
  const maxSize = options.maxSize ?? 50

  const undoStack: State[] = []
  const redoStack: State[] = []

  return {
    push(snapshot: State): void {
      undoStack.push(snapshot)

      if (undoStack.length > maxSize) {
        undoStack.shift()
      }

      // Clear redo stack on new action (standard undo/redo behavior)
      redoStack.length = 0
    },

    undo(currentState: State): State | null {
      if (undoStack.length === 0) {
        return null
      }

      redoStack.push(currentState)
      return undoStack.pop()!
    },

    redo(currentState: State): State | null {
      if (redoStack.length === 0) {
        return null
      }

      undoStack.push(currentState)
      return redoStack.pop()!
    },

    canUndo(): boolean {
      return undoStack.length > 0
    },

    canRedo(): boolean {
      return redoStack.length > 0
    },

    clear(): void {
      undoStack.length = 0
      redoStack.length = 0
    },
  }
}
