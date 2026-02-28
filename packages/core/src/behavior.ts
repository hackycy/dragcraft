import type { BehaviorPredicate } from './types'

/**
 * Resolves a behavior field that may be a static boolean or a predicate function.
 *
 * - `undefined` → returns `defaultValue` (preserves opt-in defaults)
 * - `boolean`   → returns the boolean directly
 * - `function`  → invokes the function with the provided context
 *
 * @param field - The behavior field from WidgetMeta (may be undefined)
 * @param ctx   - The context to pass if field is a function
 * @param defaultValue - Value when field is undefined (default: true)
 */
export function resolveBehavior<Ctx>(
  field: BehaviorPredicate<Ctx> | undefined,
  ctx: Ctx,
  defaultValue = true,
): boolean {
  if (field === undefined)
    return defaultValue
  if (typeof field === 'function')
    return field(ctx)
  return field
}
