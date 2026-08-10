import type { DocumentSchema } from '@dragcraft/core'
import type { MessageTree } from '@dragcraft/i18n'
import type { ComponentMap } from './presentation/types'
import type {
  DesignerInstance,
  DesignerOptions,
  MaterialPanelGroup,
} from './types'
import { createI18n } from '@dragcraft/i18n'
import { generateShortId } from '@dragcraft/utils'
import { createAuthoringEngine } from './authoring/create-authoring-engine'
import { registerDesignerRuntimeConfiguration } from './instance-config'
import { createMaterialCatalog, DesignerConfigurationError } from './materials/create-material-catalog'
import { designerMessages } from './messages'
import { createDefaultActions, createNodeActionRegistry } from './presentation/action-registry'
import { rendererMessages } from './presentation/messages'
import { registerDesignerSession } from './session/get-designer-session'
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
