// Engine (main entry point)
export { createEngine } from './engine'
export type { Engine, EngineOptions } from './engine'

// History options
export type { HistoryOptions } from './history'

// Core types
export type {
  CommandError,
  CommandInfo,
  CommandType,
  CoreEventName,
  CoreEvents,
  EngineContext,
  GlobalConfigSchema,
  Plugin,
  State,
  WidgetDefinition,
  WidgetSchema,
} from './types'
