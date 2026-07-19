import type { Ref, ShallowRef } from 'vue'
import type { DeepReadonly, DesignerSchema, DragTarget, SchemaIndexResult, SchemaNode, SchemaStoreInstance } from './types'
import { ref, shallowRef } from 'vue'
import { DEFAULT_SCHEMA_VERSION } from './constants'
import { buildSchemaIndex } from './schema-index'
import { cloneSchema, deepFreeze } from './schema-utils'

export function createDefaultSchema(): DesignerSchema {
  return {
    version: DEFAULT_SCHEMA_VERSION,
    globalConfig: {},
    root: {
      id: 'root',
      type: 'root',
      props: {},
      children: [],
    },
  }
}

export function createSchemaStore(
  initialSchema?: DesignerSchema,
  onSelectionChange?: (id: string | null) => void,
): SchemaStoreInstance {
  const schema: ShallowRef<DeepReadonly<DesignerSchema>> = shallowRef(
    deepFreeze(initialSchema ? cloneSchema(initialSchema) : createDefaultSchema()),
  )
  const selectedNodeId: Ref<string | null> = ref(null)
  const hoveredNodeId: Ref<string | null> = ref(null)
  const dragTarget: Ref<DragTarget | null> = ref(null)
  let schemaIndex: SchemaIndexResult | null = null

  function getSchema(): DesignerSchema {
    return cloneSchema(schema.value)
  }

  function getSnapshot(): DeepReadonly<DesignerSchema> {
    return schema.value
  }

  function replaceSnapshot(snapshot: DeepReadonly<DesignerSchema>): void {
    schemaIndex = null
    schema.value = snapshot
  }

  function setSchema(newSchema: DesignerSchema): void {
    replaceSnapshot(deepFreeze(cloneSchema(newSchema)))
  }

  function commitSchema(newSchema: DesignerSchema): DeepReadonly<DesignerSchema> {
    const snapshot = deepFreeze(newSchema)
    replaceSnapshot(snapshot)
    return snapshot
  }

  function restoreSnapshot(snapshot: DeepReadonly<DesignerSchema>): void {
    replaceSnapshot(snapshot)
  }

  function selectNode(id: string | null): void {
    selectedNodeId.value = id
    onSelectionChange?.(id)
  }

  function hoverNode(id: string | null): void {
    hoveredNodeId.value = id
  }

  function setDragTarget(target: DragTarget | null): void {
    dragTarget.value = target ? { ...target } : null
  }

  function getNodeById(id: string): DeepReadonly<SchemaNode> | null {
    if (schema.value.root.id === id)
      return schema.value.root
    schemaIndex ??= buildSchemaIndex(schema.value as DesignerSchema)
    return schemaIndex.index.get(id)?.node ?? null
  }

  return {
    schema,
    selectedNodeId,
    hoveredNodeId,
    dragTarget,
    getSchema,
    getSnapshot,
    setSchema,
    commitSchema,
    restoreSnapshot,
    selectNode,
    hoverNode,
    setDragTarget,
    getNodeById,
  }
}
