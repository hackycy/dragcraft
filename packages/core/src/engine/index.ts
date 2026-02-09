import type { EnginePlugin } from '../plugin'
import type {
  ConfigType,
  EngineState,
  GlobalConfigSchema,
  PageSchema,
  WidgetSchema,
} from '../types'
import { CommandManager, createDefaultCommands } from '../commands'
import { DndManager } from '../dnd'
import { EngineEventBus } from '../event-bus'
import { HistoryManager } from '../history'
import { RegistryCenter } from '../registry'
import { createDefaultPageSchema, DEFAULT_PAGE_CONFIG_TYPE } from '../schema'
import { EngineStore } from '../state'

export interface EngineOptions {
  pageConfigType?: ConfigType
  pageSchema?: PageSchema
  initialWidgets?: WidgetSchema[]
  initialGlobalConfigs?: GlobalConfigSchema[]
  plugins?: EnginePlugin[]
}

export class CoreEngine {
  readonly store: EngineStore
  readonly registry: RegistryCenter
  readonly eventBus: EngineEventBus
  readonly history: HistoryManager
  readonly dnd: DndManager
  readonly commands: CommandManager

  constructor(options: EngineOptions = {}) {
    const pageSchema
      = options.pageSchema
        ?? createDefaultPageSchema(options.pageConfigType ?? DEFAULT_PAGE_CONFIG_TYPE)

    const initialState: EngineState = {
      page: pageSchema,
      widgets: options.initialWidgets ?? [],
      globalConfigs: options.initialGlobalConfigs ?? [],
      activeId: null,
    }

    this.store = new EngineStore(initialState)
    this.registry = new RegistryCenter()
    this.eventBus = new EngineEventBus()
    this.history = new HistoryManager()
    this.dnd = new DndManager(this.eventBus)

    const context = {
      store: this.store,
      registry: this.registry,
      eventBus: this.eventBus,
      dnd: this.dnd,
    }

    this.commands = new CommandManager(context, this.history)
    this.commands.registerMany(createDefaultCommands())

    options.plugins?.forEach(plugin => this.use(plugin))
  }

  getState(): Readonly<EngineState> {
    return this.store.getState()
  }

  executeCommand<TPayload>(name: string, payload: TPayload): void {
    this.commands.execute(name, payload)
  }

  undo(): void {
    this.commands.undo()
  }

  redo(): void {
    this.commands.redo()
  }

  registerWidget(definition: Parameters<RegistryCenter['registerWidget']>[0]): void {
    this.registry.registerWidget(definition)
  }

  registerConfig(definition: Parameters<RegistryCenter['registerConfig']>[0]): void {
    this.registry.registerConfig(definition)
  }

  registerRenderer(definition: Parameters<RegistryCenter['registerRenderer']>[0]): void {
    this.registry.registerRenderer(definition)
  }

  use(plugin: EnginePlugin): void {
    plugin.setup(this)
  }
}
