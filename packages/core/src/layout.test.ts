import type { DesignerSchema, RegistryInstance, SchemaNode, WidgetMeta } from './types'
import { describe, expect, it } from 'vitest'
import {
  createLayoutPlan,
  DEFAULT_LAYOUT_SLOT,
  DEFAULT_SORT_SCOPE,
  getSortableArrayIndexForInsert,
  getSortScopeEntries,
  resolveNodeLayout,
} from './layout'

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
    registerWidget: meta => map.set(meta.type, meta),
    registerGlobalConfigSchema: () => {},
    registerGlobalConfigFormSchema: () => {},
    getWidget: type => map.get(type),
    getGlobalConfigSchema: () => undefined,
    getAllWidgets: () => Array.from(map.values()),
  }
}

describe('layout protocol', () => {
  it('defaults nodes to the content slot and content sort scope', () => {
    const layout = resolveNodeLayout(makeNode('a'), makeRegistry())
    expect(layout.slot).toBe(DEFAULT_LAYOUT_SLOT)
    expect(layout.sortScope).toBe(DEFAULT_SORT_SCOPE)
  })

  it('defaults non-content slots outside sorting', () => {
    const layout = resolveNodeLayout(makeNode('a', 'tabbar', { slot: 'tab-bar.surface' }), makeRegistry())
    expect(layout.slot).toBe('tab-bar.surface')
    expect(layout.sortScope).toBe(false)
  })

  it('allows widget default layout to be overridden by node layout', () => {
    const reg = makeRegistry({
      tabbar: { defaultLayout: { slot: 'tab-bar.surface', sortScope: false } },
    })
    const layout = resolveNodeLayout(makeNode('a', 'tabbar', { slot: 'custom.surface' }), reg)
    expect(layout.slot).toBe('custom.surface')
    expect(layout.sortScope).toBe(false)
  })

  it('groups entries by open slots and sort scopes', () => {
    const children = [
      makeNode('a'),
      makeNode('tab', 'tabbar', { slot: 'tab-bar.surface' }),
      makeNode('b'),
      makeNode('fab', 'fab', { slot: 'fab.surface', sortScope: false }),
    ]
    const plan = createLayoutPlan(makeSchema(children), makeRegistry())

    expect(plan.slots.get('content')!.map(entry => entry.node.id)).toEqual(['a', 'b'])
    expect(plan.slots.get('tab-bar.surface')!.map(entry => entry.node.id)).toEqual(['tab'])
    expect(plan.slots.get('fab.surface')!.map(entry => entry.node.id)).toEqual(['fab'])
    expect(getSortScopeEntries(plan, 'content').map(entry => entry.node.id)).toEqual(['a', 'b'])
  })

  it('aggregates material layout manifests without interpreting slot names', () => {
    const reg = makeRegistry({
      navbar: {
        defaultLayout: { slot: 'navbar.surface', sortScope: false },
        layoutManifest: {
          slots: {
            'navbar.surface': { allocation: 'reserve', axis: 'block', edge: 'start', order: 10 },
            'help.surface': {
              allocation: 'overlay',
              order: 20,
            },
          },
        },
      },
    })
    const plan = createLayoutPlan(makeSchema([makeNode('nav', 'navbar')]), reg)

    expect(plan.slotManifests.get('navbar.surface')).toMatchObject({
      slot: 'navbar.surface',
      allocation: 'reserve',
      axis: 'block',
      edge: 'start',
      order: 10,
    })
    expect(plan.slotManifests.get('help.surface')).toMatchObject({
      slot: 'help.surface',
      allocation: 'overlay',
      axis: 'block',
      edge: 'start',
      order: 20,
    })
  })

  it('defaults visible to true', () => {
    const layout = resolveNodeLayout(makeNode('a'), makeRegistry())
    expect(layout.visible).toBe(true)
  })

  it('respects static visible: false', () => {
    const layout = resolveNodeLayout(makeNode('a', 'text', { visible: false }), makeRegistry())
    expect(layout.visible).toBe(false)
  })

  it('evaluates visible predicate with schema context', () => {
    const schema = makeSchema([makeNode('a')])
    const layout = resolveNodeLayout(
      makeNode('a', 'text', { visible: ctx => ctx.node.id === 'a' }),
      makeRegistry(),
      schema,
    )
    expect(layout.visible).toBe(true)
  })

  it('returns false for visible predicate when schema is not provided', () => {
    const layout = resolveNodeLayout(
      makeNode('a', 'text', { visible: () => true }),
      makeRegistry(),
    )
    expect(layout.visible).toBe(false)
  })

  it('suppresses default slot for position-only nodes', () => {
    const layout = resolveNodeLayout(
      makeNode('a', 'fab', { position: { anchor: { block: 'end', inline: 'end' } } }),
      makeRegistry(),
    )
    expect(layout.slot).toBeUndefined()
    expect(layout.sortScope).toBe(false)
    expect(layout.position).toEqual({ anchor: { block: 'end', inline: 'end' } })
  })

  it('keeps explicit slot even when position is set', () => {
    const layout = resolveNodeLayout(
      makeNode('a', 'fab', { slot: 'fab.surface', position: { anchor: { block: 'end', inline: 'end' } } }),
      makeRegistry(),
    )
    expect(layout.slot).toBe('fab.surface')
  })

  it('excludes position-only nodes from layout plan', () => {
    const children = [
      makeNode('a'),
      makeNode('fab', 'fab', { position: { anchor: { block: 'end', inline: 'end' } } }),
      makeNode('b'),
    ]
    const plan = createLayoutPlan(makeSchema(children), makeRegistry())

    expect(plan.entries.map(e => e.node.id)).toEqual(['a', 'b'])
    expect(plan.slots.get('content')!.map(e => e.node.id)).toEqual(['a', 'b'])
  })

  it('maps sort-scope insertion indices back to array indices', () => {
    const children = [
      makeNode('a'),
      makeNode('tab', 'tabbar', { slot: 'tab-bar.surface' }),
      makeNode('b'),
    ]
    const plan = createLayoutPlan(makeSchema(children), makeRegistry())
    const scopeEntries = getSortScopeEntries(plan, 'content')

    expect(getSortableArrayIndexForInsert(scopeEntries, children, 0)).toBe(0)
    expect(getSortableArrayIndexForInsert(scopeEntries, children, 1)).toBe(2)
    expect(getSortableArrayIndexForInsert(scopeEntries, children, 2)).toBe(3)
  })
})
