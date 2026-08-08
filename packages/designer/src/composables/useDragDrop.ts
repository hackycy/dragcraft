import type { DesignerSchema, NodeDestination, PlacementDecision, SchemaNode } from '@dragcraft/core'
import type { ContainerDropRejection, ContainerDropTarget, RendererWidgetMeta } from '@dragcraft/renderer'
import type { ComputedRef, Ref } from 'vue'
import type { AuthoringResult, DesignerSession, DesignerSessionDropRejectionReason } from '../session/types'
import {
  clampInsertIndex,
  DEFAULT_LAYOUT_REGION,
  DEFAULT_SORT_SCOPE,
  findNearestValidIndex,
  getValidDropIndices,
  resolvePlacementDecision,
  resolveWidgetCreation,
} from '@dragcraft/core'
import { hideNativeDragImage } from '@dragcraft/renderer'
import { generateShortId } from '@dragcraft/utils'
import { computed, watch } from 'vue'

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
  handleCanvasDrop: (e: DragEvent) => AuthoringResult
  /** Handle a material-resolved container destination or adapter rejection. */
  handleContainerDragOver: (payload: ContainerDropTarget | ContainerDropRejection) => void
  /** Clear container feedback after leaving the active region. */
  handleContainerDragLeave: (e: DragEvent) => void
  /** Commit the active container destination. */
  handleContainerDrop: (e: DragEvent) => AuthoringResult
  /** Commit the current drag target to the current destination. */
  commitDrop: () => AuthoringResult
  /** Handle drag end (cleanup) */
  handleDragEnd: (e: DragEvent) => void
  /** Whether the current drag-over is forbidden */
  isForbidden: Ref<boolean>
  /** User-facing reason for the current forbidden drag-over state */
  forbiddenReason: Ref<DropRejectionReason | null>
}

export type DropRejectionReason = DesignerSessionDropRejectionReason

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
export function useDragDrop(
  session: DesignerSession,
): UseDragDropReturn {
  const dragOverDestination = session.state.drag.activeDestination
  const activeDestination = dragOverDestination
  const containerDropDecision = session.state.drag.containerDropDecision
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
  const isForbidden = session.state.drag.isForbidden
  const forbiddenReason = session.state.drag.forbiddenReason
  let dropGeometry: {
    canvas: HTMLElement
    sortScope: string
    midpoints: number[]
  } | null = null
  let dropGeometryFrame: number | null = null
  const schemaSnapshot = computed<DesignerSchema>(() => session.document.schema?.value as DesignerSchema ?? {
    version: session.document.version.value,
    globalConfig: session.document.globalConfig.value as Record<string, unknown>,
    root: session.document.root.value as DesignerSchema['root'],
  })

  function getActiveSortScopeNodes(sortScope: string): SchemaNode[] {
    return session.document.rootNodes.value
      .filter(node => session.materials.resolveLayout(node).sortScope === sortScope)
      .slice()
      .sort((a, b) => {
        const positionA = session.document.getStructurePosition(a.id)?.index ?? 0
        const positionB = session.document.getStructurePosition(b.id)?.index ?? 0
        return positionA - positionB
      }) as SchemaNode[]
  }

  // ── Sortable constraint computeds ──

  const lockedIndices = computed(() => {
    const sortScope = getActiveSortScope()
    if (sortScope === false)
      return new Set<number>()
    return session.materials.getLockedIndices(getActiveSortScopeNodes(sortScope))
  })

  const validDropIndices = computed(() => {
    const dragTarget = session.state.dragTarget.value
    if (!dragTarget)
      return null
    const sortScope = getActiveSortScope()
    if (sortScope === false)
      return null
    const scopeEntries = getActiveSortScopeEntries(sortScope)
    return getValidDropIndices(scopeEntries, lockedIndices.value, dragTarget.sourceNodeId)
  })

  const createDecision = computed(() => {
    const target = session.state.dragTarget.value
    if (!target?.widgetType)
      return { allowed: true }
    const meta = session.materials.get(target.widgetType)
    if (!meta)
      return { allowed: true }
    return resolveWidgetCreation(meta, {
      widgetType: target.widgetType,
      schema: schemaSnapshot.value,
    })
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
    return getActiveSortScopeNodes(sortScope)
  }

  function getActiveSortScope(): string | false {
    const target = session.state.dragTarget.value
    if (!target)
      return DEFAULT_SORT_SCOPE
    if (target.sourceNodeId) {
      const node = session.document.getNode(target.sourceNodeId)
      if (!node)
        return false
      return session.materials.resolveLayout(node).sortScope
    }
    if (target.widgetType) {
      const meta = session.materials.get(target.widgetType)
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

  function clearDropGeometry(cancelFrame = false): void {
    dropGeometry = null
    if (cancelFrame && dropGeometryFrame !== null) {
      window.cancelAnimationFrame(dropGeometryFrame)
      dropGeometryFrame = null
    }
  }

  function resetDragState(): void {
    clearDragOverState()
    clearDropGeometry(true)
    session.execute({ type: 'drag.set', target: null })
  }

  watch(session.state.dragTarget, (target) => {
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

  function setForbidden(reason: Extract<AuthoringResult, { ok: false }>): void {
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
    if (!dropGeometry || dropGeometry.canvas !== canvasEl || dropGeometry.sortScope !== sortScope) {
      const midpoints = Array.from(canvasEl.querySelectorAll<HTMLElement>('[data-dc-sort-scope]'))
        .filter(element => element.dataset.dcSortScope === sortScope)
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return rect.top + rect.height / 2
        })
      dropGeometry = { canvas: canvasEl, sortScope, midpoints }
      if (dropGeometryFrame === null) {
        dropGeometryFrame = window.requestAnimationFrame(() => {
          dropGeometryFrame = null
          dropGeometry = null
        })
      }
    }

    const mouseY = e.clientY
    const midpoints = dropGeometry.midpoints
    let low = 0
    let high = midpoints.length
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      if (mouseY < midpoints[middle])
        high = middle
      else
        low = middle + 1
    }
    return low
  }

  // ── Drag start handlers ──

  function handleMaterialDragStart(e: DragEvent, meta: RendererWidgetMeta): void {
    clearDropGeometry(true)
    session.execute({
      type: 'drag.set',
      target: {
        sourceNodeId: null,
        widgetType: meta.type,
      },
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
    const dragTarget = session.state.dragTarget.value
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

  function commitDrop(): AuthoringResult {
    const destination = dragOverDestination.value
    const dragTarget = session.state.dragTarget.value
    if (!destination || !dragTarget)
      return { ok: false, code: 'DROP_TARGET_MISSING' }

    let result: AuthoringResult
    let selectedNodeId: string | null = null
    if (dragTarget.sourceNodeId) {
      result = session.execute({
        type: 'node.move',
        nodeId: dragTarget.sourceNodeId,
        destination,
      })
    }
    else {
      const meta = dragTarget.widgetType
        ? session.materials.get(dragTarget.widgetType)
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
        result = session.execute({
          type: 'node.add',
          node,
          destination,
        })
        selectedNodeId = node.id
      }
    }

    if (!result.ok) {
      setForbidden(result)
    }
    else {
      if (selectedNodeId)
        session.execute({ type: 'selection.set', nodeId: selectedNodeId })
      resetDragState()
    }
    return result
  }

  function handleCanvasDrop(e: DragEvent): AuthoringResult {
    e.preventDefault()
    if (!createDecision.value.allowed) {
      const decision = createDecision.value
      const result: Extract<AuthoringResult, { ok: false }> = {
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
    const schema = schemaSnapshot.value
    const dragTarget = session.state.dragTarget.value
    if (!dragTarget)
      return { allowed: false, code: 'DROP_SOURCE_MISSING' }
    const source = dragTarget.sourceNodeId
      ? session.document.getNode(dragTarget.sourceNodeId) as SchemaNode | null
      : undefined
    const child = dragTarget.sourceNodeId
      ? source
      : (() => {
          const meta = dragTarget.widgetType
            ? session.materials.get(dragTarget.widgetType)
            : undefined
          return meta ? createSchemaNode(meta) : null
        })()
    if (!child)
      return { allowed: false, code: 'DROP_SOURCE_MISSING' }
    const targetResult = session.document.resolveDestination?.(destination)
    if (!targetResult)
      return { allowed: false, code: 'CONTAINER_UNRESOLVED' }
    if (!targetResult.ok)
      return { allowed: false, code: targetResult.code, message: targetResult.message }
    const target = targetResult.value
    if (!target.container || !target.definition || !target.variant || !target.region)
      return { allowed: false, code: 'CONTAINER_DESTINATION_REQUIRED' }
    const sourceOwner = dragTarget.sourceNodeId
      ? session.document.getOwner(dragTarget.sourceNodeId)
      : null
    const sameRegion = sourceOwner?.kind === 'container'
      && sourceOwner.containerId === destination.containerId
      && sourceOwner.regionId === destination.regionId
    return resolvePlacementDecision({
      definition: target.definition,
      region: target.region,
      child,
      childHasContainerCapability: Boolean(session.materials.get(child.type)?.container),
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

  function handleContainerDrop(e: DragEvent): AuthoringResult {
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
      const result: Extract<AuthoringResult, { ok: false }> = {
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
