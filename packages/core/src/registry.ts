import type { FormSchemaShape, RegistryInstance, WidgetMeta } from './types'
import { validateContainerDefinition } from './container-definition'

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function createRegistry(): RegistryInstance {
  const widgets = new Map<string, WidgetMeta>()
  let globalConfigSchema: Record<string, unknown> | undefined

  function registerWidget(meta: WidgetMeta): void {
    if (!isRecord(meta)) {
      console.warn('[dragcraft/core] registerWidget: widget metadata must be a plain record')
      return
    }
    if (!meta.type || typeof meta.type !== 'string') {
      console.warn('[dragcraft/core] registerWidget: widget meta must have a non-empty "type" string')
      return
    }
    if (!meta.title || typeof meta.title !== 'string') {
      console.warn(`[dragcraft/core] registerWidget: widget "${meta.type}" must have a non-empty "title" string`)
      return
    }
    if (meta.container !== undefined) {
      const validation = validateContainerDefinition(meta.container)
      if (!validation.valid) {
        const codes = validation.errors.map(error => error.code).join(', ')
        console.warn(`[dragcraft/core] registerWidget: widget "${meta.type}" has an invalid container definition: ${codes}`)
        return
      }
    }
    if (widgets.has(meta.type)) {
      console.warn(`[dragcraft/core] Widget type "${meta.type}" is already registered, overwriting.`)
    }
    widgets.set(meta.type, meta)
  }

  function registerGlobalConfigSchema(schema: Record<string, unknown>): void {
    globalConfigSchema = schema
  }

  function registerGlobalConfigFormSchema(schema: FormSchemaShape): void {
    globalConfigSchema = schema as unknown as Record<string, unknown>
  }

  function getWidget(type: string): WidgetMeta | undefined {
    return widgets.get(type)
  }

  function getGlobalConfigSchema(): Record<string, unknown> | undefined {
    return globalConfigSchema
  }

  function getAllWidgets(): WidgetMeta[] {
    return Array.from(widgets.values())
  }

  return {
    registerWidget,
    registerGlobalConfigSchema,
    registerGlobalConfigFormSchema,
    getWidget,
    getGlobalConfigSchema,
    getAllWidgets,
  }
}
