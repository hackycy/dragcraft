import type { DeepReadonly as CoreDeepReadonly, DocumentSchema, NodeDefinition } from '@dragcraft/core'
import type { FieldSchema, FormSchema } from '@dragcraft/form-generator'
import type { ComputedRef } from 'vue'
import type { FieldBinding } from '../bindings/field-binding'
import type { MaterialDefinition } from '../materials/types'
import type { DesignerSession } from '../session/types'
import { cloneDeep } from '@dragcraft/utils'
import { computed } from 'vue'
import { createBindingAction, readBindingValue, resolveFieldBinding } from '../bindings/field-binding'

export interface UsePropertyBindingOptions {
  globalConfigSchema?: FormSchema | null
  t?: (key: string, fallback?: string) => string
}

// ──────────────────────────────────────────
// Return type
// ──────────────────────────────────────────

export interface UsePropertyBindingReturn {
  /** The selected node, reactively derived */
  selectedNode: ComputedRef<CoreDeepReadonly<NodeDefinition> | null>
  /** The form schema for the selected node's widget type */
  selectedFormSchema: ComputedRef<FormSchema | null>
  /** The selected material definition. */
  selectedMaterial: ComputedRef<Readonly<MaterialDefinition> | undefined>
  /** The current property values for the selected node */
  selectedNodeProps: ComputedRef<Record<string, unknown>>
  /** The current values for the global config form */
  globalConfigValues: ComputedRef<Record<string, unknown>>
  /** Handle property change from the form generator */
  handlePropertyChange: (key: string, value: unknown) => ReturnType<DesignerSession['execute']> | null
  /** Handle global config change */
  handleGlobalConfigChange: (key: string, value: unknown) => ReturnType<DesignerSession['execute']> | null
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

function forceFieldDisabled(field: FieldSchema): void {
  field.disabled = () => true
  if (!field.dependencies)
    return

  const dependencies = field.dependencies
  field.dependencies = {
    ...dependencies,
    handler: (values, fieldValue) => ({
      ...dependencies.handler(values, fieldValue),
      disabled: () => true,
    }),
  }
}

// ──────────────────────────────────────────
// Composable
// ──────────────────────────────────────────

/**
 * Bridges the currently selected node's props and formSchema
 * to the form-generator, and dispatches property updates as commands.
 */
export function usePropertyBinding(
  session: DesignerSession,
  options: UsePropertyBindingOptions = {},
): UsePropertyBindingReturn {
  const bindingDocument = computed<Pick<CoreDeepReadonly<DocumentSchema>, 'globalConfig' | 'page'>>(() => {
    const schema = session.document.schema.value
    return schema
      ? { globalConfig: schema.globalConfig, page: schema.page }
      : { globalConfig: {}, page: { props: {} } }
  })

  const selectedNode = computed<CoreDeepReadonly<NodeDefinition> | null>(() => {
    const nodeId = session.state.selectedNodeId.value
    if (!nodeId)
      return null
    return session.document.getNode(nodeId)
  })

  const selectedMaterial = computed<Readonly<MaterialDefinition> | undefined>(() => {
    const node = selectedNode.value
    if (!node)
      return undefined
    return session.materials.get(node.type)
  })

  const selectedFormSchema = computed<FormSchema | null>(() => {
    const material = selectedMaterial.value
    const node = selectedNode.value
    if (!material || !node)
      return null
    const formSchema = material.inspector?.formSchema
    if (!formSchema)
      return null
    const schema = cloneDeep(formSchema)
    const configurable = session.materials.resolveCapability(node, 'configurable')

    for (const section of schema.sections) {
      for (const field of section.fields) {
        const binding = resolveFieldBinding(
          getFieldBinding(field),
          { scope: 'node', path: `props.${field.key}` },
        )
        const isNodeConfiguration = binding.scope === 'node'
          && (binding.path.startsWith('props.') || binding.path.startsWith('style.'))
        if (isNodeConfiguration && !configurable)
          forceFieldDisabled(field)
      }
    }

    return schema
  })

  const selectedNodeProps = computed<Record<string, unknown>>(() => {
    const node = selectedNode.value
    if (!node)
      return {}
    const values: Record<string, unknown> = { ...node.props }
    for (const section of selectedFormSchema.value?.sections ?? []) {
      for (const field of section.fields) {
        const binding = resolveFieldBinding(
          getFieldBinding(field),
          { scope: 'node', path: `props.${field.key}` },
        )
        const value = readBindingValue(binding, bindingDocument.value, node)
        if (value !== undefined)
          values[field.key] = value
      }
    }
    return values
  })

  const globalConfigValues = computed<Record<string, unknown>>(() => {
    const values: Record<string, unknown> = { ...session.document.globalConfig.value }
    for (const section of options.globalConfigSchema?.sections ?? []) {
      for (const field of section.fields) {
        const binding = resolveFieldBinding(
          getFieldBinding(field),
          { scope: 'globalConfig', path: field.key },
        )
        const value = readBindingValue(binding, bindingDocument.value, null)
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
  ): ReturnType<DesignerSession['execute']> | null {
    const action = createBindingAction(binding, value, nodeId)
    if (!action) {
      console.warn(`[dragcraft/designer] Unsupported binding path "${binding.path}"`)
      return null
    }
    return session.execute(action)
  }

  function handlePropertyChange(key: string, value: unknown): ReturnType<DesignerSession['execute']> | null {
    const nodeId = session.state.selectedNodeId.value
    if (!nodeId)
      return null

    const field = findField(selectedFormSchema.value, key)
    const binding = resolveFieldBinding(
      getFieldBinding(field),
      { scope: 'node', path: `props.${key}` },
    )
    return dispatchBinding(binding, value, nodeId)
  }

  function handleGlobalConfigChange(key: string, value: unknown): ReturnType<DesignerSession['execute']> | null {
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
    selectedMaterial,
    selectedNodeProps,
    globalConfigValues,
    handlePropertyChange,
    handleGlobalConfigChange,
  }
}
