import type { JsonObject, NodeDefinition } from '@dragcraft/core'
import type { ComputedRef, Ref } from 'vue'
import type { MaterialDefinition } from '../materials/types'
import type { NodeDestination, PlacementDecision } from '../presentation/semantic'
import type { ContainerDropRejection, ContainerDropTarget } from '../presentation/types'
import type { AuthoringResult, DesignerSession, DesignerSessionDropRejectionReason } from '../session/types'
import { generateShortId } from '@dragcraft/utils'
import { computed, watch } from 'vue'
import { hideNativeDragImage } from '../presentation/drag-image'
import {
  findNearestValidIndex,
  getValidDropIndices,
} from '../presentation/semantic'

// ──────────────────────────────────────────
// Return type
// ──────────────────────────────────────────

export interface UseDragDropReturn {
  /** Unified root/container destination selected during drag-over. */
  dragOverDestination: Ref<NodeDestination | null>
  /** Active destination shared with Presentation. */
  activeDestination: Ref<NodeDestination | null>
  /** Advisory placement decision for the active container destination. */
  containerDropDecision: Ref<PlacementDecision | null>
  /** Root or container receiving drag feedback. */
  dragOverNodeId: Ref<string | null>
  /** Visual insertion index for root feedback. */
  dragOverIndex: Ref<number | null>
  /** Cached locked indices (recomputed only when schema changes) */
  lockedIndices: ComputedRef<ReadonlySet<number>>
  /** Valid drop indices for the current drag operation */
  validDropIndices: ComputedRef<ReadonlySet<number> | null>
  /** Start dragging a new material from the material panel. */
  handleMaterialDragStart: (e: DragEvent, material: Readonly<MaterialDefinition>) => void
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
      dragOverDestination.value = {
        kind: 'root',
        index: index ?? undefined,
      }
    },
  })
  const isForbidden = session.state.drag.isForbidden
  const forbiddenReason = session.state.drag.forbiddenReason
  let dropGeometry: {
    canvas: HTMLElement
    targets: Array<{ readonly index: number, readonly midpoint: number }>
  } | null = null
  let dropGeometryFrame: number | null = null
  function getRootNodes(): NodeDefinition[] {
    return [...session.document.rootNodes.value] as NodeDefinition[]
  }

  // ── Sortable constraint computeds ──

  const lockedIndices = computed(() => {
    return session.materials.getLockedIndices(getRootNodes())
  })

  const validDropIndices = computed(() => {
    const dragTarget = session.state.dragTarget.value
    if (!dragTarget)
      return null
    return getValidDropIndices(getRootNodes(), lockedIndices.value, dragTarget.sourceNodeId)
  })

  const createDecision = computed(() => {
    const target = session.state.dragTarget.value
    if (!target?.widgetType)
      return { allowed: true }
    const material = session.materials.get(target.widgetType)
    if (!material)
      return { allowed: true }
    return session.evaluate({
      type: 'node.add',
      node: createNodeDefinition(material),
      destination: dragOverDestination.value ?? { kind: 'root' },
    })
  })

  // ── Visual drop index computation ──

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

  function createNodeDefinition(material: Readonly<MaterialDefinition>): NodeDefinition {
    return {
      id: generateShortId(),
      type: material.type,
      props: { ...(material.schema?.defaultProps ?? {}) } as JsonObject,
      ...(material.schema?.defaultStyle ? { style: material.schema.defaultStyle as JsonObject } : {}),
    }
  }

  function computeDropIndex(e: DragEvent): number {
    const canvasEl = e.currentTarget as HTMLElement
    if (!dropGeometry || dropGeometry.canvas !== canvasEl) {
      const rootNodes = session.document.rootNodes.value
      const rootIndices = new Map(rootNodes.map((node, index) => [node.id, index]))
      const targets = Array.from(canvasEl.querySelectorAll<HTMLElement>(
        '.dc-canvas-surface__content [data-dc-component="node"][data-node-id]',
      ))
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return {
            index: rootIndices.get(element.dataset.nodeId ?? ''),
            midpoint: rect.top + rect.height / 2,
          }
        })
        .filter((target): target is { readonly index: number, readonly midpoint: number } => target.index !== undefined)
        .sort((a, b) => a.midpoint - b.midpoint || a.index - b.index)
      dropGeometry = { canvas: canvasEl, targets }
      if (dropGeometryFrame === null) {
        dropGeometryFrame = window.requestAnimationFrame(() => {
          dropGeometryFrame = null
          dropGeometry = null
        })
      }
    }

    const mouseY = e.clientY
    const { targets } = dropGeometry
    if (targets.length === 0)
      return session.document.rootNodes.value.length
    let low = 0
    let high = targets.length
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      if (mouseY < targets[middle].midpoint)
        high = middle
      else
        low = middle + 1
    }
    return low === 0
      ? targets[0].index
      : targets[low - 1].index + 1
  }

  // ── Drag start handlers ──

  function handleMaterialDragStart(e: DragEvent, material: Readonly<MaterialDefinition>): void {
    clearDropGeometry(true)
    session.execute({
      type: 'drag.set',
      target: {
        sourceNodeId: null,
        widgetType: material.type,
      },
    })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('text/plain', material.type)
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

    dragOverDestination.value = {
      kind: 'root',
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

    const rawIndex = computeDropIndex(e)
    const index = resolveVisualDropIndex(rawIndex)
    dragOverDestination.value = {
      kind: 'root',
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
      const material = dragTarget.widgetType
        ? session.materials.get(dragTarget.widgetType)
        : undefined
      if (!material) {
        result = { ok: false, code: 'DRAGGED_MATERIAL_MISSING' }
      }
      else {
        const node = createNodeDefinition(material)
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
    const dragTarget = session.state.dragTarget.value
    if (!dragTarget)
      return { allowed: false, code: 'DROP_SOURCE_MISSING' }
    const source = dragTarget.sourceNodeId
      ? session.document.getNode(dragTarget.sourceNodeId)
      : undefined
    const child = dragTarget.sourceNodeId
      ? source
      : (() => {
          const material = dragTarget.widgetType
            ? session.materials.get(dragTarget.widgetType)
            : undefined
          return material ? createNodeDefinition(material) : null
        })()
    if (!child)
      return { allowed: false, code: 'DROP_SOURCE_MISSING' }
    const decision = dragTarget.sourceNodeId
      ? session.evaluate({ type: 'node.move', nodeId: dragTarget.sourceNodeId, destination })
      : session.evaluate({ type: 'node.add', node: child as NodeDefinition, destination })
    return {
      allowed: decision.allowed,
      ...(decision.code ? { code: decision.code } : {}),
      ...(decision.messageKey ? { messageKey: decision.messageKey } : {}),
      ...(decision.message ? { message: decision.message } : {}),
      ...(decision.details ? { details: decision.details } : {}),
    }
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
    const decision = containerDropDecision.value
    if (decision && !decision.allowed) {
      return {
        ok: false,
        code: decision.code ?? 'CONTAINER_PLACEMENT_REJECTED',
        messageKey: decision.messageKey,
        message: decision.message,
        details: decision.details,
      }
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
