import type {
  ContainerDefinition,
  ContainerRegionConstraints,
  ContainerRegionDefinition,
  ContainerState,
  ContainerVariantDefinition,
  DesignerSchema,
  RegistryInstance,
  ResolvePlacementContext,
  SchemaNode,
  WidgetMeta,
} from './types'
import { cloneDeep } from '@dragcraft/utils'
import { describe, expect, it, vi } from 'vitest'
import {
  createContainerState,
  createRegisteredNode,
  resolvePlacementDecision,
} from './container-placement'
import { createRegistry } from './registry'

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: { untouched: true },
    root: { id: 'root', type: 'root', props: {}, children },
  }
}

function makeNode(id: string, type = 'text'): SchemaNode {
  return { id, type, props: {} }
}

function makeContainer(
  id: string,
  regions: Record<string, SchemaNode[]>,
  variant = 'split',
  type = 'split-layout',
): SchemaNode {
  return {
    ...makeNode(id, type),
    container: { variant, regions },
  }
}

function makeMeta(type: string, overrides: Partial<WidgetMeta> = {}): WidgetMeta {
  return {
    type,
    title: type,
    group: 'basic',
    defaultProps: {},
    formSchema: { sections: [] },
    ...overrides,
  }
}

function makeRegistry(
  definitionOverrides: Partial<ContainerDefinition> = {},
): RegistryInstance {
  const registry = createRegistry()
  registry.registerWidget(makeMeta('text', {
    defaultProps: { label: 'Default', nested: { kept: true } },
    defaultStyle: { content: { color: 'red' } },
    defaultLayout: {
      placement: { kind: 'flow', region: 'hero' },
      order: 3,
      visible: true,
    },
  }))
  registry.registerWidget(makeMeta('split-layout', {
    container: {
      defaultVariant: 'split',
      variants: {
        split: {
          title: 'Split',
          regions: [
            { id: 'left', title: 'Left' },
            { id: 'right', title: 'Right' },
          ],
        },
      },
      ...definitionOverrides,
    },
  }))
  return registry
}

function makePlacementContext(options: {
  child?: SchemaNode
  childHasContainerCapability?: boolean
  constraints?: ContainerRegionConstraints
  canPlace?: ContainerDefinition['canPlace']
  targetCount?: number
} = {}): ResolvePlacementContext {
  const container = makeContainer('layout', { left: [] })
  const child = options.child ?? makeNode('child')
  const region: ContainerRegionDefinition = {
    id: 'left',
    title: 'Left',
    constraints: options.constraints ?? { excludeTypes: ['blocked'] },
  }
  const variant: ContainerVariantDefinition = { title: 'Split', regions: [region] }
  const definition: ContainerDefinition = {
    defaultVariant: 'split',
    variants: { split: variant },
    canPlace: options.canPlace,
  }
  return {
    definition,
    region,
    child,
    childHasContainerCapability: options.childHasContainerCapability ?? Boolean(child.container),
    targetCount: options.targetCount ?? 0,
    callbackContext: {
      operation: 'add',
      schema: makeSchema([container]),
      container,
      variant,
      region,
      child,
      targetIndex: 0,
    },
  }
}

describe('resolvePlacementDecision', () => {
  it.each([
    ['persisted nested container', makeContainer('child', { left: [] }), false, 'CONTAINER_NESTING_FORBIDDEN'],
    ['registered container capability', makeNode('child', 'container-type'), true, 'CONTAINER_NESTING_FORBIDDEN'],
    ['type outside include list', makeNode('child', 'other'), false, 'CONTAINER_TYPE_NOT_INCLUDED'],
    ['excluded type', makeNode('child', 'blocked'), false, 'CONTAINER_TYPE_EXCLUDED'],
  ])('rejects %s before calling the material predicate', (_label, child, capability, code) => {
    const predicate = vi.fn(() => ({ allowed: true }))
    const constraints = child.type === 'other'
      ? { includeTypes: ['text'] }
      : { excludeTypes: ['blocked'] }

    const result = resolvePlacementDecision(makePlacementContext({
      child,
      childHasContainerCapability: capability,
      constraints,
      canPlace: predicate,
    }))

    expect(result).toMatchObject({ allowed: false, code })
    expect(predicate).not.toHaveBeenCalled()
  })

  it('gives exclusion precedence when a type is both included and excluded', () => {
    const result = resolvePlacementDecision(makePlacementContext({
      child: makeNode('child', 'blocked'),
      constraints: { includeTypes: ['blocked'], excludeTypes: ['blocked'] },
    }))

    expect(result).toEqual({ allowed: false, code: 'CONTAINER_TYPE_EXCLUDED' })
  })

  it('rejects max cardinality before calling the material predicate', () => {
    const predicate = vi.fn(() => ({ allowed: true }))

    const result = resolvePlacementDecision(makePlacementContext({
      constraints: { maxItems: 1 },
      targetCount: 1,
      canPlace: predicate,
    }))

    expect(result).toEqual({ allowed: false, code: 'CONTAINER_REGION_MAX_ITEMS' })
    expect(predicate).not.toHaveBeenCalled()
  })

  it('returns the material predicate decision after static checks', () => {
    const decision = {
      allowed: false,
      code: 'MATERIAL_REJECTED',
      message: 'No compatible material',
      details: { material: 'text' },
    }
    const predicate = vi.fn(() => decision)
    const context = makePlacementContext({ canPlace: predicate })

    expect(resolvePlacementDecision(context)).toEqual(decision)
    expect(predicate).toHaveBeenCalledWith(context.callbackContext)
  })

  it('passes detached snapshots to the material predicate', () => {
    const context = makePlacementContext({
      canPlace: (callbackContext) => {
        callbackContext.schema.globalConfig.mutated = true
        callbackContext.container.props.mutated = true
        callbackContext.child.props.mutated = true
        ;(callbackContext.region as ContainerRegionDefinition).title = 'Mutated'
        return { allowed: true }
      },
    })
    const schemaBefore = cloneDeep(context.callbackContext.schema)
    const containerBefore = cloneDeep(context.callbackContext.container)
    const childBefore = cloneDeep(context.callbackContext.child)
    const regionBefore = cloneDeep(context.callbackContext.region)

    expect(resolvePlacementDecision(context)).toEqual({ allowed: true })
    expect(context.callbackContext.schema).toEqual(schemaBefore)
    expect(context.callbackContext.container).toEqual(containerBefore)
    expect(context.callbackContext.child).toEqual(childBefore)
    expect(context.callbackContext.region).toEqual(regionBefore)
  })

  it('allows placement when no material predicate is registered', () => {
    expect(resolvePlacementDecision(makePlacementContext())).toEqual({ allowed: true })
  })

  it('turns a throwing predicate into a structured denial with ownership IDs', () => {
    const result = resolvePlacementDecision(makePlacementContext({
      canPlace: () => { throw new Error('bad material') },
    }))

    expect(result).toEqual({
      allowed: false,
      code: 'CONTAINER_PLACEMENT_PREDICATE_FAILED',
      message: 'bad material',
      details: { nodeId: 'child', containerId: 'layout', regionId: 'left' },
    })
  })

  it('turns invalid predicate output into a structured denial with ownership IDs', () => {
    const result = resolvePlacementDecision(makePlacementContext({
      canPlace: (() => ({ code: 'missing-allowed' })) as unknown as ContainerDefinition['canPlace'],
    }))

    expect(result).toEqual({
      allowed: false,
      code: 'CONTAINER_PLACEMENT_PREDICATE_INVALID',
      details: { nodeId: 'child', containerId: 'layout', regionId: 'left' },
    })
  })
})

describe('createRegisteredNode', () => {
  it('uses registered defaults and strips page placement and order', () => {
    const registry = makeRegistry()
    const createNode = createRegisteredNode(registry, () => 'generated')

    const node = createNode('text', { props: { label: 'Override' } })

    expect(node).toEqual({
      id: 'generated',
      type: 'text',
      props: { label: 'Override', nested: { kept: true } },
      style: { content: { color: 'red' } },
      layout: { visible: true },
    })
    expect(registry.getWidget('text')!.defaultLayout).toEqual({
      placement: { kind: 'flow', region: 'hero' },
      order: 3,
      visible: true,
    })
  })

  it('strips page placement and order from explicit layout overrides', () => {
    const createNode = createRegisteredNode(makeRegistry(), () => 'generated')

    const node = createNode('text', {
      layout: { placement: { kind: 'layer' }, order: 9, visible: false },
    })

    expect(node.layout).toEqual({ visible: false })
  })

  it('rejects unregistered widget types', () => {
    const createNode = createRegisteredNode(makeRegistry(), () => 'generated')

    expect(() => createNode('missing')).toThrow('Cannot initialize unregistered widget type: missing')
  })
})

describe('createContainerState', () => {
  it('rejects a candidate container ID that collides with the document root ID', () => {
    const registry = makeRegistry()

    const result = createContainerState(
      makeNode('root', 'split-layout'),
      makeSchema(),
      registry,
      createRegisteredNode(registry),
    )

    expect(result).toMatchObject({
      ok: false,
      code: 'CONTAINER_INITIAL_STATE_INVALID',
      details: {
        nodeId: 'root',
        containerId: 'root',
        diagnostics: [expect.objectContaining({
          code: 'SCHEMA_NODE_ID_DUPLICATE',
          nodeId: 'root',
        })],
      },
    })
  })

  it('rejects an initial child ID that collides with the document root ID', () => {
    const registry = makeRegistry({
      createInitialState: () => ({
        variant: 'split',
        regions: { left: [makeNode('root')], right: [] },
      }),
    })

    const result = createContainerState(
      makeNode('layout', 'split-layout'),
      makeSchema(),
      registry,
      createRegisteredNode(registry),
    )

    expect(result).toMatchObject({
      ok: false,
      code: 'CONTAINER_INITIAL_STATE_INVALID',
      details: {
        nodeId: 'layout',
        containerId: 'layout',
        diagnostics: [expect.objectContaining({
          code: 'SCHEMA_NODE_ID_DUPLICATE',
          nodeId: 'root',
          ownerId: 'layout',
          regionId: 'left',
        })],
      },
    })
  })

  it('creates the default variant with every registered region', () => {
    const result = createContainerState(
      makeNode('layout', 'split-layout'),
      makeSchema(),
      makeRegistry(),
      createRegisteredNode(makeRegistry(), () => 'unused'),
    )

    expect(result).toEqual({
      ok: true,
      state: { variant: 'split', regions: { left: [], right: [] } },
    })
  })

  it('clones callback inputs and output while using controlled child creation', () => {
    const containerNode = makeNode('layout', 'split-layout')
    containerNode.props = { stable: true }
    const schema = makeSchema()
    let callbackState: ContainerState | undefined
    const registry = makeRegistry({
      createInitialState: (ctx) => {
        ;(ctx.containerNode.props as Record<string, unknown>).mutated = true
        ;(ctx.schema.globalConfig as Record<string, unknown>).mutated = true
        callbackState = {
          variant: 'split',
          regions: {
            left: [ctx.createNode('text', { props: { label: 'Initial' } })],
            right: [],
          },
        }
        return callbackState
      },
    })

    const result = createContainerState(
      containerNode,
      schema,
      registry,
      createRegisteredNode(registry, () => 'initial-child'),
    )

    expect(result.ok).toBe(true)
    if (!result.ok)
      throw new Error(result.code)
    expect(result.state.regions.left[0]).toMatchObject({
      id: 'initial-child',
      props: { label: 'Initial', nested: { kept: true } },
      layout: { visible: true },
    })
    expect(containerNode.props).toEqual({ stable: true })
    expect(schema.globalConfig).toEqual({ untouched: true })
    callbackState!.regions.left[0].props.label = 'Mutated later'
    expect(result.state.regions.left[0].props.label).toBe('Initial')
  })

  it('turns initializer exceptions into structured failures with IDs', () => {
    const registry = makeRegistry({
      createInitialState: () => { throw new Error('initializer failed') },
    })

    const result = createContainerState(
      makeNode('layout', 'split-layout'),
      makeSchema(),
      registry,
      createRegisteredNode(registry),
    )

    expect(result).toEqual({
      ok: false,
      code: 'CONTAINER_INITIAL_STATE_FAILED',
      message: 'initializer failed',
      details: { nodeId: 'layout', containerId: 'layout' },
    })
  })

  it('turns malformed initializer output into a structured failure with IDs', () => {
    const registry = makeRegistry({
      createInitialState: (() => undefined) as unknown as ContainerDefinition['createInitialState'],
    })

    const result = createContainerState(
      makeNode('layout', 'split-layout'),
      makeSchema(),
      registry,
      createRegisteredNode(registry),
    )

    expect(result).toMatchObject({
      ok: false,
      code: 'CONTAINER_INITIAL_STATE_INVALID',
      details: { nodeId: 'layout', containerId: 'layout' },
    })
  })

  it('contains invalid region child output as a structured failure with IDs', () => {
    const registry = makeRegistry({
      createInitialState: (() => ({
        variant: 'split',
        regions: { left: [null], right: [] },
      })) as unknown as ContainerDefinition['createInitialState'],
    })

    const result = createContainerState(
      makeNode('layout', 'split-layout'),
      makeSchema(),
      registry,
      createRegisteredNode(registry),
    )

    expect(result).toMatchObject({
      ok: false,
      code: 'CONTAINER_INITIAL_STATE_INVALID',
      details: { nodeId: 'layout', containerId: 'layout' },
    })
  })

  it('returns candidate subtree validation diagnostics without mutating the schema', () => {
    const schema = makeSchema()
    const registry = makeRegistry({
      createInitialState: () => ({
        variant: 'split',
        regions: {
          left: [{
            ...makeNode('bad-child'),
            layout: { placement: { kind: 'flow' } },
          }],
          right: [],
        },
      }),
    })

    const result = createContainerState(
      makeNode('layout', 'split-layout'),
      schema,
      registry,
      createRegisteredNode(registry),
    )

    expect(result).toMatchObject({
      ok: false,
      code: 'CONTAINER_INITIAL_STATE_INVALID',
      details: {
        nodeId: 'layout',
        containerId: 'layout',
        diagnostics: [expect.objectContaining({
          code: 'CONTAINER_CHILD_PAGE_LAYOUT_FORBIDDEN',
          nodeId: 'bad-child',
          ownerId: 'layout',
        })],
      },
    })
    expect(schema.root.children).toEqual([])
  })

  it('rejects initial child IDs that collide with the existing schema namespace', () => {
    const registry = makeRegistry({
      createInitialState: () => ({
        variant: 'split',
        regions: { left: [makeNode('existing')], right: [] },
      }),
    })

    const result = createContainerState(
      makeNode('layout', 'split-layout'),
      makeSchema([makeNode('existing')]),
      registry,
      createRegisteredNode(registry),
    )

    expect(result).toMatchObject({
      ok: false,
      code: 'CONTAINER_INITIAL_STATE_INVALID',
      details: {
        diagnostics: [expect.objectContaining({
          code: 'SCHEMA_NODE_ID_DUPLICATE',
          nodeId: 'existing',
        })],
      },
    })
  })

  it('ignores validation errors that belong only to the existing schema', () => {
    const registry = makeRegistry()
    registry.registerWidget(makeMeta('ordinary'))
    const unrelatedInvalidNode = makeContainer('unrelated', {}, 'split', 'ordinary')

    const result = createContainerState(
      makeNode('layout', 'split-layout'),
      makeSchema([unrelatedInvalidNode]),
      registry,
      createRegisteredNode(registry),
    )

    expect(result).toEqual({
      ok: true,
      state: { variant: 'split', regions: { left: [], right: [] } },
    })
  })
})
