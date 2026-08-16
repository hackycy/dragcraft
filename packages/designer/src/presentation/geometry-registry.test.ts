import { describe, expect, it } from 'vitest'
import { createNodeGeometryRegistry } from './geometry-registry'

describe('node geometry registry', () => {
  it('keeps one current element per node and removes only its own registration', () => {
    const registry = createNodeGeometryRegistry()
    const first = {} as HTMLElement
    const second = {} as HTMLElement

    const unregisterFirst = registry.register('node-1', first)
    expect(registry.get('node-1')).toBe(first)

    const unregisterSecond = registry.register('node-1', second)
    expect(registry.get('node-1')).toBe(second)

    unregisterFirst()
    expect(registry.get('node-1')).toBe(second)
    expect(registry.measure('missing')).toBeNull()

    unregisterSecond()
    expect(registry.get('node-1')).toBeNull()
  })
})
