import type { DocumentSchema } from '@dragcraft/core'
import type { FieldComponentMap, FormSchema } from '@dragcraft/form-generator'
import type { LocaleMessages, MessageTree } from '@dragcraft/i18n'
import type { WidgetGroupConfig } from '@dragcraft/widgets'
import type { MaterialDefinition } from '../materials/types'
import type { NodeActionDefinition } from '../presentation/action-registry'
import type { ActionInterceptor } from '../presentation/action-runtime'
import type { RendererEventHooks } from '../presentation/event-hooks'
import type { ComponentMap } from '../presentation/types'
import type { DesignerExtensions, DesignerInstance, DesignerWorkspaceOptions } from '../types'
import { createI18n } from '@dragcraft/i18n'
import { generateShortId } from '@dragcraft/utils'
import { createAuthoringEngine } from '../authoring/create-authoring-engine'
import { registerDesignerRuntimeConfiguration } from '../instance-config'
import { createMaterialCatalog } from '../materials/create-material-catalog'
import { designerMessages } from '../messages'
import { createDefaultActions, createNodeActionRegistry } from '../presentation/action-registry'
import { rendererMessages } from '../presentation/messages'
import { registerDesignerSession } from '../session/get-designer-session'
import { createNextDesignerSessionAdapter } from '../session/next-designer-session-adapter'
import { createDesignerWorkspace } from '../workspace'

export type { MaterialDefinition } from '../materials/types'
export type { DocumentSchema } from '@dragcraft/core'

export interface NextDesignerHarnessOptions {
  readonly actionInterceptors?: ActionInterceptor[]
  readonly componentMap: ComponentMap
  readonly createNodeId?: () => string
  readonly customActions?: NodeActionDefinition[]
  readonly eventHooks?: RendererEventHooks
  readonly extensions?: DesignerExtensions
  readonly fieldComponentMap?: FieldComponentMap
  readonly globalConfigSchema?: FormSchema
  readonly locale?: string
  readonly materials: readonly MaterialDefinition[]
  readonly maxHistoryEntries?: number
  readonly messages?: LocaleMessages
  readonly schema: DocumentSchema
  readonly widgetGroups?: WidgetGroupConfig[]
  readonly workspace?: DesignerWorkspaceOptions
}

export type NextDesignerHarnessInstance = DesignerInstance

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
 * Development-only harness for mounting the existing workbench with the Next
 * backend. It intentionally is not exported from the Designer public entry.
 */
export function createNextDesignerHarness(options: NextDesignerHarnessOptions): NextDesignerHarnessInstance {
  const catalog = createMaterialCatalog(options.materials)
  const engine = createAuthoringEngine({
    catalog,
    createNodeId: options.createNodeId ?? generateShortId,
    maxHistoryEntries: options.maxHistoryEntries,
    schema: options.schema,
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
  const instance: NextDesignerHarnessInstance = {
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
    componentMap: options.componentMap,
    materialGroups: options.widgetGroups?.map(group => ({
      name: group.name,
      title: group.title,
      ...(group.titleKey ? { titleKey: group.titleKey } : {}),
    })) ?? [],
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
