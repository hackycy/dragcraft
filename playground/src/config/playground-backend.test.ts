import { describe, expect, it } from 'vitest'
import { resolvePlaygroundBackend } from './playground-backend'

describe('resolvePlaygroundBackend', () => {
  it('keeps Legacy as the default backend', () => {
    expect(resolvePlaygroundBackend('', true)).toBe('legacy')
    expect(resolvePlaygroundBackend('?backend=legacy', true)).toBe('legacy')
    expect(resolvePlaygroundBackend('?backend=next', false)).toBe('legacy')
  })

  it('enables Next only through the development query selector', () => {
    expect(resolvePlaygroundBackend('?backend=next', true)).toBe('next')
  })
})
