import type { DesignerEngine, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { Ref } from 'vue'
import { CommandType } from '@dragcraft/core'
import { generateShortId } from '@dragcraft/utils'
import { ref } from 'vue'

// ──────────────────────────────────────────
// Return type
// ──────────────────────────────────────────

export interface UseDragDropReturn {
  /** Reactive ref tracking which container node is being dragged over */
  dragOverNodeId: Ref<string | null>
  /** Start dragging a new widget from the material panel */
  handleMaterialDragStart: (e: DragEvent, meta: WidgetMeta) => void
  /** Start dragging an existing node within the canvas */
  handleNodeDragStart: (e: DragEvent, nodeId: string) => void
  /** Handle dragover on a container in the canvas */
  handleCanvasDragOver: (e: DragEvent, containerNodeId: string) => void
  /** Handle dragleave on a container */
  handleCanvasDragLeave: (e: DragEvent, containerNodeId: string) => void
  /** Handle drop on a container in the canvas */
  handleCanvasDrop: (e: DragEvent, containerNodeId: string, index?: number) => void
  /** Handle drag end (cleanup) */
  handleDragEnd: (e: DragEvent) => void
}

// ──────────────────────────────────────────
// Composable
// ──────────────────────────────────────────

/**
 * Coordinates HTML5 Drag and Drop between the material panel (drag source)
 * and the canvas (drop target), bridging to core commands.
 */
export function useDragDrop(engine: DesignerEngine): UseDragDropReturn {
  const dragOverNodeId = ref<string | null>(null)

  function handleMaterialDragStart(e: DragEvent, meta: WidgetMeta): void {
    engine.store.setDragTarget({
      sourceNodeId: null,
      widgetType: meta.type,
    })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('text/plain', meta.type)
    }
  }

  function handleNodeDragStart(e: DragEvent, nodeId: string): void {
    engine.store.setDragTarget({
      sourceNodeId: nodeId,
      widgetType: null,
    })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', nodeId)
    }
  }

  function handleCanvasDragOver(e: DragEvent, containerNodeId: string): void {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = engine.store.dragTarget.value?.sourceNodeId ? 'move' : 'copy'
    }
    dragOverNodeId.value = containerNodeId
  }

  function handleCanvasDragLeave(_e: DragEvent, containerNodeId: string): void {
    if (dragOverNodeId.value === containerNodeId) {
      dragOverNodeId.value = null
    }
  }

  function handleCanvasDrop(e: DragEvent, containerNodeId: string, index?: number): void {
    e.preventDefault()
    dragOverNodeId.value = null

    const dragTarget = engine.store.dragTarget.value
    if (!dragTarget)
      return

    if (dragTarget.sourceNodeId) {
      // Moving existing node
      engine.execute({
        type: CommandType.MOVE_NODE,
        payload: {
          nodeId: dragTarget.sourceNodeId,
          targetParentId: containerNodeId,
          index,
        },
      })
    }
    else if (dragTarget.widgetType) {
      // Adding new widget from material panel
      const meta = engine.registry.getWidget(dragTarget.widgetType)
      if (!meta)
        return

      const newNode: SchemaNode = {
        id: generateShortId(),
        type: meta.type,
        nodeType: meta.canHaveChildren ? 'container' : 'widget',
        props: { ...meta.defaultProps },
        style: meta.defaultStyle ? { ...meta.defaultStyle } : undefined,
        children: meta.canHaveChildren ? [] : undefined,
      }

      engine.execute({
        type: CommandType.ADD_NODE,
        payload: {
          parentId: containerNodeId,
          node: newNode,
          index,
        },
      })
    }

    // Clear drag state
    engine.store.setDragTarget(null)
  }

  function handleDragEnd(_e: DragEvent): void {
    dragOverNodeId.value = null
    engine.store.setDragTarget(null)
  }

  return {
    dragOverNodeId,
    handleMaterialDragStart,
    handleNodeDragStart,
    handleCanvasDragOver,
    handleCanvasDragLeave,
    handleCanvasDrop,
    handleDragEnd,
  }
}
