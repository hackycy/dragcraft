import type { DesignerSchema, RegistryInstance, SchemaNode, WidgetMeta } from './types'
import { describe, expect, it } from 'vitest'
import { findNearestValidIndex, getLockedIndices, getValidDropIndices, isInsertAllowed, isMoveAllowed, isRemoveAllowed } from './sortable'

function makeNode(id: string, type = 'text', layout?: SchemaNode['layout']): SchemaNode {
  return { id, type, props: {}, layout }
}

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return { version: '1.0.0', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children } }
}

function makeRegistry(metaMap: Record<string, Partial<WidgetMeta>> = {}): RegistryInstance {
  const map = new Map<string, WidgetMeta>()
  for (const [type, meta] of Object.entries(metaMap)) {
    map.set(type, { type, title: type, group: 'g', defaultProps: {}, formSchema: { sections: [] }, ...meta } as WidgetMeta)
  }
  return {
    registerWidget: () => {},
    registerGlobalConfigSchema: () => {},
    registerGlobalConfigFormSchema: () => {},
    getWidget: (type: string) => map.get(type),
    getGlobalConfigSchema: () => undefined,
    getAllWidgets: () => Array.from(map.values()),
  }
}

describe('getLockedIndices', () => {
  it('returns empty set when all widgets are sortable', () => {
    const children = [makeNode('a'), makeNode('b')]
    const reg = makeRegistry({ text: { sortable: true } })
    const locked = getLockedIndices(children, reg, makeSchema(children))
    expect(locked.size).toBe(0)
  })

  it('returns indices of non-sortable widgets', () => {
    const children = [makeNode('a'), makeNode('b', 'header'), makeNode('c')]
    const reg = makeRegistry({ text: { sortable: true }, header: { sortable: false } })
    const locked = getLockedIndices(children, reg, makeSchema(children))
    expect(locked).toEqual(new Set([1]))
  })

  it('skips widgets with no registered meta', () => {
    const children = [makeNode('a', 'unknown')]
    const reg = makeRegistry()
    const locked = getLockedIndices(children, reg, makeSchema(children))
    expect(locked.size).toBe(0)
  })

  it('skips nodes outside the current sort scope from locked indices', () => {
    const children = [makeNode('a'), makeNode('b', 'tabbar', { slot: 'tab-bar.surface' }), makeNode('c')]
    const reg = makeRegistry({ text: { sortable: true } })
    const locked = getLockedIndices(children, reg, makeSchema(children))
    expect(locked.size).toBe(0)
  })

  it('external slots do not alter locked indices in the content sort scope', () => {
    const children = [makeNode('a', 'header'), makeNode('b', 'tabbar', { slot: 'tab-bar.surface' }), makeNode('c')]
    const reg = makeRegistry({ header: { sortable: false }, text: { sortable: true } })
    const locked = getLockedIndices(children, reg, makeSchema(children))
    expect(locked).toEqual(new Set([0]))
  })
})

describe('isInsertAllowed', () => {
  it('allows insert when no locked indices', () => {
    expect(isInsertAllowed(0, new Set())).toBe(true)
    expect(isInsertAllowed(5, new Set())).toBe(true)
  })

  it('blocks insert at or before locked index', () => {
    const locked = new Set([2])
    expect(isInsertAllowed(0, locked)).toBe(false)
    expect(isInsertAllowed(2, locked)).toBe(false)
    expect(isInsertAllowed(3, locked)).toBe(true)
  })

  it('blocks insert when multiple locked indices affected', () => {
    const locked = new Set([1, 3])
    expect(isInsertAllowed(2, locked)).toBe(false) // 3 >= 2
    expect(isInsertAllowed(4, locked)).toBe(true)
  })
})

describe('isMoveAllowed', () => {
  it('allows move when no locked indices', () => {
    expect(isMoveAllowed(0, 2, new Set())).toBe(true)
  })

  it('blocks move of locked widget', () => {
    const locked = new Set([1])
    expect(isMoveAllowed(1, 3, locked)).toBe(false)
  })

  it('allows move that preserves locked positions (src < locked)', () => {
    // children: [a, LOCKED, b] -> move a (idx 0) to idx 0 (same position, no-op)
    const locked = new Set([1])
    // srcIdx=0 < L=1, targetIdx must be <= L-1=0
    expect(isMoveAllowed(0, 0, locked)).toBe(true) // same position
  })

  it('blocks move that would shift locked widget (src < locked)', () => {
    const locked = new Set([1])
    // srcIdx=0 < L=1, targetIdx=2 > L-1=0 -> blocked
    expect(isMoveAllowed(0, 2, locked)).toBe(false)
  })

  it('allows move that preserves locked positions (src > locked)', () => {
    // children: [LOCKED, a, b] -> move b (idx 2) to idx 1
    // After removal: [LOCKED, a]. Insert at 1: [LOCKED, b, a]. LOCKED stays at 0.
    const locked = new Set([0])
    // srcIdx=2 > L=0, targetIdx must be > L=0
    expect(isMoveAllowed(2, 1, locked)).toBe(true)
  })

  it('blocks move that would shift locked widget (src > locked)', () => {
    const locked = new Set([0])
    // srcIdx=2 > L=0, targetIdx=0 <= L=0 -> blocked
    expect(isMoveAllowed(2, 0, locked)).toBe(false)
  })
})

describe('isRemoveAllowed', () => {
  it('allows remove when no locked indices', () => {
    expect(isRemoveAllowed(0, new Set())).toBe(true)
  })

  it('blocks remove that would shift locked widget', () => {
    const locked = new Set([2])
    expect(isRemoveAllowed(0, locked)).toBe(false) // locked at 2 > 0
    expect(isRemoveAllowed(1, locked)).toBe(false) // locked at 2 > 1
    expect(isRemoveAllowed(2, locked)).toBe(true) // removing the locked widget itself is ok
  })

  it('allows remove when locked widgets are before remove index', () => {
    const locked = new Set([0])
    expect(isRemoveAllowed(1, locked)).toBe(true) // locked at 0, not > 1
  })
})

describe('getValidDropIndices', () => {
  it('returns all indices when no locked widgets', () => {
    const children = [makeNode('a'), makeNode('b')]
    const valid = getValidDropIndices(children, new Set(), null)
    expect(valid).toEqual(new Set([0, 1, 2]))
  })

  it('filters invalid insert positions for new widget', () => {
    const children = [makeNode('a'), makeNode('b', 'header')]
    const locked = new Set([1])
    const valid = getValidDropIndices(children, locked, null)
    // Insert at 0: shifts header at 1 -> blocked
    // Insert at 1: shifts header at 1 -> blocked
    // Insert at 2: header at 1 not affected -> allowed
    expect(valid).toEqual(new Set([2]))
  })

  it('validates move positions for existing widget', () => {
    const children = [makeNode('a'), makeNode('b'), makeNode('c')]
    const locked = new Set<number>()
    const valid = getValidDropIndices(children, locked, 'a')
    // No locked, all positions valid
    expect(valid.size).toBe(4) // 0..3
  })

  it('returns all positions when source node not found (no locked)', () => {
    const children = [makeNode('a')]
    const valid = getValidDropIndices(children, new Set(), 'missing')
    // No locked widgets, fast path returns all positions even if source not found
    expect(valid.size).toBe(2)
  })

  it('returns empty set when source node not found and locked widgets exist', () => {
    const children = [makeNode('a')]
    const locked = new Set([0])
    const valid = getValidDropIndices(children, locked, 'missing')
    // srcIdx=-1, loop doesn't enter, returns empty
    expect(valid.size).toBe(0)
  })
})

describe('findNearestValidIndex', () => {
  it('returns exact match when valid', () => {
    expect(findNearestValidIndex(2, new Set([0, 2, 4]))).toBe(2)
  })

  it('returns nearest when exact not valid', () => {
    expect(findNearestValidIndex(3, new Set([0, 5]))).toBe(5)
    expect(findNearestValidIndex(1, new Set([0, 5]))).toBe(0)
  })

  it('returns null when no valid indices', () => {
    expect(findNearestValidIndex(0, new Set())).toBeNull()
  })

  it('returns the closer of two equidistant indices', () => {
    // Both 0 and 4 are distance 2 from index 2
    const result = findNearestValidIndex(2, new Set([0, 4]))
    expect([0, 4]).toContain(result)
  })
})
