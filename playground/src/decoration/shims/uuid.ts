/**
 * prod 里用宿主 `/@/utils/uuid` 的 `buildUUID()`。playground 没有宿主 utils，
 * 用平台自带的 randomUUID，不可用时退化到时间戳 + 随机数。
 */
export function buildUUID(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
