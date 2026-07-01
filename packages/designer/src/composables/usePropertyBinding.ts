import type { DesignerEngine, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { FormSchema } from '@dragcraft/form-generator'
import type { ComputedRef } from 'vue'
import { CommandType } from '@dragcraft/core'
import { computed } from 'vue'

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
  /** Handle property change from the form generator */
  handlePropertyChange: (key: string, value: unknown) => void
  /** Handle global config change */
  handleGlobalConfigChange: (key: string, value: unknown) => void
}

// ──────────────────────────────────────────
// Composable
// ──────────────────────────────────────────

/**
 * Bridges the currently selected node's props and formSchema
 * to the form-generator, and dispatches property updates as commands.
 */
export function usePropertyBinding(engine: DesignerEngine): UsePropertyBindingReturn {
  const selectedNode = computed<SchemaNode | null>(() => {
    const nodeId = engine.store.selectedNodeId.value
    if (!nodeId)
      return null
    // Read schema.value to establish reactive dependency on schema changes
    void engine.store.schema.value
    return engine.store.getNodeById(nodeId)
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
    // WidgetMeta.formSchema is Record<string, unknown> but structured as FormSchema
    return meta.formSchema as FormSchema
  })

  const selectedNodeProps = computed<Record<string, unknown>>(() => {
    const node = selectedNode.value
    if (!node)
      return {}
    return { ...node.props }
  })

  function handlePropertyChange(key: string, value: unknown): void {
    const nodeId = engine.store.selectedNodeId.value
    if (!nodeId)
      return

    engine.execute({
      type: CommandType.UPDATE_PROPS,
      payload: {
        nodeId,
        props: { [key]: value },
      },
    })
  }

  function handleGlobalConfigChange(key: string, value: unknown): void {
    engine.execute({
      type: CommandType.SET_GLOBAL_CONFIG,
      payload: {
        config: { [key]: value },
      },
    })
  }

  return {
    selectedNode,
    selectedFormSchema,
    selectedWidgetMeta,
    selectedNodeProps,
    handlePropertyChange,
    handleGlobalConfigChange,
  }
}
