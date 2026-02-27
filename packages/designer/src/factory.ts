import type { DesignerInstance, DesignerOptions } from './types'
import { createEngine } from '@dragcraft/core'
import { createDefaultActions, createNodeActionRegistry } from '@dragcraft/renderer'

/**
 * Creates a designer instance by initializing the core engine,
 * registering widgets, and resolving configuration.
 *
 * Users must explicitly provide widget metas and component maps.
 * Use `@dragcraft/builtin-widgets` and `@dragcraft/builtin-fields` for built-in defaults.
 *
 * @example
 * ```ts
 * import { getAllWidgetMetas, getDefaultComponentMap } from '@dragcraft/builtin-widgets'
 * import { buildDefaultFieldComponentMap } from '@dragcraft/builtin-fields'
 *
 * const designer = createDesigner({
 *   widgetMetas: getAllWidgetMetas(),
 *   componentMap: getDefaultComponentMap(),
 *   fieldComponentMap: buildDefaultFieldComponentMap(),
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

  // 5. Store field component map
  const fieldComponentMap = options.fieldComponentMap

  // 6. Store global config schema
  const globalConfigSchema = options.globalConfigSchema ?? null

  // 7. Register global config schema in registry if provided
  if (globalConfigSchema) {
    engine.registry.registerGlobalConfigSchema(
      globalConfigSchema as unknown as Record<string, unknown>,
    )
  }

  // 8. Resolve event hooks
  const eventHooks = options.eventHooks ?? {}

  // 9. Create action registry with defaults + custom actions
  const actionRegistry = createNodeActionRegistry(createDefaultActions())
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
    actionRegistry,
    dispose,
  }
}
