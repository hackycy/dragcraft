import type { WidgetComponentMap } from '@dragcraft/renderer'
import type { DesignerWidgetDefinition, WidgetRegistry } from '../types'
import { reactive } from 'vue'

export function useWidgetRegistry(
  initialWidgets: DesignerWidgetDefinition[] = [],
): WidgetRegistry {
  const registry = reactive(new Map<string, DesignerWidgetDefinition>())

  for (const widget of initialWidgets) {
    registry.set(widget.type, widget)
  }

  return {
    register(definition: DesignerWidgetDefinition): void {
      registry.set(definition.type, definition)
    },

    unregister(type: string): void {
      registry.delete(type)
    },

    get(type: string): DesignerWidgetDefinition | undefined {
      return registry.get(type)
    },

    getAll(): DesignerWidgetDefinition[] {
      return Array.from(registry.values())
    },

    getComponentMap(): WidgetComponentMap {
      const map: WidgetComponentMap = {}
      for (const [type, def] of registry) {
        map[type] = def.component
      }
      return map
    },

    getCategories(): string[] {
      const cats = new Set<string>()
      for (const def of registry.values()) {
        if (def.category) {
          cats.add(def.category)
        }
      }
      return Array.from(cats)
    },

    getByCategory(category: string): DesignerWidgetDefinition[] {
      return Array.from(registry.values())
        .filter(def => def.category === category)
    },
  }
}
