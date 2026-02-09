import type { DndManager } from '../dnd'
import type { EngineEventBus } from '../event-bus'
import type { HistoryManager } from '../history'
import type { RegistryCenter } from '../registry'
import type { EngineStore } from '../state'
import type {
  CreateWidgetPayload,
  Dict,
  EngineState,
  StyleSchema,
  WidgetSchema,
} from '../types'
import { generateShortId } from '@dragcraft/utils'

export interface CommandContext {
  store: EngineStore
  registry: RegistryCenter
  eventBus: EngineEventBus
  dnd: DndManager
}

export interface Command<TPayload = unknown> {
  name: string
  execute: (context: CommandContext, payload: TPayload) => void
}

export class CommandManager {
  private commands = new Map<string, Command>()

  constructor(
    private context: CommandContext,
    private history: HistoryManager,
  ) {}

  register(command: Command): void {
    this.commands.set(command.name, command)
  }

  registerMany(commands: Command[]): void {
    commands.forEach(command => this.register(command))
  }

  execute<TPayload>(name: string, payload: TPayload): void {
    const command = this.commands.get(name)
    if (!command) {
      throw new Error(`Command not found: ${name}`)
    }
    const before = this.context.store.snapshot()
    command.execute(this.context, payload)
    this.history.push(before)
    this.context.eventBus.emit('command:executed', { name, payload })
    this.context.eventBus.emit('state:changed', this.context.store.getState())
  }

  undo(): void {
    const current = this.context.store.snapshot()
    const prev = this.history.undo(current)
    if (!prev) {
      return
    }
    this.context.store.replace(prev)
    this.context.eventBus.emit('state:changed', this.context.store.getState())
  }

  redo(): void {
    const current = this.context.store.snapshot()
    const next = this.history.redo(current)
    if (!next) {
      return
    }
    this.context.store.replace(next)
    this.context.eventBus.emit('state:changed', this.context.store.getState())
  }

  canUndo(): boolean {
    return this.history.canUndo()
  }

  canRedo(): boolean {
    return this.history.canRedo()
  }
}

interface AddWidgetPayload {
  widget: CreateWidgetPayload
  index?: number
}

interface RemoveWidgetPayload {
  id: string
}

interface MoveWidgetPayload {
  fromIndex: number
  toIndex: number
}

interface SetActivePayload {
  id: string | null
}

interface UpdateWidgetPropsPayload {
  id: string
  props: Dict
}

interface UpdateWidgetStylePayload {
  id: string
  style: StyleSchema
}

interface UpdatePagePropsPayload {
  props: Dict
}

interface UpdatePageStylePayload {
  style: StyleSchema
}

interface UpsertGlobalConfigPayload {
  type: string
  props: Dict
  style?: StyleSchema
}

interface RemoveGlobalConfigPayload {
  type: string
}

export function createDefaultCommands(): Command<any>[] {
  const addWidget: Command<AddWidgetPayload> = {
    name: 'addWidget',
    execute({ store }, payload) {
      store.apply((state) => {
        const widgetId = payload.widget.id ?? generateShortId()
        const widget: WidgetSchema = {
          id: widgetId,
          type: payload.widget.type,
          props: payload.widget.props ?? {},
          style: payload.widget.style ?? {},
        }
        const insertIndex = payload.index ?? state.widgets.length
        state.widgets.splice(insertIndex, 0, widget)
        state.activeId = widgetId
      })
    },
  }

  const removeWidget: Command<RemoveWidgetPayload> = {
    name: 'removeWidget',
    execute({ store }, payload) {
      store.apply((state) => {
        const index = state.widgets.findIndex(widget => widget.id === payload.id)
        if (index === -1) {
          return
        }
        state.widgets.splice(index, 1)
        if (state.activeId === payload.id) {
          state.activeId = null
        }
      })
    },
  }

  const moveWidget: Command<MoveWidgetPayload> = {
    name: 'moveWidget',
    execute({ store }, payload) {
      store.apply((state) => {
        if (payload.fromIndex === payload.toIndex) {
          return
        }
        const [moved] = state.widgets.splice(payload.fromIndex, 1)
        if (!moved) {
          return
        }
        state.widgets.splice(payload.toIndex, 0, moved)
      })
    },
  }

  const setActive: Command<SetActivePayload> = {
    name: 'setActive',
    execute({ store }, payload) {
      store.apply((state) => {
        state.activeId = payload.id
      })
    },
  }

  const updateWidgetProps: Command<UpdateWidgetPropsPayload> = {
    name: 'updateWidgetProps',
    execute({ store }, payload) {
      store.apply((state) => {
        const widget = state.widgets.find(item => item.id === payload.id)
        if (!widget) {
          return
        }
        widget.props = {
          ...widget.props,
          ...payload.props,
        }
      })
    },
  }

  const updateWidgetStyle: Command<UpdateWidgetStylePayload> = {
    name: 'updateWidgetStyle',
    execute({ store }, payload) {
      store.apply((state) => {
        const widget = state.widgets.find(item => item.id === payload.id)
        if (!widget) {
          return
        }
        widget.style = {
          ...widget.style,
          ...payload.style,
        }
      })
    },
  }

  const updatePageProps: Command<UpdatePagePropsPayload> = {
    name: 'updatePageProps',
    execute({ store }, payload) {
      store.apply((state) => {
        state.page.props = {
          ...state.page.props,
          ...payload.props,
        }
      })
    },
  }

  const updatePageStyle: Command<UpdatePageStylePayload> = {
    name: 'updatePageStyle',
    execute({ store }, payload) {
      store.apply((state) => {
        state.page.style = {
          ...state.page.style,
          ...payload.style,
        }
      })
    },
  }

  const upsertGlobalConfig: Command<UpsertGlobalConfigPayload> = {
    name: 'upsertGlobalConfig',
    execute({ store }, payload) {
      store.apply((state) => {
        const existing = state.globalConfigs.find(
          config => config.type === payload.type,
        )
        if (existing) {
          existing.props = {
            ...existing.props,
            ...payload.props,
          }
          if (payload.style) {
            existing.style = {
              ...existing.style,
              ...payload.style,
            }
          }
          return
        }
        state.globalConfigs.push({
          id: generateShortId(),
          type: payload.type,
          props: payload.props,
          style: payload.style ?? {},
        })
      })
    },
  }

  const removeGlobalConfig: Command<RemoveGlobalConfigPayload> = {
    name: 'removeGlobalConfig',
    execute({ store }, payload) {
      store.apply((state) => {
        const index = state.globalConfigs.findIndex(
          config => config.type === payload.type,
        )
        if (index === -1) {
          return
        }
        state.globalConfigs.splice(index, 1)
      })
    },
  }

  return [
    addWidget,
    removeWidget,
    moveWidget,
    setActive,
    updateWidgetProps,
    updateWidgetStyle,
    updatePageProps,
    updatePageStyle,
    upsertGlobalConfig,
    removeGlobalConfig,
  ]
}

export type { EngineState }
