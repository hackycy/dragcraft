import type { Ref, ShallowRef } from 'vue'
import type { DesignerSchema, DragTarget, SchemaNode, SchemaStoreInstance } from './types'
import { ref, shallowRef, toRaw, triggerRef } from 'vue'
import { DEFAULT_SCHEMA_VERSION } from './constants'
import { findNodeById as findNode } from './helpers'
import { mergeRecord } from './merge-record'
import { cloneRawSchema, cloneSchema } from './schema-utils'

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
  const schema: ShallowRef<DesignerSchema> = shallowRef(
    initialSchema ? cloneSchema(initialSchema) : createDefaultSchema(),
  )
  const selectedNodeId: Ref<string | null> = ref(null)
  const hoveredNodeId: Ref<string | null> = ref(null)
  const dragTarget: Ref<DragTarget | null> = ref(null)

  function getSchema(): DesignerSchema {
    return cloneRawSchema(schema.value)
  }

  /**
   * Returns the raw (unwrapped) schema object **without** cloning.
   *
   * **Warning:** Mutations on the returned object directly modify internal state
   * without triggering history snapshots or events. Intended for internal use
   * by command handlers that need efficient in-place edits. External callers
   * should prefer `getSchema()` which returns a deep clone.
   */
  function getRawSchema(): DesignerSchema {
    return toRaw(schema.value)
  }

  function setSchema(newSchema: DesignerSchema): void {
    schema.value = cloneSchema(newSchema)
  }

  function selectNode(id: string | null): void {
    selectedNodeId.value = id
    onSelectionChange?.(id)
  }

  function hoverNode(id: string | null): void {
    hoveredNodeId.value = id
  }

  function setDragTarget(target: DragTarget | null): void {
    dragTarget.value = target
  }

  function getNodeById(id: string): SchemaNode | null {
    return findNode(toRaw(schema.value).root, id)
  }

  /**
   * Lightweight node mutation that bypasses the command bus.
   *
   * **Note:** This method does NOT create a history snapshot and does NOT
   * emit `NODE_UPDATED` / `SCHEMA_CHANGED` events. Use it for transient
   * or high-frequency updates where undo/redo tracking is undesirable.
   * For undoable mutations, go through `commandBus.execute(UPDATE_PROPS)`.
   */
  function applyTransientPatch(
    nodeId: string,
    partial: Partial<Pick<SchemaNode, 'props' | 'style'>>,
  ): void {
    const node = getNodeById(nodeId)
    if (!node)
      return
    if (partial.props) {
      mergeRecord(node.props, partial.props)
    }
    if (partial.style) {
      if (!node.style)
        node.style = {}
      mergeRecord(node.style as Record<string, unknown>, partial.style as Record<string, unknown>)
    }
    triggerRef(schema)
  }

  function triggerUpdate(): void {
    triggerRef(schema)
  }

  return {
    schema,
    selectedNodeId,
    hoveredNodeId,
    dragTarget,
    getSchema,
    getRawSchema,
    setSchema,
    selectNode,
    hoverNode,
    setDragTarget,
    getNodeById,
    applyTransientPatch,
    triggerUpdate,
  }
}
