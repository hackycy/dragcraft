import type { Ref, ShallowRef } from '@vue/reactivity'
import type { DesignerSchema, DragTarget, SchemaNode, SchemaStoreInstance } from './types'
import { cloneDeep } from '@dragcraft/utils'
import { ref, shallowRef, toRaw, triggerRef } from '@vue/reactivity'
import { DEFAULT_SCHEMA_VERSION } from './constants'
import { findNodeById as findNode } from './helpers'

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
): SchemaStoreInstance {
  const schema: ShallowRef<DesignerSchema> = shallowRef(
    initialSchema ? cloneDeep(initialSchema) : createDefaultSchema(),
  )
  const selectedNodeId: Ref<string | null> = ref(null)
  const hoveredNodeId: Ref<string | null> = ref(null)
  const dragTarget: Ref<DragTarget | null> = ref(null)

  function getSchema(): DesignerSchema {
    return cloneDeep(toRaw(schema.value))
  }

  function getRawSchema(): DesignerSchema {
    return toRaw(schema.value)
  }

  function setSchema(newSchema: DesignerSchema): void {
    schema.value = cloneDeep(newSchema)
  }

  function selectNode(id: string | null): void {
    selectedNodeId.value = id
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

  function patchNode(
    nodeId: string,
    partial: Partial<Pick<SchemaNode, 'props' | 'style'>>,
  ): void {
    const node = getNodeById(nodeId)
    if (!node)
      return
    if (partial.props) {
      Object.assign(node.props, partial.props)
    }
    if (partial.style) {
      if (!node.style)
        node.style = {}
      Object.assign(node.style, partial.style)
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
    patchNode,
    triggerUpdate,
  }
}
