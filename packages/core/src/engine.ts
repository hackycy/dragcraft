import type { HistoryOptions } from './history'
import type {
  CoreEventName,
  CoreEvents,
  EngineContext,
  Plugin,
  State,
} from './types'
import { createCommandExecutor } from './commands'
import { createEventBus } from './event-bus'
import { createHistoryManager } from './history'
import { createPluginManager } from './plugin'
import { createStateStore } from './state'

export interface EngineOptions {
  initialState?: State
  history?: HistoryOptions
}

export interface Engine extends EngineContext {
  use: (plugin: Plugin) => Engine
  canUndo: () => boolean
  canRedo: () => boolean
  dispose: () => void
}

export function createEngine(options: EngineOptions = {}): Engine {
  const store = createStateStore(options.initialState)
  const eventBus = createEventBus()
  const history = createHistoryManager(options.history)
  const pluginManager = createPluginManager()

  const commands = createCommandExecutor({ store, history, eventBus })

  let pluginsInitialized = false

  const engine: Engine = {
    get state(): State {
      return store.state as State
    },

    // Widget commands

    addWidget(type: string, props?: Record<string, any>): string {
      initPlugins()
      return commands.addWidget(type, props)
    },

    updateWidget(id: string, props: Partial<Record<string, any>>): void {
      initPlugins()
      commands.updateWidget(id, props)
    },

    removeWidget(id: string): void {
      initPlugins()
      commands.removeWidget(id)
    },

    // GlobalConfig commands

    addGlobalConfig(type: string, props?: Record<string, any>): string {
      initPlugins()
      return commands.addGlobalConfig(type, props)
    },

    updateGlobalConfig(id: string, props: Partial<Record<string, any>>): void {
      initPlugins()
      commands.updateGlobalConfig(id, props)
    },

    removeGlobalConfig(id: string): void {
      initPlugins()
      commands.removeGlobalConfig(id)
    },

    // Active selection

    setActive(id: string, type: 'widget' | 'config'): void {
      initPlugins()
      commands.setActive(id, type)
    },

    clearActive(): void {
      initPlugins()
      commands.clearActive()
    },

    // History

    undo(): void {
      initPlugins()
      commands.undo()
    },

    redo(): void {
      initPlugins()
      commands.redo()
    },

    canUndo(): boolean {
      return history.canUndo()
    },

    canRedo(): boolean {
      return history.canRedo()
    },

    // Event subscription

    on<E extends CoreEventName>(
      event: E,
      listener: (payload: CoreEvents[E]) => void,
    ): void {
      eventBus.on(event, listener)
    },

    off<E extends CoreEventName>(
      event: E,
      listener: (payload: CoreEvents[E]) => void,
    ): void {
      eventBus.off(event, listener)
    },

    // Plugin registration (chainable)

    use(plugin: Plugin): Engine {
      pluginManager.use(plugin)
      return engine
    },

    // Cleanup

    dispose(): void {
      pluginManager.dispose()
      eventBus.clear()
      history.clear()
      pluginsInitialized = false
    },
  }

  function initPlugins(): void {
    if (!pluginsInitialized) {
      pluginManager.init(engine)
      pluginsInitialized = true
    }
  }

  return engine
}
