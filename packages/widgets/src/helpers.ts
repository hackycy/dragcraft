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
 *
 * registerWidgets(engine, myWidgetDefinitions)
 * ```
 */
export function registerWidgets<Meta extends WidgetMeta>(
  engine: DesignerEngine,
  definitions: WidgetDefinition<Meta>[],
): void {
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
 *
 * const componentMap = buildComponentMap(myWidgetDefinitions)
 * ```
 */
export function buildComponentMap<Meta extends WidgetMeta>(
  definitions: WidgetDefinition<Meta>[],
): Record<string, Component> {
  const map: Record<string, Component> = {}
  for (const def of definitions) {
    map[def.meta.type] = def.component
  }
  return map
}

/**
 * Extracts all WidgetMeta from widget definitions.
 */
export function getWidgetMetas<Meta extends WidgetMeta>(definitions: WidgetDefinition<Meta>[]): Meta[] {
  return definitions.map(def => def.meta)
}

/**
 * Filters widget definitions by group name.
 */
export function filterByGroup<Meta extends WidgetMeta>(
  definitions: WidgetDefinition<Meta>[],
  group: string,
): WidgetDefinition<Meta>[] {
  return definitions.filter(def => def.meta.group === group)
}
