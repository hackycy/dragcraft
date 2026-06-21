import type { DesignerEngine, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { ComputedRef, Ref } from 'vue'
import { CommandType, findNearestValidIndex, getLockedIndices, getValidDropIndices, resolveBehavior } from '@dragcraft/core'
import { generateShortId } from '@dragcraft/utils'
import { computed, ref } from 'vue'

// ──────────────────────────────────────────
// Return type
// ──────────────────────────────────────────

export interface UseDragDropReturn {
  /** Reactive ref tracking drag-over state (always 'root' or null in flat model) */
  dragOverNodeId: Ref<string | null>
  /** Visual insertion index computed during dragover (0..n for n widgets) */
  dragOverIndex: Ref<number | null>
  /** Cached locked indices (recomputed only when schema changes) */
  lockedIndices: ComputedRef<ReadonlySet<number>>
  /** Valid drop indices for the current drag operation */
  validDropIndices: ComputedRef<ReadonlySet<number> | null>
  /** Start dragging a new widget from the material panel */
  handleMaterialDragStart: (e: DragEvent, meta: WidgetMeta) => void
  /** Start dragging an existing node within the canvas */
  handleNodeDragStart: (e: DragEvent, nodeId: string) => void
  /** Handle dragover on the canvas (event delegation) */
  handleCanvasDragOver: (e: DragEvent) => void
  /** Handle dragleave on the canvas (event delegation) */
  handleCanvasDragLeave: (e: DragEvent) => void
  /** Handle drop on the canvas (event delegation) */
  handleCanvasDrop: (e: DragEvent) => void
  /** Handle drag end (cleanup) */
  handleDragEnd: (e: DragEvent) => void
}

// ──────────────────────────────────────────
// Composable
// ──────────────────────────────────────────

/**
 * Coordinates HTML5 Drag and Drop between the material panel (drag source)
 * and the canvas (drop target), bridging to core commands.
 *
 * Manages all drag-drop state including visual drop index computation
 * and sortable constraint validation.
 */
export function useDragDrop(engine: DesignerEngine): UseDragDropReturn {
  const dragOverNodeId = ref<string | null>(null)
  const dragOverIndex = ref<number | null>(null)

  // ── Sortable constraint computeds ──

  const lockedIndices = computed(() => {
    void engine.store.schema.value
    const children = engine.store.getRawSchema().root.children ?? []
    return getLockedIndices(children, engine.registry, engine.store.getRawSchema())
  })

  const validDropIndices = computed(() => {
    const dragTarget = engine.store.dragTarget.value
    if (!dragTarget)
      return null
    void engine.store.schema.value
    const children = engine.store.getRawSchema().root.children ?? []
    return getValidDropIndices(children, lockedIndices.value, dragTarget.sourceNodeId)
  })

  // ── Visual drop index computation ──

  function computeDropIndex(e: DragEvent): number {
    const canvasEl = e.currentTarget as HTMLElement
    const widgetEls = canvasEl.querySelectorAll<HTMLElement>(
      '[data-node-id]:not([data-node-id="root"])',
    )
    const mouseY = e.clientY
    for (let i = 0; i < widgetEls.length; i++) {
      const rect = widgetEls[i].getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      if (mouseY < midY) {
        return i
      }
    }
    return widgetEls.length
  }

  // ── Drag start handlers ──

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

  // ── Canvas drag event handlers (event delegation) ──

  function handleCanvasDragOver(e: DragEvent): void {
    e.preventDefault()
    // Flat model: always drop into root
    dragOverNodeId.value = 'root'
    if (e.dataTransfer) {
      const dragTarget = engine.store.dragTarget.value
      e.dataTransfer.dropEffect = dragTarget?.sourceNodeId ? 'move' : 'copy'
    }

    const rawIndex = computeDropIndex(e)
    const valid = validDropIndices.value

    if (valid && valid.size > 0) {
      dragOverIndex.value = valid.has(rawIndex)
        ? rawIndex
        : findNearestValidIndex(rawIndex, valid)
    }
    else if (valid && valid.size === 0) {
      dragOverIndex.value = null
    }
    else {
      dragOverIndex.value = rawIndex
    }
  }

  function handleCanvasDragLeave(e: DragEvent): void {
    // Only clear if leaving the canvas entirely
    const relatedTarget = e.relatedTarget as HTMLElement | null
    const canvasEl = e.currentTarget as HTMLElement
    if (!relatedTarget || !canvasEl.contains(relatedTarget)) {
      dragOverNodeId.value = null
      dragOverIndex.value = null
    }
  }

  function handleCanvasDrop(e: DragEvent): void {
    e.preventDefault()
    dragOverNodeId.value = null
    const visualIndex = dragOverIndex.value
    dragOverIndex.value = null

    const dragTarget = engine.store.dragTarget.value
    if (!dragTarget)
      return

    // No valid drop position (sortable constraints block all positions)
    if (visualIndex === null) {
      engine.store.setDragTarget(null)
      return
    }

    if (dragTarget.sourceNodeId) {
      // Moving existing node to the computed position
      const children = engine.store.getRawSchema().root.children ?? []
      const srcIdx = children.findIndex(c => c.id === dragTarget.sourceNodeId)

      // Convert visual gap index to MOVE_NODE target index.
      // After the source is removed, items after it shift left by 1.
      let targetIdx = visualIndex
      if (srcIdx !== -1 && targetIdx > srcIdx) {
        targetIdx = targetIdx - 1
      }

      engine.execute({
        type: CommandType.MOVE_NODE,
        payload: {
          nodeId: dragTarget.sourceNodeId,
          index: targetIdx,
        },
      })
    }
    else if (dragTarget.widgetType) {
      // Adding new widget from material panel
      const meta = engine.registry.getWidget(dragTarget.widgetType)
      if (!meta)
        return

      if (!resolveBehavior(meta.creatable, { widgetType: meta.type, schema: engine.store.getRawSchema() }))
        return

      const newNode: SchemaNode = {
        id: generateShortId(),
        type: meta.type,
        props: { ...meta.defaultProps },
        style: meta.defaultStyle ? { ...meta.defaultStyle } : undefined,
      }

      engine.execute({
        type: CommandType.ADD_NODE,
        payload: {
          node: newNode,
          index: visualIndex,
        },
      })

      engine.store.selectNode(newNode.id)
    }

    engine.store.setDragTarget(null)
  }

  function handleDragEnd(_e: DragEvent): void {
    dragOverNodeId.value = null
    dragOverIndex.value = null
    engine.store.setDragTarget(null)
  }

  return {
    dragOverNodeId,
    dragOverIndex,
    lockedIndices,
    validDropIndices,
    handleMaterialDragStart,
    handleNodeDragStart,
    handleCanvasDragOver,
    handleCanvasDragLeave,
    handleCanvasDrop,
    handleDragEnd,
  }
}
