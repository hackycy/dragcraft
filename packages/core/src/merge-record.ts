export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function mergeRecord(
  target: Record<string, unknown>,
  patch: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(patch)) {
    const current = target[key]
    if (isPlainRecord(current) && isPlainRecord(value)) {
      mergeRecord(current, value)
    }
    else {
      target[key] = value
    }
  }
}
