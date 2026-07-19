import { describe, expect, it } from 'vitest'
import { normalizeStyleValueMap } from './style'

describe('normalizeStyleValueMap', () => {
  it('adds px only to non-zero numeric length properties', () => {
    expect(normalizeStyleValueMap({
      width: 24,
      marginTop: -8,
      top: 0,
      opacity: 0.5,
      color: 'red',
    })).toEqual({
      width: '24px',
      marginTop: '-8px',
      top: 0,
      opacity: 0.5,
      color: 'red',
    })
  })

  it('preserves undefined input', () => {
    expect(normalizeStyleValueMap(undefined)).toBeUndefined()
  })
})
