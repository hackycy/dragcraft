import type { FieldComponentMap, FormSchema } from '@dragcraft/form-generator'
import type { I18nInstance } from '@dragcraft/i18n'
import type { NodeActionRegistry } from './presentation/action-registry'
import type { ActionInterceptor } from './presentation/action-runtime'
import type { RendererEventHooks } from './presentation/event-hooks'
import type { ComponentMap } from './presentation/types'
import type { DesignerExtensions, DesignerInstance, DesignerWorkspaceController, MaterialPanelGroup } from './types'

export interface DesignerRuntimeConfiguration {
  readonly actionInterceptors: ActionInterceptor[]
  readonly actionRegistry: NodeActionRegistry
  readonly componentMap: ComponentMap
  readonly eventHooks: RendererEventHooks
  readonly extensions: DesignerExtensions
  readonly fieldComponentMap: FieldComponentMap | undefined
  readonly globalConfigSchema: FormSchema | null
  readonly i18n: I18nInstance
  readonly materialGroups: readonly MaterialPanelGroup[]
  readonly workspace: DesignerWorkspaceController
}

const configurations = new WeakMap<DesignerInstance, DesignerRuntimeConfiguration>()

export function registerDesignerRuntimeConfiguration(
  instance: DesignerInstance,
  configuration: DesignerRuntimeConfiguration,
): void {
  configurations.set(instance, configuration)
}

/** Internal lookup used by the Designer presentation. */
export function getDesignerRuntimeConfiguration(instance: DesignerInstance): DesignerRuntimeConfiguration {
  const configuration = configurations.get(instance)
  if (!configuration)
    throw new TypeError('DesignerInstance was not created by createDesigner()')
  return configuration
}
