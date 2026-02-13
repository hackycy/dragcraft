import type { ContainerMeta, RegistryInstance, WidgetMeta } from './types'

export function createRegistry(): RegistryInstance {
  const widgets = new Map<string, WidgetMeta>()
  const containers = new Map<string, ContainerMeta>()
  let globalConfigSchema: Record<string, unknown> | undefined

  function registerWidget(meta: WidgetMeta): void {
    if (widgets.has(meta.type)) {
      console.warn(`[dragcraft/core] Widget type "${meta.type}" is already registered, overwriting.`)
    }
    widgets.set(meta.type, meta)
  }

  function registerContainer(meta: ContainerMeta): void {
    if (containers.has(meta.type)) {
      console.warn(`[dragcraft/core] Container type "${meta.type}" is already registered, overwriting.`)
    }
    containers.set(meta.type, meta)
  }

  function registerGlobalConfigSchema(schema: Record<string, unknown>): void {
    globalConfigSchema = schema
  }

  function getWidget(type: string): WidgetMeta | undefined {
    return widgets.get(type)
  }

  function getContainer(type: string): ContainerMeta | undefined {
    return containers.get(type)
  }

  function getGlobalConfigSchema(): Record<string, unknown> | undefined {
    return globalConfigSchema
  }

  function getAllWidgets(): WidgetMeta[] {
    return Array.from(widgets.values())
  }

  function getAllContainers(): ContainerMeta[] {
    return Array.from(containers.values())
  }

  return {
    registerWidget,
    registerContainer,
    registerGlobalConfigSchema,
    getWidget,
    getContainer,
    getGlobalConfigSchema,
    getAllWidgets,
    getAllContainers,
  }
}
