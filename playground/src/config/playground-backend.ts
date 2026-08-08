export type PlaygroundBackend = 'legacy' | 'next'

export function resolvePlaygroundBackend(search: string, isDevelopment: boolean): PlaygroundBackend {
  return isDevelopment && new URLSearchParams(search).get('backend') === 'next'
    ? 'next'
    : 'legacy'
}
