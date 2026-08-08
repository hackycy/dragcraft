import { describe, expect, it } from 'vitest'
import { resolveBehavior, resolveCreatable } from './behavior'

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

describe('resolveCreatable', () => {
  const ctx = { widgetType: 'text', schema: { version: '1.0.0', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children: [] } } }

  it('normalizes undefined to the default decision', () => {
    expect(resolveCreatable(undefined, ctx)).toEqual({ allowed: true })
    expect(resolveCreatable(undefined, ctx, false)).toEqual({ allowed: false })
  })

  it('normalizes boolean values', () => {
    expect(resolveCreatable(false, ctx)).toEqual({ allowed: false })
    expect(resolveCreatable(true, ctx)).toEqual({ allowed: true })
  })

  it('preserves explicit block reason metadata', () => {
    expect(resolveCreatable({
      allowed: false,
      code: 'singleton',
      messageKey: 'forbidden.singleton',
      message: 'Only one text widget is allowed',
    }, ctx)).toEqual({
      allowed: false,
      code: 'singleton',
      messageKey: 'forbidden.singleton',
      message: 'Only one text widget is allowed',
    })
  })

  it('invokes creatable predicate with type context', () => {
    const decision = resolveCreatable(({ widgetType }) => ({
      allowed: false,
      message: `${widgetType} is blocked`,
    }), ctx)

    expect(decision).toEqual({
      allowed: false,
      message: 'text is blocked',
    })
  })
})
