import type { FormSchemaShape } from '@dragcraft/core'
import type { MessageTree } from '@dragcraft/utils'
import type { DesignerInstance, DesignerOptions } from './types'
import { createEngine } from '@dragcraft/core'
import { createDefaultActions, createNodeActionRegistry, rendererMessages } from '@dragcraft/renderer'
import { createI18n } from '@dragcraft/utils'
import { designerMessages } from './messages'

function mergeDefaultMessages(): Record<string, MessageTree> {
  const merged: Record<string, MessageTree> = {}
  const locales = new Set([
    ...Object.keys(rendererMessages),
    ...Object.keys(designerMessages),
  ])

  for (const locale of locales) {
    merged[locale] = {
      ...(rendererMessages[locale] ?? {}),
      ...(designerMessages[locale] ?? {}),
    }
  }

  return merged
}

/**
 * Creates a designer instance by initializing the core engine,
 * registering widgets, and resolving configuration.
 *
 * Users must explicitly provide widget metas, component maps, and field maps.
 *
 * @example
 * ```ts
 * const designer = createDesigner({
 *   widgetMetas: myWidgetMetas,
 *   componentMap: myComponentMap,
 *   fieldComponentMap: myFieldComponentMap,
 *   globalConfigSchema: myGlobalSchema,
 * })
 * ```
 */
export function createDesigner(options: DesignerOptions = {}): DesignerInstance {
  // 1. Create core engine
  const engine = createEngine(options.engineOptions)

  // 2. Register user-provided widget metas
  if (options.widgetMetas) {
    for (const meta of options.widgetMetas) {
      engine.registerWidget(meta)
    }
  }

  // 3. Use user-provided component map
  const componentMap = options.componentMap ?? {}

  // 4. Store widget group configs
  const widgetGroups = options.widgetGroups

  // 5. Resolve extensions
  const extensions = options.extensions ?? {}

  // 6. Store field component map
  const fieldComponentMap = options.fieldComponentMap

  // 7. Store global config schema
  const globalConfigSchema = options.globalConfigSchema ?? null

  // 8. Register global config schema in registry if provided
  if (globalConfigSchema) {
    // double cast needed: FormSchema and FormSchemaShape are structurally compatible
    // but FieldSchema lacks FieldSchemaShape's index signature, so direct assignment fails
    engine.registry.registerGlobalConfigFormSchema(
      globalConfigSchema as unknown as FormSchemaShape,
    )
  }

  // 9. Resolve event hooks
  const eventHooks = options.eventHooks ?? {}
  const actionInterceptors = options.actionInterceptors ?? []

  // 10. Create i18n instance with package defaults + user messages
  const defaultLocale = options.locale ?? 'zh-CN'
  const i18n = createI18n(defaultLocale, mergeDefaultMessages())

  // Merge user-provided messages
  if (options.messages) {
    for (const [locale, msgs] of Object.entries(options.messages)) {
      i18n.mergeMessages(locale, msgs)
    }
  }

  // 11. Create action registry with i18n-aware defaults + custom actions
  const actionRegistry = createNodeActionRegistry(createDefaultActions(i18n.t))
  if (options.customActions) {
    for (const action of options.customActions) {
      actionRegistry.register(action)
    }
  }

  function dispose(): void {
    engine.dispose()
  }

  return {
    engine,
    componentMap,
    widgetGroups,
    extensions,
    fieldComponentMap,
    globalConfigSchema,
    eventHooks,
    actionInterceptors,
    actionRegistry,
    i18n,
    dispose,
  }
}
