const BLOCKED_RECORD_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function mergeRecord(
  target: Record<string, unknown>,
  patch: Record<string, unknown>,
): boolean {
  let changed = false
  for (const [key, value] of Object.entries(patch)) {
    if (BLOCKED_RECORD_KEYS.has(key))
      continue
    const current = target[key]
    if (Object.hasOwn(target, key) && isPlainRecord(current) && isPlainRecord(value)) {
      changed = mergeRecord(current, value) || changed
    }
    else if (!Object.hasOwn(target, key) || !Object.is(current, value)) {
      target[key] = value
      changed = true
    }
  }
  return changed
}
