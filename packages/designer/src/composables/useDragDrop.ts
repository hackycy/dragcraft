import type { CommandExecutionResult, CreationBlockReason, DesignerEngine, NodeDestination, PlacementDecision, SchemaNode } from '@dragcraft/core'
import type { ContainerDropRejection, ContainerDropTarget, RendererWidgetMeta } from '@dragcraft/renderer'
import type { ComputedRef, Ref } from 'vue'
import {
  buildSchemaIndex,
  clampInsertIndex,
  CommandType,
  createLayoutPlan,
  DEFAULT_LAYOUT_REGION,
  DEFAULT_SORT_SCOPE,
  findNearestValidIndex,
  getLockedIndices,
  getSortScopeEntries,
  getValidDropIndices,
  resolveCreatable,
  resolveDestination,
  resolveNodeLayout,
  resolvePlacementDecision,
} from '@dragcraft/core'
import { generateShortId, hideNativeDragImage } from '@dragcraft/utils'
import { computed, ref, watch } from 'vue'

// ──────────────────────────────────────────
// Return type
// ──────────────────────────────────────────

export interface UseDragDropReturn {
  /** Unified root/container destination selected during drag-over. */
  dragOverDestination: Ref<NodeDestination | null>
  /** Alias used by renderer container outlets. */
  activeDestination: Ref<NodeDestination | null>
  /** Advisory placement decision for the active container destination. */
  containerDropDecision: Ref<PlacementDecision | null>
  /** Compatibility projection for renderer extensions. */
  dragOverNodeId: Ref<string | null>
  /** Compatibility projection for renderer extensions. */
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
  handleCanvasDrop: (e: DragEvent) => CommandExecutionResult
  /** Handle a material-resolved container destination or adapter rejection. */
  handleContainerDragOver: (payload: ContainerDropTarget | ContainerDropRejection) => void
  /** Clear container feedback after leaving the active region. */
  handleContainerDragLeave: (e: DragEvent) => void
  /** Commit the active container destination. */
  handleContainerDrop: (e: DragEvent) => CommandExecutionResult
  /** Commit the current drag target to the current destination. */
  commitDrop: () => CommandExecutionResult
  /** Handle drag end (cleanup) */
  handleDragEnd: (e: DragEvent) => void
  /** Whether the current drag-over is forbidden */
  isForbidden: Ref<boolean>
  /** User-facing reason for the current forbidden drag-over state */
  forbiddenReason: Ref<DropRejectionReason | null>
}

export type DropRejectionReason = CreationBlockReason & { details?: Record<string, unknown> }

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
  const dragOverDestination = ref<NodeDestination | null>(null)
  const activeDestination = dragOverDestination
  const containerDropDecision = ref<PlacementDecision | null>(null)
  const dragOverNodeId = computed({
    get: () => {
      const destination = dragOverDestination.value
      return destination?.kind === 'container'
        ? destination.containerId
        : destination ? 'root' : null
    },
    set: (nodeId: string | null) => {
      if (nodeId === null)
        dragOverDestination.value = null
      else if (nodeId === 'root' && dragOverDestination.value?.kind !== 'root')
        dragOverDestination.value = { kind: 'root' }
    },
  })
  const dragOverIndex = computed({
    get: () => dragOverDestination.value?.index ?? null,
    set: (index: number | null) => {
      const current = dragOverDestination.value
      if (current) {
        dragOverDestination.value = index === null
          ? { ...current, index: undefined }
          : { ...current, index }
        return
      }
      const sortScope = getActiveSortScope()
      dragOverDestination.value = {
        kind: 'root',
        sortScope: sortScope === false ? undefined : sortScope,
        index: index ?? undefined,
      }
    },
  })
  const isForbidden = ref(false)
  const forbiddenReason = ref<DropRejectionReason | null>(null)

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
    dragOverDestination.value = null
    containerDropDecision.value = null
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

  function setForbidden(reason: Extract<CommandExecutionResult, { ok: false }>): void {
    isForbidden.value = true
    const rejection: DropRejectionReason = {
      code: reason.code,
      messageKey: reason.messageKey,
      message: reason.message,
      details: reason.details,
    }
    forbiddenReason.value = rejection
    if (dragOverDestination.value?.kind === 'container')
      containerDropDecision.value = { allowed: false, ...rejection }
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
    const target = e.target
    if (target instanceof Element && target.closest('[data-dc-container-region]'))
      return
    e.preventDefault()
    const dragTarget = engine.store.dragTarget.value
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = dragTarget?.sourceNodeId ? 'move' : 'copy'
    }

    const sortScope = getActiveSortScope()
    dragOverDestination.value = {
      kind: 'root',
      sortScope: sortScope === false ? undefined : sortScope,
    }
    containerDropDecision.value = null

    const decision = createDecision.value
    if (!decision.allowed) {
      setForbidden({
        ok: false,
        code: decision.code ?? 'NODE_NOT_CREATABLE',
        messageKey: decision.messageKey,
        message: decision.message,
      })
      if (e.dataTransfer)
        e.dataTransfer.dropEffect = 'none'
      return
    }
    isForbidden.value = false
    forbiddenReason.value = null

    if (sortScope === false)
      return

    const rawIndex = computeDropIndex(e, sortScope)
    const index = resolveVisualDropIndex(rawIndex)
    dragOverDestination.value = {
      kind: 'root',
      sortScope,
      index: index ?? undefined,
    }
  }

  function handleCanvasDragLeave(e: DragEvent): void {
    // Only clear if leaving the canvas entirely
    const relatedTarget = e.relatedTarget as HTMLElement | null
    const canvasEl = e.currentTarget as HTMLElement
    if (!relatedTarget || !canvasEl.contains(relatedTarget)) {
      clearDragOverState()
    }
  }

  function commitDrop(): CommandExecutionResult {
    const destination = dragOverDestination.value
    const dragTarget = engine.store.dragTarget.value
    if (!destination || !dragTarget)
      return { ok: false, code: 'DROP_TARGET_MISSING' }

    let result: CommandExecutionResult
    let selectedNodeId: string | null = null
    if (dragTarget.sourceNodeId) {
      result = engine.execute({
        type: CommandType.MOVE_NODE,
        payload: { nodeId: dragTarget.sourceNodeId, destination },
      })
    }
    else {
      const meta = dragTarget.widgetType
        ? engine.registry.getWidget(dragTarget.widgetType) as RendererWidgetMeta | undefined
        : undefined
      if (!meta) {
        result = { ok: false, code: 'DRAGGED_WIDGET_META_MISSING' }
      }
      else if (destination.kind === 'root'
        && resolveMetaSortScope(meta) !== false
        && destination.index === undefined) {
        result = { ok: false, code: 'DROP_TARGET_MISSING' }
      }
      else {
        const node = createSchemaNode(meta)
        result = engine.execute({
          type: CommandType.ADD_NODE,
          payload: { node, destination },
        })
        selectedNodeId = node.id
      }
    }

    if (!result.ok) {
      setForbidden(result)
    }
    else {
      if (selectedNodeId)
        engine.store.selectNode(selectedNodeId)
      resetDragState()
    }
    return result
  }

  function handleCanvasDrop(e: DragEvent): CommandExecutionResult {
    e.preventDefault()
    if (!createDecision.value.allowed) {
      const decision = createDecision.value
      const result: Extract<CommandExecutionResult, { ok: false }> = {
        ok: false,
        code: decision.code ?? 'NODE_NOT_CREATABLE',
        messageKey: decision.messageKey,
        message: decision.message,
      }
      resetDragState()
      return result
    }
    return commitDrop()
  }

  function preflightContainerDestination(
    destination: Extract<NodeDestination, { kind: 'container' }>,
  ): PlacementDecision {
    const schema = engine.state.getSchema()
    const dragTarget = engine.store.dragTarget.value
    if (!dragTarget)
      return { allowed: false, code: 'DROP_SOURCE_MISSING' }
    const child = dragTarget.sourceNodeId
      ? engine.state.getNodeById(dragTarget.sourceNodeId)
      : (() => {
          const meta = dragTarget.widgetType
            ? engine.registry.getWidget(dragTarget.widgetType) as RendererWidgetMeta | undefined
            : undefined
          return meta ? createSchemaNode(meta) : null
        })()
    if (!child)
      return { allowed: false, code: 'DROP_SOURCE_MISSING' }
    const targetResult = resolveDestination(schema, engine.registry, destination)
    if (!targetResult.ok)
      return { allowed: false, code: targetResult.code, message: targetResult.message }
    const target = targetResult.value
    if (!target.container || !target.definition || !target.variant || !target.region)
      return { allowed: false, code: 'CONTAINER_DESTINATION_REQUIRED' }
    const source = dragTarget.sourceNodeId
      ? buildSchemaIndex(schema).index.get(dragTarget.sourceNodeId)
      : undefined
    const sameRegion = source?.owner === destination.containerId
      && source.regionId === destination.regionId
    return resolvePlacementDecision({
      definition: target.definition,
      region: target.region,
      child,
      childHasContainerCapability: Boolean(engine.registry.getWidget(child.type)?.container),
      targetCount: target.children.length - (sameRegion ? 1 : 0),
      callbackContext: {
        operation: dragTarget.sourceNodeId ? 'move' : 'add',
        schema,
        container: target.container,
        variant: target.variant,
        region: target.region,
        child,
        targetIndex: clampInsertIndex(destination.index, target.children.length),
      },
    })
  }

  function handleContainerDragOver(payload: ContainerDropTarget | ContainerDropRejection): void {
    if ('allowed' in payload) {
      dragOverDestination.value = null
      containerDropDecision.value = {
        allowed: false,
        code: payload.code,
        message: payload.message,
      }
      setForbidden({ ok: false, code: payload.code, message: payload.message })
      return
    }

    dragOverDestination.value = payload.destination
    const decision = preflightContainerDestination(payload.destination)
    containerDropDecision.value = decision
    if (!decision.allowed) {
      setForbidden({
        ok: false,
        code: decision.code ?? 'CONTAINER_PLACEMENT_REJECTED',
        messageKey: decision.messageKey,
        message: decision.message,
        details: decision.details,
      })
      if (payload.event.dataTransfer)
        payload.event.dataTransfer.dropEffect = 'none'
    }
    else {
      isForbidden.value = false
      forbiddenReason.value = null
    }
  }

  function handleContainerDragLeave(e: DragEvent): void {
    const current = e.currentTarget as HTMLElement | null
    if (current && e.relatedTarget instanceof Node && current.contains(e.relatedTarget))
      return
    clearDragOverState()
  }

  function handleContainerDrop(e: DragEvent): CommandExecutionResult {
    e.preventDefault()
    e.stopPropagation()
    const destination = dragOverDestination.value
    const currentTarget = e.currentTarget
    const matchesCurrentRegion = destination?.kind === 'container'
      && currentTarget instanceof Element
      && currentTarget.getAttribute('data-dc-container-id') === destination.containerId
      && currentTarget.getAttribute('data-dc-container-region') === destination.regionId
    if (!matchesCurrentRegion) {
      dragOverDestination.value = null
      const result: Extract<CommandExecutionResult, { ok: false }> = {
        ok: false,
        code: 'DROP_TARGET_MISSING',
      }
      if (!isForbidden.value) {
        containerDropDecision.value = null
        setForbidden(result)
      }
      return result
    }
    return commitDrop()
  }

  function handleDragEnd(_e: DragEvent): void {
    resetDragState()
  }

  return {
    dragOverDestination,
    activeDestination,
    containerDropDecision,
    dragOverNodeId,
    dragOverIndex,
    lockedIndices,
    validDropIndices,
    handleMaterialDragStart,
    handleCanvasDragOver,
    handleCanvasDragLeave,
    handleCanvasDrop,
    handleContainerDragOver,
    handleContainerDragLeave,
    handleContainerDrop,
    commitDrop,
    handleDragEnd,
    isForbidden,
    forbiddenReason,
  }
}
