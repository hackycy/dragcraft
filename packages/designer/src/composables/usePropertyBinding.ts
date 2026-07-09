import type { DesignerEngine, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { FieldBindingScope, FieldBindingTarget, FieldSchema, FormSchema } from '@dragcraft/form-generator'
import type { ComputedRef } from 'vue'
import { CommandType } from '@dragcraft/core'
import { computed } from 'vue'

type FieldBinding = string | FieldBindingTarget | undefined

interface ResolvedBinding {
  scope: FieldBindingScope
  path: string
}

interface UsePropertyBindingOptions {
  globalConfigSchema?: FormSchema | null
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
  handlePropertyChange: (key: string, value: unknown) => void
  /** Handle global config change */
  handleGlobalConfigChange: (key: string, value: unknown) => void
}

const BLOCKED_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor'])

function toPathSegments(path: string): string[] {
  return path
    .split('.')
    .map(segment => segment.trim())
    .filter(Boolean)
    .filter(segment => !BLOCKED_PATH_SEGMENTS.has(segment))
}

function readPath(source: unknown, path: string): unknown {
  let current = source
  for (const segment of toPathSegments(path)) {
    if (typeof current !== 'object' || current === null)
      return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function setPatchPath(path: string, value: unknown): Record<string, unknown> {
  const segments = toPathSegments(path)
  if (segments.length === 0)
    return {}

  const root: Record<string, unknown> = {}
  let cursor = root
  for (let i = 0; i < segments.length - 1; i++) {
    const next: Record<string, unknown> = {}
    cursor[segments[i]] = next
    cursor = next
  }
  cursor[segments[segments.length - 1]] = value
  return root
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

function resolveBinding(
  binding: FieldBinding,
  fallback: ResolvedBinding,
): ResolvedBinding {
  if (typeof binding === 'string')
    return { scope: fallback.scope, path: binding }
  if (binding)
    return { scope: binding.scope ?? fallback.scope, path: binding.path }
  return fallback
}

function readBindingValue(
  binding: ResolvedBinding,
  schema: ReturnType<DesignerEngine['store']['getRawSchema']>,
  node: SchemaNode | null,
): unknown {
  if (binding.scope === 'globalConfig')
    return readPath(schema.globalConfig, binding.path)
  if (binding.scope === 'schema')
    return readPath(schema, binding.path)
  return node ? readPath(node, binding.path) : undefined
}

function splitHead(path: string): [string | undefined, string] {
  const segments = toPathSegments(path)
  const [head, ...rest] = segments
  return [head, rest.join('.')]
}

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
    // WidgetMeta.formSchema is Record<string, unknown> but structured as FormSchema
    return meta.formSchema as FormSchema
  })

  const selectedNodeProps = computed<Record<string, unknown>>(() => {
    const node = selectedNode.value
    if (!node)
      return {}
    const schema = engine.state.getSchema()
    const values = { ...node.props }
    for (const section of selectedFormSchema.value?.sections ?? []) {
      for (const field of section.fields) {
        const binding = resolveBinding(
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
        const binding = resolveBinding(
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

  function dispatchNodeBinding(nodeId: string, path: string, value: unknown): void {
    const [head, rest] = splitHead(path)
    if (head === 'props') {
      engine.execute({
        type: CommandType.UPDATE_PROPS,
        payload: { nodeId, props: setPatchPath(rest, value) },
      })
      return
    }
    if (head === 'style') {
      engine.execute({
        type: CommandType.UPDATE_PROPS,
        payload: { nodeId, props: {}, style: setPatchPath(rest, value) },
      })
      return
    }
    console.warn(`[dragcraft/designer] Unsupported node binding path "${path}"`)
  }

  function dispatchSchemaBinding(path: string, value: unknown): void {
    const [head, rest] = splitHead(path)
    if (head === 'globalConfig') {
      engine.execute({
        type: CommandType.SET_GLOBAL_CONFIG,
        payload: { config: setPatchPath(rest, value) },
      })
      return
    }
    if (head === 'root') {
      dispatchNodeBinding('root', rest, value)
      return
    }
    console.warn(`[dragcraft/designer] Unsupported schema binding path "${path}"`)
  }

  function dispatchBinding(
    binding: ResolvedBinding,
    value: unknown,
    nodeId?: string,
  ): void {
    if (binding.scope === 'globalConfig') {
      engine.execute({
        type: CommandType.SET_GLOBAL_CONFIG,
        payload: { config: setPatchPath(binding.path, value) },
      })
      return
    }
    if (binding.scope === 'schema') {
      dispatchSchemaBinding(binding.path, value)
      return
    }
    if (nodeId)
      dispatchNodeBinding(nodeId, binding.path, value)
  }

  function handlePropertyChange(key: string, value: unknown): void {
    const nodeId = engine.store.selectedNodeId.value
    if (!nodeId)
      return

    const field = findField(selectedFormSchema.value, key)
    const binding = resolveBinding(
      getFieldBinding(field),
      { scope: 'node', path: `props.${key}` },
    )
    dispatchBinding(binding, value, nodeId)
  }

  function handleGlobalConfigChange(key: string, value: unknown): void {
    const field = findField(options.globalConfigSchema, key)
    const binding = resolveBinding(
      getFieldBinding(field),
      { scope: 'globalConfig', path: key },
    )
    dispatchBinding(binding, value)
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
