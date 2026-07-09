import type { CreationBlockReason, DesignerEngine, SchemaNode } from '@dragcraft/core'
import type { RendererWidgetMeta } from '@dragcraft/renderer'
import type { ComputedRef, Ref } from 'vue'
import {
  CommandType,
  createLayoutPlan,
  DEFAULT_LAYOUT_REGION,
  DEFAULT_SORT_SCOPE,
  findNearestValidIndex,
  getLockedIndices,
  getSortScopeEntries,
  getValidDropIndices,
  resolveCreatable,
  resolveNodeLayout,
} from '@dragcraft/core'
import { generateShortId, hideNativeDragImage } from '@dragcraft/utils'
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
  handleMaterialDragStart: (e: DragEvent, meta: RendererWidgetMeta) => void
  /** Handle dragover on the canvas (event delegation) */
  handleCanvasDragOver: (e: DragEvent) => void
  /** Handle dragleave on the canvas (event delegation) */
  handleCanvasDragLeave: (e: DragEvent) => void
  /** Handle drop on the canvas (event delegation) */
  handleCanvasDrop: (e: DragEvent) => void
  /** Handle drag end (cleanup) */
  handleDragEnd: (e: DragEvent) => void
  /** Whether the current drag-over is forbidden */
  isForbidden: Ref<boolean>
  /** User-facing reason for the current forbidden drag-over state */
  forbiddenReason: Ref<CreationBlockReason | null>
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
  const forbiddenReason = ref<CreationBlockReason | null>(null)

  // ── Sortable constraint computeds ──

  const lockedIndices = computed(() => {
    void engine.store.schema.value
    const schema = engine.state.getSchema()
    const children = schema.root.children ?? []
    const sortScope = getActiveSortScope()
    if (sortScope === false)
      return new Set<number>()
    return getLockedIndices(children, engine.registry, schema, sortScope)
  })

  const validDropIndices = computed(() => {
    const dragTarget = engine.store.dragTarget.value
    if (!dragTarget)
      return null
    void engine.store.schema.value
    const sortScope = getActiveSortScope()
    if (sortScope === false)
      return null
    const scopeEntries = getActiveSortScopeEntries(sortScope)
    return getValidDropIndices(scopeEntries, lockedIndices.value, dragTarget.sourceNodeId)
  })

  const createDecision = computed(() => {
    const target = engine.store.dragTarget.value
    if (!target?.widgetType)
      return { allowed: true }
    const meta = engine.registry.getWidget(target.widgetType)
    if (!meta)
      return { allowed: true }
    return resolveCreatable(meta.creatable, {
      widgetType: target.widgetType,
      schema: engine.store.schema.value,
    }, true)
  })

  // ── Visual drop index computation ──

  function resolveMetaSortScope(meta: RendererWidgetMeta): string | false {
    const placement = meta.defaultLayout?.placement
    if (!placement || placement.kind === 'flow') {
      const region = placement?.region ?? DEFAULT_LAYOUT_REGION
      return placement?.sortScope === undefined
        ? (region === DEFAULT_LAYOUT_REGION ? DEFAULT_SORT_SCOPE : false)
        : placement.sortScope
    }
    return false
  }

  function getActiveSortScopeEntries(sortScope: string) {
    const schema = engine.state.getSchema()
    return getSortScopeEntries(
      createLayoutPlan(schema, engine.registry),
      sortScope,
    )
  }

  function getActiveSortScope(): string | false {
    const target = engine.store.dragTarget.value
    if (!target)
      return DEFAULT_SORT_SCOPE
    if (target.sourceNodeId) {
      const node = engine.state.getNodeById(target.sourceNodeId)
      if (!node)
        return false
      return resolveNodeLayout(node, engine.registry, engine.state.getSchema()).sortScope
    }
    if (target.widgetType) {
      const meta = engine.registry.getWidget(target.widgetType)
      return meta ? resolveMetaSortScope(meta) : DEFAULT_SORT_SCOPE
    }
    return DEFAULT_SORT_SCOPE
  }

  function clearDragOverState(): void {
    dragOverNodeId.value = null
    dragOverIndex.value = null
    isForbidden.value = false
    forbiddenReason.value = null
  }

  function resetDragState(): void {
    clearDragOverState()
    engine.store.setDragTarget(null)
  }

  watch(engine.store.dragTarget, (target) => {
    if (!target)
      clearDragOverState()
  })

  function resolveVisualDropIndex(rawIndex: number): number | null {
    const valid = validDropIndices.value
    if (!valid)
      return rawIndex
    if (valid.size === 0)
      return null
    return valid.has(rawIndex)
      ? rawIndex
      : findNearestValidIndex(rawIndex, valid)
  }

  function canCreateWidget(meta: RendererWidgetMeta): boolean {
    return resolveCreatable(meta.creatable, {
      widgetType: meta.type,
      schema: engine.state.getSchema(),
    }).allowed
  }

  function createSchemaNode(meta: RendererWidgetMeta): SchemaNode {
    return {
      id: generateShortId(),
      type: meta.type,
      props: { ...meta.defaultProps },
      style: meta.defaultStyle ? { ...meta.defaultStyle } : undefined,
      layout: meta.defaultLayout ? { ...meta.defaultLayout } : undefined,
    }
  }

  function computeDropIndex(e: DragEvent, sortScope: string): number {
    const canvasEl = e.currentTarget as HTMLElement
    const widgetEls = canvasEl.querySelectorAll<HTMLElement>(
      `[data-dc-sort-scope="${sortScope}"]`,
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

  function handleMaterialDragStart(e: DragEvent, meta: RendererWidgetMeta): void {
    engine.store.setDragTarget({
      sourceNodeId: null,
      widgetType: meta.type,
    })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('text/plain', meta.type)
      hideNativeDragImage(e.dataTransfer)
    }
  }

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
    const decision = createDecision.value
    if (!decision.allowed) {
      isForbidden.value = true
      forbiddenReason.value = {
        code: decision.code,
        messageKey: decision.messageKey,
        message: decision.message,
      }
      dragOverIndex.value = null
      if (e.dataTransfer)
        e.dataTransfer.dropEffect = 'none'
      return
    }
    isForbidden.value = false
    forbiddenReason.value = null

    const sortScope = getActiveSortScope()
    if (sortScope === false) {
      dragOverIndex.value = null
      return
    }

    const rawIndex = computeDropIndex(e, sortScope)
    dragOverIndex.value = resolveVisualDropIndex(rawIndex)
  }

  function handleCanvasDragLeave(e: DragEvent): void {
    // Only clear if leaving the canvas entirely
    const relatedTarget = e.relatedTarget as HTMLElement | null
    const canvasEl = e.currentTarget as HTMLElement
    if (!relatedTarget || !canvasEl.contains(relatedTarget)) {
      clearDragOverState()
    }
  }

  function dropExistingNode(nodeId: string, visualIndex: number | null): void {
    if (visualIndex === null)
      return

    const sortScope = getActiveSortScope()
    if (sortScope === false)
      return

    const scopeEntries = getActiveSortScopeEntries(sortScope)
    const srcIdx = scopeEntries.findIndex(entry => entry.node.id === nodeId)

    let targetIdx = visualIndex
    if (srcIdx !== -1 && targetIdx > srcIdx) {
      targetIdx = targetIdx - 1
    }

    engine.execute({
      type: CommandType.MOVE_NODE,
      payload: {
        nodeId,
        index: targetIdx,
        sortScope,
      },
    })
  }

  function dropNewWidget(widgetType: string, visualIndex: number | null): void {
    const meta = engine.registry.getWidget(widgetType)
    if (!meta || !canCreateWidget(meta))
      return

    const sortScope = resolveMetaSortScope(meta)
    if (sortScope !== false && visualIndex === null)
      return

    const newNode = createSchemaNode(meta)
    engine.execute({
      type: CommandType.ADD_NODE,
      payload: {
        node: newNode,
        index: sortScope === false ? undefined : visualIndex,
        sortScope: sortScope === false ? undefined : sortScope,
      },
    })

    engine.store.selectNode(newNode.id)
  }

  function handleCanvasDrop(e: DragEvent): void {
    e.preventDefault()
    const visualIndex = dragOverIndex.value
    clearDragOverState()

    const dragTarget = engine.store.dragTarget.value
    if (!dragTarget)
      return

    // Forbidden drop (creatable predicate returned false)
    if (!createDecision.value.allowed) {
      engine.store.setDragTarget(null)
      return
    }

    if (dragTarget.sourceNodeId) {
      dropExistingNode(dragTarget.sourceNodeId, visualIndex)
    }
    else if (dragTarget.widgetType) {
      dropNewWidget(dragTarget.widgetType, visualIndex)
    }

    engine.store.setDragTarget(null)
  }

  function handleDragEnd(_e: DragEvent): void {
    resetDragState()
  }

  return {
    dragOverNodeId,
    dragOverIndex,
    lockedIndices,
    validDropIndices,
    handleMaterialDragStart,
    handleCanvasDragOver,
    handleCanvasDragLeave,
    handleCanvasDrop,
    handleDragEnd,
    isForbidden,
    forbiddenReason,
  }
}
