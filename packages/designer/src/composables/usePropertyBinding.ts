import type { DocumentDeepReadonly, DocumentSchema, NodeDefinition } from '@dragcraft/core'
import type { FieldSchema, FormSchema } from '@dragcraft/form-generator'
import type { ComputedRef } from 'vue'
import type { AuthoringResult } from '../authoring/types'
import type { MaterialDefinition } from '../materials/types'
import type { DesignerInstance } from '../session/create-designer'
import { computed } from 'vue'
import { createBindingAction, readBindingValue, resolveFieldBinding } from '../bindings/field-binding'
import { getDesignerInternals } from '../session/create-designer'

export interface UsePropertyBindingOptions {
  readonly globalConfigSchema?: FormSchema | null
}

export interface UsePropertyBindingReturn {
  readonly selectedNode: ComputedRef<NodeDefinition | null>
  readonly selectedFormSchema: ComputedRef<FormSchema | null>
  readonly selectedMaterial: ComputedRef<Readonly<MaterialDefinition> | undefined>
  readonly selectedNodeProps: ComputedRef<Record<string, unknown>>
  readonly globalConfigValues: ComputedRef<Record<string, unknown>>
  readonly handlePropertyChange: (key: string, value: unknown) => AuthoringResult | null
  readonly handleGlobalConfigChange: (key: string, value: unknown) => AuthoringResult | null
}

function findField(schema: FormSchema | null | undefined, key: string): FieldSchema | undefined {
  for (const section of schema?.sections ?? []) {
    const field = section.fields.find(item => item.key === key)
    if (field)
      return field
  }
  return undefined
}

export function usePropertyBinding(
  designer: DesignerInstance,
  options: UsePropertyBindingOptions = {},
): UsePropertyBindingReturn {
  const internals = getDesignerInternals(designer)
  const catalog = internals.catalog
  const selectedNode = computed<NodeDefinition | null>(() => {
    const state = designer.document.value
    const nodeId = designer.selection.selectedNodeId.value
    if (state.status === 'rejected' || !nodeId)
      return null
    return state.schema.nodes.find(node => node.id === nodeId) as NodeDefinition | undefined ?? null
  })
  const selectedMaterial = computed(() => {
    const node = selectedNode.value
    return node ? catalog.getMaterial(node.type) : undefined
  })
  const selectedFormSchema = computed<FormSchema | null>(() => selectedMaterial.value?.inspector?.formSchema ?? null)
  const selectedNodeProps = computed(() => {
    const node = selectedNode.value
    if (!node)
      return {}
    const values: Record<string, unknown> = { ...node.props }
    const schema = selectedFormSchema.value
    for (const section of schema?.sections ?? []) {
      for (const field of section.fields) {
        const binding = resolveFieldBinding(field.bindTo, { scope: 'node', path: `props.${field.key}` })
        const value = readBindingValue(binding, designer.document.value.status === 'rejected'
          ? emptyDocument()
          : designer.document.value.schema, node)
        if (value !== undefined)
          values[field.key] = value
      }
    }
    return values
  })
  const globalConfigValues = computed(() => {
    const state = designer.document.value
    const schema = state.status === 'rejected' ? emptyDocument() : state.schema
    return { ...schema.globalConfig }
  })

  function currentSchema(): DocumentDeepReadonly<DocumentSchema> | null {
    const state = designer.document.value
    return state.status === 'rejected' ? null : state.schema
  }
  function handlePropertyChange(key: string, value: unknown): AuthoringResult | null {
    const schema = currentSchema()
    const node = selectedNode.value
    if (!schema || !node)
      return null
    const field = findField(selectedFormSchema.value, key)
    const binding = resolveFieldBinding(field?.bindTo, { scope: 'node', path: `props.${key}` })
    const action = createBindingAction(binding, value, schema, node)
    return action ? internals.executeWorkbenchAction(action) : null
  }
  function handleGlobalConfigChange(key: string, value: unknown): AuthoringResult | null {
    const schema = currentSchema()
    if (!schema)
      return null
    const field = findField(options.globalConfigSchema, key)
    const binding = resolveFieldBinding(field?.bindTo, { scope: 'globalConfig', path: key })
    const action = createBindingAction(binding, value, schema, null)
    return action ? internals.executeWorkbenchAction(action) : null
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

function emptyDocument(): DocumentSchema {
  return {
    version: '1',
    globalConfig: {},
    page: { props: {} },
    nodes: [],
    structure: { root: [], containers: {} },
  }
}
