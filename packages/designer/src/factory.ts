import type { DocumentSchema } from '@dragcraft/core'
import type { MessageTree } from '@dragcraft/i18n'
import type { FormSchemaShape } from '@dragcraft/legacy-core'
import type { ComponentMap } from './presentation/types'
import type { DesignerInstance, DesignerOptions } from './types'
import { createI18n } from '@dragcraft/i18n'
import { createEngine } from '@dragcraft/legacy-core'
import { generateShortId } from '@dragcraft/utils'
import { createAuthoringEngine } from './authoring/create-authoring-engine'
import { createMaterialCatalog } from './materials/create-material-catalog'
import { designerMessages } from './messages'
import { createDefaultActions, createNodeActionRegistry } from './presentation/action-registry'
import { rendererMessages } from './presentation/messages'
import { registerDesignerSession } from './session/get-designer-session'
import { createLegacyDesignerSessionAdapter } from './session/legacy-designer-session-adapter'
import { createNextDesignerSessionAdapter } from './session/next-designer-session-adapter'
import { createDesignerWorkspace } from './workspace'

export const DOCUMENT_SCHEMA_VERSION = '1'

const EMPTY_DOCUMENT_SCHEMA: DocumentSchema = {
  version: DOCUMENT_SCHEMA_VERSION,
  globalConfig: {},
  page: { props: {} },
  nodes: [],
  structure: { root: [], containers: {} },
}

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
function createLegacyDesigner(options: DesignerOptions): DesignerInstance {
  // 1. Create core engine
  const { initialSchema, ...engineOptions } = options.engineOptions ?? {}
  const engine = createEngine(engineOptions)

  // 2. Register user-provided widget metas
  if (options.widgetMetas) {
    for (const meta of options.widgetMetas) {
      engine.registerWidget(meta)
    }
  }

  if (initialSchema) {
    const result = engine.importSchema(initialSchema)
    if (!result.ok)
      console.warn('[dragcraft/designer] initial schema rejected', result.diagnostics)
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
  const workspace = createDesignerWorkspace(options.workspace)

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

  const instance: DesignerInstance = {
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
    workspace,
    dispose,
  }
  registerDesignerSession(instance, createLegacyDesignerSessionAdapter(engine))
  return instance
}

function componentMapFromMaterials(options: DesignerOptions): ComponentMap {
  const map: ComponentMap = { ...(options.componentMap ?? {}) }
  for (const material of options.materials ?? []) {
    if (material.presentation.kind === 'visual' && map[material.type] === undefined)
      map[material.type] = material.presentation.preview
  }
  return map
}

function createNextDesigner(options: DesignerOptions): DesignerInstance {
  const materials = options.materials ?? []
  const catalog = createMaterialCatalog(materials)
  const engine = createAuthoringEngine({
    catalog,
    createNodeId: generateShortId,
    maxHistoryEntries: options.engineOptions?.maxHistorySize,
    schema: options.schema ?? EMPTY_DOCUMENT_SCHEMA,
  })
  const i18n = createI18n(options.locale ?? 'zh-CN', mergeDefaultMessages())
  const workspace = createDesignerWorkspace(options.workspace)

  if (options.messages) {
    for (const [locale, messages] of Object.entries(options.messages))
      i18n.mergeMessages(locale, messages)
  }

  const actionRegistry = createNodeActionRegistry(createDefaultActions(i18n.t))
  for (const action of options.customActions ?? [])
    actionRegistry.register(action)

  const session = createNextDesignerSessionAdapter({ catalog, engine })
  const importSchema = (input: unknown) => session.execute({
    type: 'schema.import',
    schema: input as never,
  })
  const instance = {
    componentMap: componentMapFromMaterials(options),
    widgetGroups: options.widgetGroups,
    extensions: options.extensions ?? {},
    fieldComponentMap: options.fieldComponentMap,
    globalConfigSchema: options.globalConfigSchema ?? null,
    eventHooks: options.eventHooks ?? {},
    actionInterceptors: options.actionInterceptors ?? [],
    actionRegistry,
    i18n,
    workspace,
    document: engine.document,
    selection: engine.selection,
    history: engine.history,
    execute: session.execute,
    importSchema,
    exportSchema: session.exportSchema,
    dispose: () => {},
  } as unknown as DesignerInstance

  registerDesignerSession(instance, session)
  return instance
}

/**
 * Creates a designer using the final Next backend when `materials` is supplied.
 * The legacy option shape remains an internal rollback seam for existing tests
 * and is intentionally not used by production consumers.
 */
export function createDesigner(options: DesignerOptions = {}): DesignerInstance {
  return options.materials !== undefined
    ? createNextDesigner(options)
    : createLegacyDesigner(options)
}
