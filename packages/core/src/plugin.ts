import type { EngineContext, Plugin } from './types'

export interface PluginManager {
  use: (plugin: Plugin) => void
  init: (context: EngineContext) => void
  dispose: () => void
  getPluginNames: () => string[]
}

export function createPluginManager(): PluginManager {
  const plugins: Plugin[] = []
  const disposers: Array<() => void> = []
  let initialized = false

  return {
    use(plugin: Plugin): void {
      if (initialized) {
        throw new Error(
          'Cannot register plugins after engine initialization. '
          + 'Call engine.use() before any commands.',
        )
      }

      if (plugins.some(p => p.name === plugin.name)) {
        console.warn(`Plugin "${plugin.name}" is already registered. Skipping.`)
        return
      }

      plugins.push(plugin)
    },

    init(context: EngineContext): void {
      if (initialized) {
        return
      }

      for (const plugin of plugins) {
        try {
          const disposer = plugin.setup(context)
          if (typeof disposer === 'function') {
            disposers.push(disposer)
          }
        }
        catch (error) {
          console.error(`Error initializing plugin "${plugin.name}":`, error)
        }
      }

      initialized = true
    },

    dispose(): void {
      for (const disposer of disposers.reverse()) {
        try {
          disposer()
        }
        catch (error) {
          console.error('Error disposing plugin:', error)
        }
      }

      disposers.length = 0
      plugins.length = 0
      initialized = false
    },

    getPluginNames(): string[] {
      return plugins.map(p => p.name)
    },
  }
}
