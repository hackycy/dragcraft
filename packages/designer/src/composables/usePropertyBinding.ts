import type { CommandExecutionResult, DesignerEngine, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { FieldSchema, FormSchema } from '@dragcraft/form-generator'
import type { ComputedRef } from 'vue'
import type { FieldBinding } from '../bindings/field-binding'
import { cloneDeep } from '@dragcraft/utils'
import { computed } from 'vue'
import { createBindingCommand, readBindingValue, resolveFieldBinding } from '../bindings/field-binding'

export interface UsePropertyBindingOptions {
  globalConfigSchema?: FormSchema | null
  t?: (key: string, fallback?: string) => string
}

// ──────────────────────────────────────────
// Return type
// ──────────────────────────────────────────

export interface UsePropertyBindingReturn {
  /** The selected node, reactively derived */
  selectedNode: ComputedRef<SchemaNode | null>
  /** The form schema for the selected node's widget type */
  selectedFormSchema: ComputedRef<FormSchema | null>
  /** The selected widget meta */
  selectedWidgetMeta: ComputedRef<WidgetMeta | undefined>
  /** The current property values for the selected node */
  selectedNodeProps: ComputedRef<Record<string, unknown>>
  /** The current values for the global config form */
  globalConfigValues: ComputedRef<Record<string, unknown>>
  /** Handle property change from the form generator */
  handlePropertyChange: (key: string, value: unknown) => CommandExecutionResult | null
  /** Handle global config change */
  handleGlobalConfigChange: (key: string, value: unknown) => CommandExecutionResult | null
}

function findField(schema: FormSchema | null | undefined, key: string): FieldSchema | undefined {
  for (const section of schema?.sections ?? []) {
    const field = section.fields.find(item => item.key === key)
    if (field)
      return field
  }
  return undefined
}

function getFieldBinding(field: FieldSchema | undefined): FieldBinding {
  return field?.bindTo
}

type ResolvedBinding = ReturnType<typeof resolveFieldBinding>

// ──────────────────────────────────────────
// Composable
// ──────────────────────────────────────────

/**
 * Bridges the currently selected node's props and formSchema
 * to the form-generator, and dispatches property updates as commands.
 */
export function usePropertyBinding(
  engine: DesignerEngine,
  options: UsePropertyBindingOptions = {},
): UsePropertyBindingReturn {
  const translate = options.t ?? ((key: string, fallback?: string) => fallback ?? key)

  const selectedNode = computed<SchemaNode | null>(() => {
    const nodeId = engine.store.selectedNodeId.value
    if (!nodeId)
      return null
    return engine.state.getNodeById(nodeId)
  })

  const selectedWidgetMeta = computed<WidgetMeta | undefined>(() => {
    const node = selectedNode.value
    if (!node)
      return undefined
    return engine.registry.getWidget(node.type)
  })

  const selectedFormSchema = computed<FormSchema | null>(() => {
    const meta = selectedWidgetMeta.value
    if (!meta)
      return null
    // WidgetMeta.formSchema is Record<string, unknown> but structured as FormSchema.
    const schema = cloneDeep(meta.formSchema as FormSchema)
    if (!meta.container)
      return schema

    const variantOptions = Object.entries(meta.container.variants).map(([value, variant]) => ({
      value,
      label: variant.titleKey
        ? translate(variant.titleKey, variant.title)
        : variant.title,
    }))

    for (const section of schema.sections) {
      for (const field of section.fields) {
        const binding = resolveFieldBinding(
          getFieldBinding(field),
          { scope: 'node', path: `props.${field.key}` },
        )
        if (binding.scope !== 'container' || binding.path !== 'variant')
          continue

        const original = field.componentProps
        field.componentProps = ctx => ({
          ...(typeof original === 'function' ? original(ctx) : original ?? {}),
          options: variantOptions,
        })
      }
    }

    return schema
  })

  const selectedNodeProps = computed<Record<string, unknown>>(() => {
    const node = selectedNode.value
    if (!node)
      return {}
    const schema = engine.state.getSchema()
    const values = { ...node.props }
    for (const section of selectedFormSchema.value?.sections ?? []) {
      for (const field of section.fields) {
        const binding = resolveFieldBinding(
          getFieldBinding(field),
          { scope: 'node', path: `props.${field.key}` },
        )
        const value = readBindingValue(binding, schema, node)
        if (value !== undefined)
          values[field.key] = value
      }
    }
    return values
  })

  const globalConfigValues = computed<Record<string, unknown>>(() => {
    const schema = engine.state.getSchema()
    const values = { ...schema.globalConfig }
    for (const section of options.globalConfigSchema?.sections ?? []) {
      for (const field of section.fields) {
        const binding = resolveFieldBinding(
          getFieldBinding(field),
          { scope: 'globalConfig', path: field.key },
        )
        const value = readBindingValue(binding, schema, null)
        if (value !== undefined)
          values[field.key] = value
      }
    }
    return values
  })

  function dispatchBinding(
    binding: ResolvedBinding,
    value: unknown,
    nodeId?: string,
  ): CommandExecutionResult | null {
    const command = createBindingCommand(binding, value, nodeId)
    if (!command) {
      console.warn(`[dragcraft/designer] Unsupported binding path "${binding.path}"`)
      return null
    }
    return engine.execute(command)
  }

  function handlePropertyChange(key: string, value: unknown): CommandExecutionResult | null {
    const nodeId = engine.store.selectedNodeId.value
    if (!nodeId)
      return null

    const field = findField(selectedFormSchema.value, key)
    const binding = resolveFieldBinding(
      getFieldBinding(field),
      { scope: 'node', path: `props.${key}` },
    )
    return dispatchBinding(binding, value, nodeId)
  }

  function handleGlobalConfigChange(key: string, value: unknown): CommandExecutionResult | null {
    const field = findField(options.globalConfigSchema, key)
    const binding = resolveFieldBinding(
      getFieldBinding(field),
      { scope: 'globalConfig', path: key },
    )
    return dispatchBinding(binding, value)
  }

  return {
    selectedNode,
    selectedFormSchema,
    selectedWidgetMeta,
    selectedNodeProps,
    globalConfigValues,
    handlePropertyChange,
    handleGlobalConfigChange,
  }
}
