import type { DesignerEngine, WidgetMeta } from '@dragcraft/core'
import type { WidgetDefinition, WidgetGroupConfig } from '@dragcraft/widgets'
import type { Component } from 'vue'
import {
  ButtonWidget,
  buttonWidgetMeta,
  DividerWidget,
  dividerWidgetMeta,
  ImageWidget,
  imageWidgetMeta,
  LinkWidget,
  linkWidgetMeta,
  TextWidget,
  textWidgetMeta,
} from './widgets/basic'
import {
  FormCheckboxWidget,
  formCheckboxWidgetMeta,
  FormInputWidget,
  formInputWidgetMeta,
  FormRadioWidget,
  formRadioWidgetMeta,
  FormSelectWidget,
  formSelectWidgetMeta,
  FormTextareaWidget,
  formTextareaWidgetMeta,
} from './widgets/form'

// ──────────────────────────────────────────
// Widget definitions collection
// ──────────────────────────────────────────

/**
 * All built-in widget definitions (meta + component).
 */
export const allWidgetDefinitions: WidgetDefinition[] = [
  // basic group
  { meta: textWidgetMeta, component: TextWidget },
  { meta: buttonWidgetMeta, component: ButtonWidget },
  { meta: imageWidgetMeta, component: ImageWidget },
  { meta: linkWidgetMeta, component: LinkWidget },
  { meta: dividerWidgetMeta, component: DividerWidget },
  // form group
  { meta: formInputWidgetMeta, component: FormInputWidget },
  { meta: formTextareaWidgetMeta, component: FormTextareaWidget },
  { meta: formSelectWidgetMeta, component: FormSelectWidget },
  { meta: formCheckboxWidgetMeta, component: FormCheckboxWidget },
  { meta: formRadioWidgetMeta, component: FormRadioWidget },
]

// ──────────────────────────────────────────
// Widget group configs
// ──────────────────────────────────────────

/**
 * Built-in widget group configurations with localized titles.
 * Used by the designer's material panel to organize widgets.
 */
export const widgetGroups: readonly WidgetGroupConfig[] = [
  { name: 'basic', title: '基础展示' },
  { name: 'form', title: '表单交互' },
]

// ──────────────────────────────────────────
// Helper functions
// ──────────────────────────────────────────

/**
 * Returns all built-in widget WidgetMeta definitions.
 */
export function getAllWidgetMetas(): WidgetMeta[] {
  return allWidgetDefinitions.map(def => def.meta)
}

/**
 * Registers all built-in widgets with the given DesignerEngine.
 * Call this during engine initialization before rendering.
 *
 * @example
 * ```ts
 * const engine = createEngine()
 * registerAllWidgets(engine)
 * ```
 */
export function registerAllWidgets(engine: DesignerEngine): void {
  for (const def of allWidgetDefinitions) {
    engine.registerWidget(def.meta)
  }
}

/**
 * Builds the default component map for use with RootRenderer.
 * Maps each widget's `type` to its Vue component.
 *
 * @example
 * ```ts
 * <RootRenderer :engine="engine" :component-map="getDefaultComponentMap()" />
 * ```
 */
export function getDefaultComponentMap(): Record<string, Component> {
  const map: Record<string, Component> = {}
  for (const def of allWidgetDefinitions) {
    map[def.meta.type] = def.component
  }
  return map
}

/**
 * Returns widget definitions filtered by group name.
 */
export function getWidgetsByGroup(group: string): WidgetDefinition[] {
  return allWidgetDefinitions.filter(def => def.meta.group === group)
}
