import type { DesignerSchema, RegistryInstance, SchemaNode, WidgetMeta } from './types'
import { describe, expect, it } from 'vitest'
import {
  createLayoutPlan,
  DEFAULT_LAYER,
  DEFAULT_LAYOUT_REGION,
  DEFAULT_SORT_SCOPE,
  getLayoutRegionEntries,
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
  it('defaults nodes to content flow and content sort scope', () => {
    const layout = resolveNodeLayout(makeNode('a'), makeRegistry())
    expect(layout.placement).toEqual({
      kind: 'flow',
      region: DEFAULT_LAYOUT_REGION,
      sortScope: DEFAULT_SORT_SCOPE,
    })
    expect(layout.region).toBe(DEFAULT_LAYOUT_REGION)
    expect(layout.sortScope).toBe(DEFAULT_SORT_SCOPE)
  })

  it('allows widget default placement to be overridden by node placement', () => {
    const reg = makeRegistry({
      text: { defaultLayout: { placement: { kind: 'flow', region: 'hero' } } },
    })
    const layout = resolveNodeLayout(makeNode('a', 'text', { placement: { kind: 'flow', region: 'content' } }), reg)
    expect(layout.placement).toMatchObject({ kind: 'flow', region: 'content' })
  })

  it('groups entries by regions, chrome, layers, and sort scopes', () => {
    const children = [
      makeNode('nav', 'navbar', { placement: { kind: 'chrome', edge: 'block-start' } }),
      makeNode('a'),
      makeNode('fab', 'fab', { placement: { kind: 'layer', layer: 'float', mode: 'self' } }),
      makeNode('b'),
      makeNode('tab', 'tabbar', { placement: { kind: 'chrome', edge: 'block-end' } }),
    ]
    const plan = createLayoutPlan(makeSchema(children), makeRegistry())

    expect(plan.entries.map(entry => entry.node.id)).toEqual(['nav', 'a', 'fab', 'b', 'tab'])
    expect(plan.regions.get('content')!.map(entry => entry.node.id)).toEqual(['a', 'b'])
    expect(plan.chrome.map(entry => entry.node.id)).toEqual(['nav', 'tab'])
    expect(plan.layers.get('float')!.map(entry => entry.node.id)).toEqual(['fab'])
    expect(getSortScopeEntries(plan, 'content').map(entry => entry.node.id)).toEqual(['a', 'b'])
  })

  it('normalizes chrome placement and contributes content insets', () => {
    const children = [
      makeNode('nav', 'navbar', { placement: { kind: 'chrome', edge: 'block-start' } }),
      makeNode('tab', 'tabbar', {
        placement: {
          kind: 'chrome',
          edge: 'block-end',
          reserve: { mode: 'size', size: 50 },
        },
      }),
    ]
    const plan = createLayoutPlan(makeSchema(children), makeRegistry())

    expect(plan.chrome[0].layout.placement).toMatchObject({
      kind: 'chrome',
      edge: 'block-start',
      position: 'fixed',
      reserve: { mode: 'measure' },
      avoidContent: true,
    })
    expect(plan.insets.contributors).toEqual([
      { edge: 'block-start', sourceNodeId: 'nav', reserve: { mode: 'measure', size: undefined } },
      { edge: 'block-end', sourceNodeId: 'tab', reserve: { mode: 'size', size: 50 } },
    ])
  })

  it('supports framework and self positioned layers without leaving the layout plan', () => {
    const self = resolveNodeLayout(
      makeNode('self', 'fab', { placement: { kind: 'layer', layer: 'float', mode: 'self' } }),
      makeRegistry(),
    )
    const framework = resolveNodeLayout(
      makeNode('anchored', 'fab', { placement: { kind: 'layer', anchor: { block: 'start', inline: 'center' } } }),
      makeRegistry(),
    )

    expect(self.placement).toMatchObject({
      kind: 'layer',
      layer: 'float',
      mode: 'self',
      anchor: { block: 'end', inline: 'end' },
      avoid: ['safe-area', 'chrome'],
    })
    expect(framework.placement).toMatchObject({
      kind: 'layer',
      layer: DEFAULT_LAYER,
      mode: 'framework',
      anchor: { block: 'start', inline: 'center' },
    })

    const plan = createLayoutPlan(makeSchema([
      makeNode('a'),
      makeNode('self', 'fab', { placement: { kind: 'layer', layer: 'float', mode: 'self' } }),
    ]), makeRegistry())
    expect(plan.entries.map(entry => entry.node.id)).toEqual(['a', 'self'])
    expect(plan.layers.get('float')!.map(entry => entry.node.id)).toEqual(['self'])
  })

  it('resolves static and predicate visibility', () => {
    const schema = makeSchema([makeNode('a')])
    expect(resolveNodeLayout(makeNode('a', 'text', { visible: false }), makeRegistry()).visible).toBe(false)
    expect(resolveNodeLayout(
      makeNode('a', 'text', { visible: ctx => ctx.node.id === 'a' }),
      makeRegistry(),
      schema,
    ).visible).toBe(true)
    expect(resolveNodeLayout(
      makeNode('a', 'text', { visible: () => true }),
      makeRegistry(),
    ).visible).toBe(false)
  })

  it('keeps non-content flow regions outside the default sort scope', () => {
    const plan = createLayoutPlan(makeSchema([
      makeNode('hero', 'text', { placement: { kind: 'flow', region: 'hero' } }),
      makeNode('body'),
    ]), makeRegistry())

    expect(getLayoutRegionEntries(plan, 'hero').map(entry => entry.node.id)).toEqual(['hero'])
    expect(getSortScopeEntries(plan, 'content').map(entry => entry.node.id)).toEqual(['body'])
  })

  it('maps sort-scope insertion indices back to array indices', () => {
    const children = [
      makeNode('a'),
      makeNode('tab', 'tabbar', { placement: { kind: 'chrome', edge: 'block-end' } }),
      makeNode('b'),
    ]
    const plan = createLayoutPlan(makeSchema(children), makeRegistry())
    const scopeEntries = getSortScopeEntries(plan, 'content')

    expect(getSortableArrayIndexForInsert(scopeEntries, children, 0)).toBe(0)
    expect(getSortableArrayIndexForInsert(scopeEntries, children, 1)).toBe(2)
    expect(getSortableArrayIndexForInsert(scopeEntries, children, 2)).toBe(3)
  })
})
