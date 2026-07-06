// ──────────────────────────────────────────
// Async utility type
// ──────────────────────────────────────────

/**
 * A value that is either T or a Promise resolving to T.
 * Used to allow event hooks to be either synchronous or asynchronous.
 */
export type MaybePromise<T> = T | Promise<T>

export interface PendingGuard {
  value: boolean
}

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
 * Interceptable event hooks for non-action renderer events.
 *
 * "onBefore*" hooks are called BEFORE the action. Returning `false`
 * cancels the event (e.g., prevents selection).
 * Returning `undefined` or `true` allows the action to proceed.
 * Hooks may return a Promise for async operations (e.g., confirmation dialogs, API validation).
 *
 * "onAfter*" hooks are called AFTER the action completed.
 * They are informational and cannot cancel. May return a Promise (fire-and-forget).
 *
 * Exceptions:
 * - `onBeforeDrag` stays synchronous — browser DragEvent requires synchronous `preventDefault()`.
 * - `onHoverChange` stays synchronous — high-frequency informational event.
 */
export interface RendererEventHooks {
  // ── Selection ──
  onBeforeSelect?: (payload: SelectHookPayload) => MaybePromise<boolean | void>
  onAfterSelect?: (payload: SelectHookPayload) => MaybePromise<void>

  // ── Drag (onBeforeDrag stays sync — DragEvent constraint) ──
  onBeforeDrag?: (payload: DragHookPayload) => boolean | void
  onAfterDrag?: (payload: DragHookPayload) => MaybePromise<void>

  // ── Hover (stays sync — high frequency, no cancellation) ──
  onHoverChange?: (payload: HoverHookPayload) => void
}

/**
 * Returns empty event hooks (no-op). Used as the default.
 */
export function createDefaultEventHooks(): RendererEventHooks {
  return {}
}

// ──────────────────────────────────────────
// Hook resolution utilities
// ──────────────────────────────────────────

/**
 * Checks whether a value is a thenable (Promise-like).
 */
function isPromiseLike(value: unknown): value is Promise<unknown> {
  return value !== null && typeof value === 'object' && typeof (value as Promise<unknown>).then === 'function'
}

/**
 * Resolves a before-hook result that may be sync or async.
 * Returns `true` if the action should proceed, `false` if cancelled.
 *
 * Error handling: if the hook throws or the promise rejects,
 * the action is CANCELLED (returns false) and the error is logged.
 * Rationale: a gating hook that crashes should fail closed, not open.
 */
export async function resolveBeforeHook(
  result: Promise<boolean | void>,
): Promise<boolean> {
  try {
    const resolved = await result
    return resolved !== false
  }
  catch (err) {
    console.error('[dragcraft] Before-hook error (action cancelled):', err)
    return false
  }
}

/**
 * Runs an action through an optional before/after hook pair.
 * Handles synchronous and asynchronous before-hooks consistently.
 */
export function runBeforeAfterHook<P>(
  beforeHook: ((payload: P) => MaybePromise<boolean | void>) | undefined,
  payload: P,
  execute: () => void,
  afterHook?: (payload: P) => MaybePromise<void>,
  pendingGuard?: PendingGuard,
): void | Promise<void> {
  if (!beforeHook) {
    execute()
    fireAfterHook(afterHook, payload)
    return
  }

  let result: MaybePromise<boolean | void>
  try {
    result = beforeHook(payload)
  }
  catch (err) {
    console.error('[dragcraft] Before-hook error (action cancelled):', err)
    return
  }

  if (!isPromiseLike(result)) {
    if (result === false)
      return
    execute()
    fireAfterHook(afterHook, payload)
    return
  }

  if (pendingGuard)
    pendingGuard.value = true

  return resolveBeforeHook(result).then((allowed) => {
    if (allowed) {
      execute()
      fireAfterHook(afterHook, payload)
    }
  }).finally(() => {
    if (pendingGuard)
      pendingGuard.value = false
  })
}

/**
 * Fires an after-hook (fire-and-forget).
 * If the hook returns a promise, any rejection is caught and logged.
 * Errors never propagate to the caller.
 */
export function fireAfterHook<P>(
  hook: ((payload: P) => MaybePromise<void>) | undefined,
  payload: P,
): void {
  if (!hook)
    return
  try {
    const result = hook(payload)
    if (isPromiseLike(result)) {
      result.catch((err) => {
        console.error('[dragcraft] Async after-hook error:', err)
      })
    }
  }
  catch (err) {
    console.error('[dragcraft] After-hook error:', err)
  }
}
