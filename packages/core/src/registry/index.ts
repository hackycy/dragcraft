import type {
  ConfigDefinition,
  ConfigType,
  RendererDefinition,
  RendererType,
  WidgetDefinition,
  WidgetType,
} from '../types'

export class RegistryCenter {
  private widgetRegistry = new Map<WidgetType, WidgetDefinition>()
  private configRegistry = new Map<ConfigType, ConfigDefinition>()
  private rendererRegistry = new Map<RendererType, RendererDefinition>()

  registerWidget(definition: WidgetDefinition): void {
    this.widgetRegistry.set(definition.type, definition)
  }

  getWidget(type: WidgetType): WidgetDefinition | undefined {
    return this.widgetRegistry.get(type)
  }

  listWidgets(): WidgetDefinition[] {
    return Array.from(this.widgetRegistry.values())
  }

  registerConfig(definition: ConfigDefinition): void {
    this.configRegistry.set(definition.type, definition)
  }

  getConfig(type: ConfigType): ConfigDefinition | undefined {
    return this.configRegistry.get(type)
  }

  listConfigs(): ConfigDefinition[] {
    return Array.from(this.configRegistry.values())
  }

  registerRenderer(definition: RendererDefinition): void {
    this.rendererRegistry.set(definition.type, definition)
  }

  getRenderer(type: RendererType): RendererDefinition | undefined {
    return this.rendererRegistry.get(type)
  }

  listRenderers(): RendererDefinition[] {
    return Array.from(this.rendererRegistry.values())
  }

  clear(): void {
    this.widgetRegistry.clear()
    this.configRegistry.clear()
    this.rendererRegistry.clear()
  }
}
