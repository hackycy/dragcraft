// ──────────────────────────────────────────
// Event hook payloads
// ──────────────────────────────────────────

/**
 * Payload for selection hooks.
 */
export interface SelectHookPayload {
  nodeId: string
  event?: MouseEvent
}

/**
 * Payload for delete hooks.
 */
export interface DeleteHookPayload {
  nodeId: string
  event?: MouseEvent
}

/**
 * Payload for move hooks.
 */
export interface MoveHookPayload {
  nodeId: string
  direction: 'up' | 'down'
  fromIndex: number
  toIndex: number
  event?: MouseEvent
}

/**
 * Payload for drag hooks.
 */
export interface DragHookPayload {
  nodeId: string
  event?: DragEvent
}

/**
 * Payload for hover hooks.
 */
export interface HoverHookPayload {
  nodeId: string | null
}

// ──────────────────────────────────────────
// Event hooks interface
// ──────────────────────────────────────────

/**
 * Interceptable event hooks for the renderer.
 *
 * "onBefore*" hooks are called BEFORE the action. Returning `false`
 * cancels the action (e.g., prevents selection, prevents deletion).
 * Returning `undefined` or `true` allows the action to proceed.
 *
 * "onAfter*" hooks are called AFTER the action completed.
 * They are informational and cannot cancel.
 */
export interface RendererEventHooks {
  // ── Selection ──
  onBeforeSelect?: (payload: SelectHookPayload) => boolean | void
  onAfterSelect?: (payload: SelectHookPayload) => void

  // ── Deletion ──
  onBeforeDelete?: (payload: DeleteHookPayload) => boolean | void
  onAfterDelete?: (payload: DeleteHookPayload) => void

  // ── Movement ──
  onBeforeMove?: (payload: MoveHookPayload) => boolean | void
  onAfterMove?: (payload: MoveHookPayload) => void

  // ── Drag ──
  onBeforeDrag?: (payload: DragHookPayload) => boolean | void
  onAfterDrag?: (payload: DragHookPayload) => void

  // ── Hover ──
  onHoverChange?: (payload: HoverHookPayload) => void
}

/**
 * Returns empty event hooks (no-op). Used as the default.
 */
export function createDefaultEventHooks(): RendererEventHooks {
  return {}
}
