import type { DesignerInstance, DesignerOptions } from './types'
import { createEngine } from '@dragcraft/core'
import { createDefaultActions, createNodeActionRegistry } from '@dragcraft/renderer'
import { getDefaultComponentMap, registerAllWidgets } from '@dragcraft/widgets'

/**
 * Creates a designer instance by initializing the core engine,
 * registering widgets, and resolving configuration.
 *
 * @example
 * ```ts
 * const designer = createDesigner({
 *   globalConfigSchema: myGlobalSchema,
 *   eventHooks: {
 *     onBeforeDelete: ({ nodeId }) => confirm(`Delete ${nodeId}?`),
 *   },
 * })
 * ```
 */
export function createDesigner(options: DesignerOptions = {}): DesignerInstance {
  // 1. Create core engine
  const engine = createEngine(options.engineOptions)

  // 2. Register built-in widgets (unless opted out)
  if (options.registerDefaultWidgets !== false) {
    registerAllWidgets(engine)
  }

  // 3. Register extra widgets
  if (options.extraWidgets) {
    for (const meta of options.extraWidgets) {
      engine.registerWidget(meta)
    }
  }

  // 4. Build merged component map
  const defaultMap = options.registerDefaultWidgets !== false
    ? getDefaultComponentMap()
    : {}
  const componentMap = {
    ...defaultMap,
    ...(options.extraComponentMap ?? {}),
  }

  // 5. Resolve extensions
  const extensions = options.extensions ?? {}

  // 6. Store field component map override
  const fieldComponentMap = options.fieldComponentMap

  // 7. Store global config schema
  const globalConfigSchema = options.globalConfigSchema ?? null

  // 8. Register global config schema in registry if provided
  if (globalConfigSchema) {
    engine.registry.registerGlobalConfigSchema(
      globalConfigSchema as unknown as Record<string, unknown>,
    )
  }

  // 9. Resolve event hooks
  const eventHooks = options.eventHooks ?? {}

  // 10. Create action registry with defaults + custom actions
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
    extensions,
    fieldComponentMap,
    globalConfigSchema,
    eventHooks,
    actionRegistry,
    dispose,
  }
}
