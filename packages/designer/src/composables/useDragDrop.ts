import type { DesignerEngine, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { ComputedRef, Ref } from 'vue'
import { CommandType, findNearestValidIndex, getLockedIndices, getValidDropIndices, resolveBehavior } from '@dragcraft/core'
import { generateShortId } from '@dragcraft/utils'
import { computed, ref, watch } from 'vue'

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
  /** Create a floating preview element at the mouse position */
  createDragPreview: (meta: WidgetMeta, isMove: boolean) => void
  /** Update the floating preview position to follow the mouse */
  updateDragPreviewPosition: (e: DragEvent) => void
  /** Whether the current drag-over is forbidden (widget type already exists) */
  isForbidden: Ref<boolean>
  /** Remove the floating preview element */
  destroyDragPreview: () => void
}

/**
 * Convert a flow-relative visual index (from computeDropIndex) to an absolute
 * array index in root.children. Non-flow nodes in the array are skipped when
 * counting flow positions.
 */
export function flowIndexToArrayIndex(
  flowVisualIndex: number,
  rootChildren: SchemaNode[],
  registry: { getWidget: (type: string) => WidgetMeta | undefined },
): number {
  let flowCount = 0
  let lastFlowEnd = 0
  for (let i = 0; i < rootChildren.length; i++) {
    const meta = registry.getWidget(rootChildren[i].type)
    const isFlow = !meta || meta.flow !== false
    if (isFlow) {
      if (flowCount === flowVisualIndex)
        return i
      flowCount++
      lastFlowEnd = i + 1
    }
  }
  return lastFlowEnd
}

/**
 * Convert an absolute array index in root.children to a flow-relative visual
 * index. This is the inverse of `flowIndexToArrayIndex` — non-flow nodes in
 * the array are skipped when counting flow positions.
 */
export function arrayIndexToFlowIndex(
  arrayIndex: number,
  rootChildren: SchemaNode[],
  registry: { getWidget: (type: string) => WidgetMeta | undefined },
): number {
  let flowCount = 0
  for (let i = 0; i < arrayIndex && i < rootChildren.length; i++) {
    const meta = registry.getWidget(rootChildren[i].type)
    if (!meta || meta.flow !== false)
      flowCount++
  }
  return flowCount
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
  const isForbidden = ref(false)

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

  const isDropAllowed = computed(() => {
    const target = engine.store.dragTarget.value
    if (!target?.widgetType)
      return true // node move, not material drop
    const meta = engine.registry.getWidget(target.widgetType)
    if (!meta)
      return true
    return resolveBehavior(meta.creatable, {
      widgetType: target.widgetType,
      schema: engine.store.schema.value,
    }, true)
  })

  // ── Visual drop index computation ──

  function computeDropIndex(e: DragEvent): number {
    const canvasEl = e.currentTarget as HTMLElement
    const flowEl = canvasEl.querySelector('.dc-canvas__flow') ?? canvasEl
    const widgetEls = flowEl.querySelectorAll<HTMLElement>(
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
    createDragPreview(meta, false)
  }

  function handleNodeDragStart(e: DragEvent, nodeId: string): void {
    // Non-flow nodes are not draggable
    const allChildren = engine.store.getRawSchema().root.children ?? []
    const targetNode = allChildren.find(c => c.id === nodeId)
    if (targetNode) {
      const meta = engine.registry.getWidget(targetNode.type)
      if (meta && meta.flow === false)
        return
    }

    engine.store.setDragTarget({
      sourceNodeId: nodeId,
      widgetType: null,
    })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', nodeId)
    }
    // Create preview for the moved node
    const children = engine.store.getRawSchema().root.children ?? []
    const node = children.find(c => c.id === nodeId)
    if (node) {
      const meta = engine.registry.getWidget(node.type)
      if (meta) {
        createDragPreview(meta, true)
      }
    }
  }

  // ── Drag preview management ──

  let dragPreviewEl: HTMLElement | null = null

  function createDragPreview(meta: WidgetMeta, isMove: boolean): void {
    destroyDragPreview()
    const el = document.createElement('div')
    el.className = `dc-drag-preview${isMove ? ' dc-drag-preview--move' : ''}`
    if (meta.icon) {
      const iconSpan = document.createElement('span')
      iconSpan.className = 'dc-drag-preview__icon'
      if (typeof meta.icon === 'string') {
        iconSpan.textContent = meta.icon
      }
      el.appendChild(iconSpan)
    }
    const nameSpan = document.createElement('span')
    nameSpan.className = 'dc-drag-preview__name'
    nameSpan.textContent = meta.title
    el.appendChild(nameSpan)
    document.body.appendChild(el)
    dragPreviewEl = el
  }

  function updateDragPreviewPosition(e: DragEvent): void {
    if (dragPreviewEl) {
      dragPreviewEl.style.left = `${e.clientX + 12}px`
      dragPreviewEl.style.top = `${e.clientY + 12}px`
    }
  }

  function destroyDragPreview(): void {
    if (dragPreviewEl) {
      dragPreviewEl.remove()
      dragPreviewEl = null
    }
  }

  watch(isForbidden, (forbidden) => {
    if (dragPreviewEl) {
      dragPreviewEl.classList.toggle('dc-drag-preview--forbidden', forbidden)
    }
  })

  // ── Canvas drag event handlers (event delegation) ──

  function handleCanvasDragOver(e: DragEvent): void {
    e.preventDefault()
    // Flat model: always drop into root
    dragOverNodeId.value = 'root'
    const dragTarget = engine.store.dragTarget.value
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = dragTarget?.sourceNodeId ? 'move' : 'copy'
    }

    // Check if drop is allowed by creatable predicate
    if (!isDropAllowed.value) {
      isForbidden.value = true
      dragOverIndex.value = null
      updateDragPreviewPosition(e)
      return
    }
    isForbidden.value = false

    const rawIndex = computeDropIndex(e)
    const valid = validDropIndices.value

    if (valid && valid.size > 0) {
      // Convert flow-relative rawIndex to array space for comparison with validDropIndices
      const children = engine.store.getRawSchema().root.children ?? []
      const rawArrayIndex = flowIndexToArrayIndex(rawIndex, children, engine.registry)
      const validArrayIndex = valid.has(rawArrayIndex)
        ? rawArrayIndex
        : findNearestValidIndex(rawArrayIndex, valid)
      // Convert back to flow space for dragOverIndex (used by RootRenderer for drop indicator)
      dragOverIndex.value = validArrayIndex != null
        ? arrayIndexToFlowIndex(validArrayIndex, children, engine.registry)
        : null
    }
    else if (valid && valid.size === 0) {
      dragOverIndex.value = null
    }
    else {
      dragOverIndex.value = rawIndex
    }

    // Create preview for node drags from the toolbar handle (which doesn't
    // call createDragPreview directly). Only creates once per drag operation.
    if (dragTarget?.sourceNodeId && !dragPreviewEl) {
      const children = engine.store.getRawSchema().root.children ?? []
      const node = children.find(c => c.id === dragTarget.sourceNodeId)
      if (node) {
        const meta = engine.registry.getWidget(node.type)
        if (meta) {
          createDragPreview(meta, true)
        }
      }
    }

    updateDragPreviewPosition(e)
  }

  function handleCanvasDragLeave(e: DragEvent): void {
    // Only clear if leaving the canvas entirely
    const relatedTarget = e.relatedTarget as HTMLElement | null
    const canvasEl = e.currentTarget as HTMLElement
    if (!relatedTarget || !canvasEl.contains(relatedTarget)) {
      dragOverNodeId.value = null
      dragOverIndex.value = null
      isForbidden.value = false
    }
  }

  function handleCanvasDrop(e: DragEvent): void {
    destroyDragPreview()
    e.preventDefault()
    dragOverNodeId.value = null
    const visualIndex = dragOverIndex.value
    dragOverIndex.value = null
    isForbidden.value = false

    const dragTarget = engine.store.dragTarget.value
    if (!dragTarget)
      return

    // Forbidden drop (creatable predicate returned false)
    if (!isDropAllowed.value) {
      engine.store.setDragTarget(null)
      return
    }

    // No valid drop position (sortable constraints block all positions)
    if (visualIndex === null) {
      engine.store.setDragTarget(null)
      return
    }

    if (dragTarget.sourceNodeId) {
      // Moving existing node to the computed position
      const children = engine.store.getRawSchema().root.children ?? []
      const srcIdx = children.findIndex(c => c.id === dragTarget.sourceNodeId)

      // Convert flow-relative visual index to absolute array index
      let targetIdx = flowIndexToArrayIndex(visualIndex, children, engine.registry)

      // After the source is removed, items after it shift left by 1
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

      const children = engine.store.getRawSchema().root.children ?? []
      const arrayIndex = flowIndexToArrayIndex(visualIndex, children, engine.registry)

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
          index: arrayIndex,
        },
      })

      engine.store.selectNode(newNode.id)
    }

    engine.store.setDragTarget(null)
  }

  function handleDragEnd(_e: DragEvent): void {
    destroyDragPreview()
    dragOverNodeId.value = null
    dragOverIndex.value = null
    isForbidden.value = false
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
    createDragPreview,
    updateDragPreviewPosition,
    isForbidden,
    destroyDragPreview,
  }
}
