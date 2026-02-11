import type { TypedEventBus } from './event-bus'
import type { HistoryManager } from './history'
import type { StateStore } from './state'
import type { CommandError, CommandInfo, CommandType } from './types'
import { generateShortId } from '@dragcraft/utils'

export interface CommandExecutor {
  addWidget: (type: string, props?: Record<string, any>) => string
  updateWidget: (id: string, props: Partial<Record<string, any>>) => void
  removeWidget: (id: string) => void
  addGlobalConfig: (type: string, props?: Record<string, any>) => string
  updateGlobalConfig: (id: string, props: Partial<Record<string, any>>) => void
  removeGlobalConfig: (id: string) => void
  setActive: (id: string, type: 'widget' | 'config') => void
  clearActive: () => void
  undo: () => void
  redo: () => void
}

interface CommandContext {
  store: StateStore
  history: HistoryManager
  eventBus: TypedEventBus
}

function executeCommand<T>(
  ctx: CommandContext,
  commandType: CommandType,
  payload: unknown,
  executor: () => T,
): T {
  const { store, history, eventBus } = ctx

  // Save snapshot before mutation
  const snapshot = store.snapshot()

  try {
    // Execute mutation
    const result = executor()

    // On success: push snapshot to history, broadcast events
    history.push(snapshot)

    const commandInfo: CommandInfo = {
      type: commandType,
      payload,
      timestamp: Date.now(),
    }

    eventBus.emit('command:executed', commandInfo)
    eventBus.emit('state:changed', store.snapshot())

    return result
  }
  catch (error) {
    // On failure: restore from local snapshot, broadcast error
    store.replace(snapshot)

    const commandError: CommandError = {
      type: commandType,
      payload,
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp: Date.now(),
    }

    eventBus.emit('command:failed', commandError)

    throw error
  }
}

export function createCommandExecutor(ctx: CommandContext): CommandExecutor {
  const { store, history, eventBus } = ctx

  return {
    addWidget(type: string, props: Record<string, any> = {}): string {
      if (!type || typeof type !== 'string') {
        throw new Error('Widget type must be a non-empty string')
      }

      const id = generateShortId()

      return executeCommand(ctx, 'addWidget', { type, props }, () => {
        store.addWidget({ id, type, props })
        return id
      })
    },

    updateWidget(id: string, props: Partial<Record<string, any>>): void {
      if (!id || typeof id !== 'string') {
        throw new Error('Widget id must be a non-empty string')
      }

      const widget = store.findWidget(id)
      if (!widget) {
        throw new Error(`Widget with id "${id}" not found`)
      }

      executeCommand(ctx, 'updateWidget', { id, props }, () => {
        store.updateWidget(id, props)
      })
    },

    removeWidget(id: string): void {
      if (!id || typeof id !== 'string') {
        throw new Error('Widget id must be a non-empty string')
      }

      const widget = store.findWidget(id)
      if (!widget) {
        throw new Error(`Widget with id "${id}" not found`)
      }

      executeCommand(ctx, 'removeWidget', { id }, () => {
        store.removeWidget(id)
      })
    },

    addGlobalConfig(type: string, props: Record<string, any> = {}): string {
      if (!type || typeof type !== 'string') {
        throw new Error('Config type must be a non-empty string')
      }

      const id = generateShortId()

      return executeCommand(ctx, 'addGlobalConfig', { type, props }, () => {
        store.addGlobalConfig({ id, type, props })
        return id
      })
    },

    updateGlobalConfig(id: string, props: Partial<Record<string, any>>): void {
      if (!id || typeof id !== 'string') {
        throw new Error('Config id must be a non-empty string')
      }

      const config = store.findGlobalConfig(id)
      if (!config) {
        throw new Error(`GlobalConfig with id "${id}" not found`)
      }

      executeCommand(ctx, 'updateGlobalConfig', { id, props }, () => {
        store.updateGlobalConfig(id, props)
      })
    },

    removeGlobalConfig(id: string): void {
      if (!id || typeof id !== 'string') {
        throw new Error('Config id must be a non-empty string')
      }

      const config = store.findGlobalConfig(id)
      if (!config) {
        throw new Error(`GlobalConfig with id "${id}" not found`)
      }

      executeCommand(ctx, 'removeGlobalConfig', { id }, () => {
        store.removeGlobalConfig(id)
      })
    },

    setActive(id: string, type: 'widget' | 'config'): void {
      if (!id || typeof id !== 'string') {
        throw new Error('Active id must be a non-empty string')
      }

      if (type !== 'widget' && type !== 'config') {
        throw new Error('Active type must be "widget" or "config"')
      }

      if (type === 'widget') {
        if (!store.findWidget(id)) {
          throw new Error(`Widget with id "${id}" not found`)
        }
      }
      else {
        if (!store.findGlobalConfig(id)) {
          throw new Error(`GlobalConfig with id "${id}" not found`)
        }
      }

      executeCommand(ctx, 'setActive', { id, type }, () => {
        store.setActive(id, type)
      })
    },

    clearActive(): void {
      executeCommand(ctx, 'clearActive', {}, () => {
        store.clearActive()
      })
    },

    undo(): void {
      if (!history.canUndo()) {
        return
      }

      const currentSnapshot = store.snapshot()
      const previousState = history.undo(currentSnapshot)

      if (previousState) {
        store.replace(previousState)
        eventBus.emit('state:changed', store.snapshot())
      }
    },

    redo(): void {
      if (!history.canRedo()) {
        return
      }

      const currentSnapshot = store.snapshot()
      const nextState = history.redo(currentSnapshot)

      if (nextState) {
        store.replace(nextState)
        eventBus.emit('state:changed', store.snapshot())
      }
    },
  }
}
