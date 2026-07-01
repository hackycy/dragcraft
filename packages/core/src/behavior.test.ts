import { describe, expect, it } from 'vitest'
import { resolveBehavior } from './behavior'

describe('resolveBehavior', () => {
  it('returns defaultValue when field is undefined', () => {
    expect(resolveBehavior(undefined, {})).toBe(true)
  })

  it('returns custom defaultValue when field is undefined', () => {
    expect(resolveBehavior(undefined, {}, false)).toBe(false)
  })

  it('returns boolean directly', () => {
    expect(resolveBehavior(true, {})).toBe(true)
    expect(resolveBehavior(false, {})).toBe(false)
  })

  it('invokes predicate function with context', () => {
    const predicate = (ctx: { x: number }) => ctx.x > 5
    expect(resolveBehavior(predicate, { x: 10 })).toBe(true)
    expect(resolveBehavior(predicate, { x: 3 })).toBe(false)
  })
})
