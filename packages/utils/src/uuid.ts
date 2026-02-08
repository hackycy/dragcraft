export function generateShortId(): string {
  const timestamp = Date.now().toString(36).slice(-6)
  const random = Math.random().toString(36).substring(2, 9)
  return `dragcraft_${timestamp}${random}`
}
