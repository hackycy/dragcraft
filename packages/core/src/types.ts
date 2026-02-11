// Schema types

export interface WidgetSchema {
  id: string
  type: string
  props: Record<string, any>
}

export interface GlobalConfigSchema {
  id: string
  type: string
  props: Record<string, any>
}

// State model

export interface State {
  widgets: WidgetSchema[]
  globalConfigs: GlobalConfigSchema[]
  activeId: string | null
  activeType: 'widget' | 'config' | null
}

// Widget definition constraint (for consumers to extend)

export interface WidgetDefinition {
  type: string
  label: string
  [key: string]: any
}

// Command types

export type CommandType
  = 'addWidget'
    | 'updateWidget'
    | 'removeWidget'
    | 'addGlobalConfig'
    | 'updateGlobalConfig'
    | 'removeGlobalConfig'
    | 'setActive'
    | 'clearActive'

export interface CommandInfo {
  type: CommandType
  payload: unknown
  timestamp: number
}

export interface CommandError {
  type: CommandType
  payload: unknown
  error: Error
  timestamp: number
}

// Event types

export interface CoreEvents {
  'state:changed': State
  'command:executed': CommandInfo
  'command:failed': CommandError
}

export type CoreEventName = keyof CoreEvents

// Plugin interface

export interface Plugin {
  name: string
  setup: (context: EngineContext) => void | (() => void)
}

// Engine context exposed to plugins

export interface EngineContext {
  readonly state: State
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
  on: <E extends CoreEventName>(event: E, listener: (payload: CoreEvents[E]) => void) => void
  off: <E extends CoreEventName>(event: E, listener: (payload: CoreEvents[E]) => void) => void
}
