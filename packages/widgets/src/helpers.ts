import type { DesignerEngine, WidgetMeta } from '@dragcraft/core'
import type { Component } from 'vue'
import type { WidgetDefinition } from './types'

// ──────────────────────────────────────────
// Generic helper functions
// ──────────────────────────────────────────

/**
 * Registers a list of widget definitions with the given DesignerEngine.
 *
 * @example
 * ```ts
 * import { registerWidgets } from '@dragcraft/widgets'
 * import { allWidgetDefinitions } from '@dragcraft/builtin-widgets'
 *
 * registerWidgets(engine, allWidgetDefinitions)
 * ```
 */
export function registerWidgets(engine: DesignerEngine, definitions: WidgetDefinition[]): void {
  for (const def of definitions) {
    engine.registerWidget(def.meta)
  }
}

/**
 * Builds a component map from widget definitions.
 * Maps each widget's `type` to its Vue component.
 *
 * @example
 * ```ts
 * import { buildComponentMap } from '@dragcraft/widgets'
 * import { allWidgetDefinitions } from '@dragcraft/builtin-widgets'
 *
 * const componentMap = buildComponentMap(allWidgetDefinitions)
 * ```
 */
export function buildComponentMap(definitions: WidgetDefinition[]): Record<string, Component> {
  const map: Record<string, Component> = {}
  for (const def of definitions) {
    map[def.meta.type] = def.component
  }
  return map
}

/**
 * Extracts all WidgetMeta from widget definitions.
 */
export function getWidgetMetas(definitions: WidgetDefinition[]): WidgetMeta[] {
  return definitions.map(def => def.meta)
}

/**
 * Filters widget definitions by group name.
 */
export function filterByGroup(definitions: WidgetDefinition[], group: string): WidgetDefinition[] {
  return definitions.filter(def => def.meta.group === group)
}
