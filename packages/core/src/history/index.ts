import type { EngineState } from '../types'

export class HistoryManager {
  private undoStack: EngineState[] = []
  private redoStack: EngineState[] = []

  push(snapshot: EngineState): void {
    this.undoStack.push(snapshot)
    this.redoStack = []
  }

  undo(currentSnapshot: EngineState): EngineState | null {
    const prev = this.undoStack.pop()
    if (!prev) {
      return null
    }
    this.redoStack.push(currentSnapshot)
    return prev
  }

  redo(currentSnapshot: EngineState): EngineState | null {
    const next = this.redoStack.pop()
    if (!next) {
      return null
    }
    this.undoStack.push(currentSnapshot)
    return next
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }
}
