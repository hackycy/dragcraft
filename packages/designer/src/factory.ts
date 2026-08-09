import type { DocumentSchema } from '@dragcraft/core'
import type { FieldComponentMap, FormSchema } from '@dragcraft/form-generator'
import type { I18nInstance, LocaleMessages, MessageTree } from '@dragcraft/i18n'
import type { DesignerEngine, FormSchemaShape } from '@dragcraft/legacy-core'
import type { WidgetGroupConfig } from '@dragcraft/widgets'
import type { ActionInterceptor } from './presentation/action-runtime'
import type { RendererEventHooks } from './presentation/event-hooks'
import type { ComponentMap } from './presentation/types'
import type {
  DesignerEngineOptions,
  DesignerExtensions,
  DesignerInstance,
  DesignerOptions,
  DesignerWidgetMeta,
  DesignerWorkspaceController,
  DesignerWorkspaceOptions,
  MaterialPanelGroup,
} from './types'
import { createI18n } from '@dragcraft/i18n'
import { createEngine } from '@dragcraft/legacy-core'
import { generateShortId } from '@dragcraft/utils'
import { createAuthoringEngine } from './authoring/create-authoring-engine'
import { registerDesignerRuntimeConfiguration } from './instance-config'
import { createMaterialCatalog, DesignerConfigurationError } from './materials/create-material-catalog'
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

interface LegacyDesignerOptions {
  readonly actionInterceptors?: ActionInterceptor[]
  readonly componentMap?: ComponentMap
  readonly customActions?: Parameters<typeof createNodeActionRegistry>[0]
  readonly engineOptions?: DesignerEngineOptions
  readonly eventHooks?: RendererEventHooks
  readonly extensions?: DesignerExtensions
  readonly fieldComponentMap?: FieldComponentMap
  readonly globalConfigSchema?: FormSchema
  readonly locale?: string
  readonly messages?: LocaleMessages
  readonly widgetGroups?: WidgetGroupConfig[]
  readonly widgetMetas?: DesignerWidgetMeta[]
  readonly workspace?: DesignerWorkspaceOptions
}

export interface LegacyDesignerInstanceForTest extends DesignerInstance {
  readonly actionInterceptors: ActionInterceptor[]
  readonly actionRegistry: ReturnType<typeof createNodeActionRegistry>
  readonly componentMap: ComponentMap
  readonly engine: DesignerEngine
  readonly eventHooks: RendererEventHooks
  readonly extensions: DesignerExtensions
  readonly fieldComponentMap: FieldComponentMap | undefined
  readonly globalConfigSchema: FormSchema | null
  readonly i18n: I18nInstance
  readonly materialGroups: readonly MaterialPanelGroup[]
  readonly widgetGroups: readonly WidgetGroupConfig[] | undefined
  readonly workspace: DesignerWorkspaceController
}

function materialGroupsFromWidgets(
  widgetMetas: readonly DesignerWidgetMeta[] | undefined,
  widgetGroups: readonly WidgetGroupConfig[] | undefined,
): readonly MaterialPanelGroup[] {
  if (widgetGroups) {
    return widgetGroups.map(group => ({
      name: group.name,
      title: group.title,
      ...(group.titleKey ? { titleKey: group.titleKey } : {}),
    }))
  }

  return [...new Set(widgetMetas?.map(meta => meta.group) ?? [])]
    .map(name => ({ name, title: name }))
}

function materialGroupsFromMaterials(materials: readonly DesignerOptions['materials'][number][]): readonly MaterialPanelGroup[] {
  const groups = new Map<string, MaterialPanelGroup>()
  for (const material of materials) {
    const name = material.panel?.group ?? 'default'
    const existing = groups.get(name)
    if (existing && material.panel?.groupTitle === undefined && material.panel?.groupTitleKey === undefined)
      continue
    groups.set(name, {
      name,
      title: material.panel?.groupTitle ?? name,
      ...(material.panel?.groupTitleKey ? { titleKey: material.panel.groupTitleKey } : {}),
    })
  }
  return [...groups.values()]
}

/**
 * Internal-only Legacy constructor retained until the deletion gate removes the
 * old implementation. Production callers must use createDesigner().
 */
export function createLegacyDesignerForTest(options: LegacyDesignerOptions): LegacyDesignerInstanceForTest {
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
  const materialGroups = materialGroupsFromWidgets(options.widgetMetas, widgetGroups)

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

  const instance = {
    engine,
    componentMap,
    widgetGroups,
    materialGroups,
    extensions,
    fieldComponentMap,
    globalConfigSchema,
    eventHooks,
    actionInterceptors,
    actionRegistry,
    i18n,
    workspace,
    dispose,
  } as unknown as LegacyDesignerInstanceForTest
  registerDesignerRuntimeConfiguration(instance, {
    componentMap,
    materialGroups,
    extensions,
    fieldComponentMap,
    globalConfigSchema,
    eventHooks,
    actionInterceptors,
    actionRegistry,
    i18n,
    workspace,
  })
  registerDesignerSession(instance, createLegacyDesignerSessionAdapter(engine))
  return instance
}

function componentMapFromMaterials(materials: DesignerOptions['materials']): ComponentMap {
  const map: ComponentMap = {}
  for (const material of materials) {
    if (material.presentation.kind === 'visual')
      map[material.type] = material.presentation.preview
  }
  return map
}

function createNextDesigner(options: DesignerOptions): DesignerInstance {
  const { materials } = options
  const catalog = createMaterialCatalog(materials)
  const engine = createAuthoringEngine({
    catalog,
    createNodeId: generateShortId,
    maxHistoryEntries: options.maxHistoryEntries,
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
  const instance: DesignerInstance = {
    document: engine.document,
    selection: engine.selection,
    history: engine.history,
    execute: engine.execute,
    importSchema: engine.importSchema,
    exportSchema: engine.exportSchema,
    setLocale: i18n.setLocale,
    dispose: () => {},
  }

  registerDesignerRuntimeConfiguration(instance, {
    componentMap: componentMapFromMaterials(materials),
    materialGroups: materialGroupsFromMaterials(materials),
    extensions: options.extensions ?? {},
    fieldComponentMap: options.fieldComponentMap,
    globalConfigSchema: options.globalConfigSchema ?? null,
    eventHooks: options.eventHooks ?? {},
    actionInterceptors: options.actionInterceptors ?? [],
    actionRegistry,
    i18n,
    workspace,
  })
  registerDesignerSession(instance, session)
  return instance
}

/**
 * Creates a Designer using the final MaterialDefinition and DocumentSchema
 * contract. The legacy constructor is intentionally not reachable here.
 */
export function createDesigner(options: DesignerOptions): DesignerInstance
export function createDesigner(options?: DesignerOptions): DesignerInstance {
  if (!options || options.materials === undefined)
    throw new DesignerConfigurationError('MATERIALS_INVALID', 'materials')
  return createNextDesigner(options)
}
