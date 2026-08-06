import type { DocumentSchema } from '@dragcraft/core'
import type { FieldComponentMap, FormSchema } from '@dragcraft/form-generator'
import type { I18nInstance, LocaleMessages, MessageTree } from '@dragcraft/i18n'
import type { ConfirmAuthoringAction } from '../authoring/create-authoring-confirmation-coordinator'
import type { AuthoringEngine } from '../authoring/types'
import type { MaterialCatalog } from '../materials/create-material-catalog'
import type { MaterialDefinition } from '../materials/types'
import type { ContainerShellSource, DesignerExtensions, DesignerWorkspaceController, DesignerWorkspaceOptions } from '../types'
import { createI18n } from '@dragcraft/i18n'
import { createAuthoringConfirmationCoordinator } from '../authoring/create-authoring-confirmation-coordinator'
import { createAuthoringEngine } from '../authoring/create-authoring-engine'
import {
  createMaterialCatalog,
  DesignerConfigurationError,
} from '../materials/create-material-catalog'
import { designerMessages } from '../messages'
import { createDesignerWorkspace } from '../workspace'

export const DOCUMENT_SCHEMA_VERSION = '1'

export interface CreateDesignerOptions {
  readonly containerShell?: ContainerShellSource
  readonly confirmAuthoringAction?: ConfirmAuthoringAction
  readonly createNodeId?: () => string
  readonly extensions?: DesignerExtensions
  readonly fieldComponentMap?: FieldComponentMap
  readonly globalConfigSchema?: FormSchema
  readonly limits?: {
    readonly maxDiagnostics?: number
  }
  readonly locale?: string
  readonly materials: readonly MaterialDefinition[]
  readonly maxHistoryEntries?: number
  readonly messages?: LocaleMessages
  readonly schema?: unknown
  readonly workspace?: DesignerWorkspaceOptions
}

export interface DesignerInstance extends AuthoringEngine {
  dispose: () => void
}

export interface DesignerInternals {
  readonly catalog: MaterialCatalog
  readonly containerShell?: ContainerShellSource
  readonly executeWorkbenchAction: AuthoringEngine['execute']
  readonly extensions: DesignerExtensions
  readonly fieldComponentMap?: FieldComponentMap
  readonly globalConfigSchema: FormSchema | null
  readonly i18n: I18nInstance
  readonly maxDiagnostics?: number
  readonly workspace: DesignerWorkspaceController
}

const internalsByInstance = new WeakMap<DesignerInstance, DesignerInternals>()

function createDesignerI18n(locale: string, messages?: LocaleMessages): I18nInstance {
  const defaults = Object.fromEntries(Object.entries(designerMessages).map(([key, value]) => {
    return [key, { ...value } satisfies MessageTree]
  }))
  const i18n = createI18n(locale, defaults)
  for (const [messageLocale, localeMessages] of Object.entries(messages ?? {}))
    i18n.mergeMessages(messageLocale, localeMessages)
  return i18n
}

export function getDesignerInternals(instance: DesignerInstance): DesignerInternals {
  const internals = internalsByInstance.get(instance)
  if (!internals)
    throw new TypeError('DesignerInstance was not created by createDesigner()')
  return internals
}

function createEmptyDocument(): DocumentSchema {
  return {
    version: DOCUMENT_SCHEMA_VERSION,
    globalConfig: {},
    page: { props: {} },
    nodes: [],
    structure: { root: [], containers: {} },
  }
}

export function createDesigner(options: CreateDesignerOptions): DesignerInstance {
  if (!Array.isArray(options.materials))
    throw new DesignerConfigurationError('MATERIALS_INVALID', 'materials')
  if (options.maxHistoryEntries !== undefined
    && (!Number.isInteger(options.maxHistoryEntries) || options.maxHistoryEntries < 0)) {
    throw new DesignerConfigurationError('HISTORY_LIMIT_INVALID', 'maxHistoryEntries')
  }
  const catalog = createMaterialCatalog(options.materials)
  const schema = Object.hasOwn(options, 'schema')
    ? options.schema
    : createEmptyDocument()
  const engine = createAuthoringEngine({
    catalog,
    createNodeId: options.createNodeId ?? (() => crypto.randomUUID()),
    maxDiagnostics: options.limits?.maxDiagnostics,
    maxHistoryEntries: options.maxHistoryEntries,
    schema,
  })
  const confirmation = createAuthoringConfirmationCoordinator({
    catalog,
    confirm: options.confirmAuthoringAction,
    engine,
  })

  const instance = Object.freeze({
    ...engine,
    dispose: confirmation.dispose,
  })
  internalsByInstance.set(instance, Object.freeze({
    catalog,
    ...(options.containerShell ? { containerShell: options.containerShell } : {}),
    executeWorkbenchAction: confirmation.execute,
    extensions: Object.freeze({ ...options.extensions }),
    ...(options.fieldComponentMap ? { fieldComponentMap: options.fieldComponentMap } : {}),
    globalConfigSchema: options.globalConfigSchema ?? null,
    i18n: createDesignerI18n(options.locale ?? 'zh-CN', options.messages),
    ...(options.limits?.maxDiagnostics === undefined
      ? {}
      : { maxDiagnostics: options.limits.maxDiagnostics }),
    workspace: createDesignerWorkspace(options.workspace),
  }))
  return instance
}
