import type { ContainerDefinition, DesignerSchema, SchemaNode } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { createRegistry } from '../registry'
import { createSchemaStore } from '../schema-store'
import { changeContainerVariantHandler } from './change-container-variant'

function makeNode(id: string, type = 'text'): SchemaNode {
  return { id, type, props: {} }
}

function makeContainer(): SchemaNode {
  return {
    id: 'layout',
    type: 'variant-layout',
    props: {},
    container: {
      variant: 'split',
      regions: { left: [makeNode('left')], right: [makeNode('right')] },
    },
  }
}

function makeSchema(container = makeContainer()): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: {},
    root: { id: 'root', type: 'root', props: {}, children: [container] },
  }
}

function makeDefinition(overrides: Partial<ContainerDefinition> = {}): ContainerDefinition {
  return {
    defaultVariant: 'split',
    variants: {
      split: {
        title: 'Split',
        regions: [{ id: 'left', title: 'Left' }, { id: 'right', title: 'Right' }],
      },
      reversed: {
        title: 'Reversed',
        regions: [{ id: 'right', title: 'Right' }, { id: 'left', title: 'Left' }],
      },
      stacked: {
        title: 'Stacked',
        regions: [{ id: 'body', title: 'Body' }],
      },
    },
    ...overrides,
  }
}

function setup(definition = makeDefinition()) {
  const container = makeContainer()
  const store = createSchemaStore(makeSchema(container))
  const registry = createRegistry()
  registry.registerWidget({
    type: 'variant-layout',
    title: 'Variant',
    group: 'g',
    defaultProps: {},
    formSchema: { sections: [] },
    container: definition,
  })
  return {
    container: store.getRawSchema().root.children![0],
    store,
    registry,
    ctx: { store, registry },
  }
}

describe('changeContainerVariantHandler', () => {
  it('changes variants directly when region IDs are unchanged', () => {
    const { container, ctx } = setup()

    expect(changeContainerVariantHandler(ctx, {
      containerId: 'layout',
      variant: 'reversed',
    })).toEqual({
      ok: true,
      eventPayload: {
        containerId: 'layout',
        fromVariant: 'split',
        toVariant: 'reversed',
      },
    })
    expect(container.container).toEqual({
      variant: 'reversed',
      regions: { left: [makeNode('left')], right: [makeNode('right')] },
    })
  })

  it('commits a valid externally migrated state', () => {
    const migrateVariant = vi.fn(({ state }) => ({
      allowed: true as const,
      state: {
        variant: 'stacked',
        regions: { body: [...state.regions.left, ...state.regions.right] },
      },
    }))
    const { container, ctx } = setup(makeDefinition({ migrateVariant }))

    expect(changeContainerVariantHandler(ctx, {
      containerId: 'layout',
      variant: 'stacked',
    })).toMatchObject({ ok: true })
    expect(container.container!.variant).toBe('stacked')
    expect(container.container!.regions.body.map(node => node.id)).toEqual(['left', 'right'])
    expect(migrateVariant).toHaveBeenCalledOnce()
  })

  it('commits canonical empty target regions from validated migration state', () => {
    const { container, ctx } = setup(makeDefinition({
      migrateVariant: () => ({
        allowed: true,
        state: { variant: 'stacked', regions: {} },
      }),
    }))

    expect(changeContainerVariantHandler(ctx, {
      containerId: 'layout',
      variant: 'stacked',
    })).toMatchObject({ ok: true })
    expect(container.container).toEqual({
      variant: 'stacked',
      regions: { body: [] },
    })
  })

  it('requires a migration when region IDs change', () => {
    const { ctx, store } = setup()
    const before = store.getSchema()

    expect(changeContainerVariantHandler(ctx, {
      containerId: 'layout',
      variant: 'stacked',
    })).toEqual({
      ok: false,
      code: 'CONTAINER_VARIANT_MIGRATION_REQUIRED',
      message: undefined,
    })
    expect(store.getSchema()).toEqual(before)
  })

  it.each([
    ['missing result', () => undefined],
    ['missing allowed', () => ({ state: { variant: 'stacked', regions: { body: [] } } })],
    ['missing state', () => ({ allowed: true })],
    ['null regions', () => ({ allowed: true, state: { variant: 'stacked', regions: null } })],
    ['non-array region', () => ({ allowed: true, state: { variant: 'stacked', regions: { body: {} } } })],
    ['malformed child', () => ({ allowed: true, state: { variant: 'stacked', regions: { body: [null] } } })],
  ])('rejects invalid migration output: %s', (_, migrateVariant) => {
    const { ctx, store } = setup(makeDefinition({ migrateVariant: migrateVariant as never }))
    const before = store.getSchema()

    expect(changeContainerVariantHandler(ctx, {
      containerId: 'layout',
      variant: 'stacked',
    })).toMatchObject({ ok: false, code: 'CONTAINER_VARIANT_MIGRATION_INVALID' })
    expect(store.getSchema()).toEqual(before)
  })

  it.each([
    ['code', { allowed: false, code: 123 }],
    ['message', { allowed: false, code: 'MIGRATION_DENIED', message: {} }],
    ['messageKey', { allowed: false, code: 'MIGRATION_DENIED', messageKey: [] }],
    ['details', { allowed: false, code: 'MIGRATION_DENIED', details: [] }],
  ])('normalizes a denial with malformed %s metadata', (_, migrationResult) => {
    const { ctx, store } = setup(makeDefinition({
      migrateVariant: () => migrationResult as never,
    }))
    const before = store.getSchema()

    expect(changeContainerVariantHandler(ctx, {
      containerId: 'layout',
      variant: 'stacked',
    })).toEqual({
      ok: false,
      code: 'CONTAINER_VARIANT_MIGRATION_INVALID',
      message: undefined,
    })
    expect(store.getSchema()).toEqual(before)
  })

  it('preserves a denial with valid string code and message', () => {
    const { ctx, store } = setup(makeDefinition({
      migrateVariant: () => ({
        allowed: false,
        code: 'MIGRATION_DENIED',
        message: 'Choose a compatible layout first.',
      }),
    }))
    const before = store.getSchema()

    expect(changeContainerVariantHandler(ctx, {
      containerId: 'layout',
      variant: 'stacked',
    })).toEqual({
      ok: false,
      code: 'MIGRATION_DENIED',
      message: 'Choose a compatible layout first.',
    })
    expect(store.getSchema()).toEqual(before)
  })

  it('rejects migrated state for a different target variant', () => {
    const { ctx, store } = setup(makeDefinition({
      migrateVariant: () => ({
        allowed: true,
        state: { variant: 'split', regions: { left: [], right: [] } },
      }),
    }))
    const before = store.getSchema()

    expect(changeContainerVariantHandler(ctx, {
      containerId: 'layout',
      variant: 'stacked',
    })).toMatchObject({ ok: false, code: 'CONTAINER_VARIANT_MIGRATION_TARGET_MISMATCH' })
    expect(store.getSchema()).toEqual(before)
  })

  it('rejects migrated state that fails schema validation', () => {
    const { ctx, store } = setup(makeDefinition({
      migrateVariant: () => ({
        allowed: true,
        state: { variant: 'stacked', regions: { body: [makeNode('layout')] } },
      }),
    }))
    const before = store.getSchema()

    expect(changeContainerVariantHandler(ctx, {
      containerId: 'layout',
      variant: 'stacked',
    })).toMatchObject({ ok: false, code: 'CONTAINER_VARIANT_MIGRATION_INVALID' })
    expect(store.getSchema()).toEqual(before)
  })

  it('converts migration exceptions into structured failures', () => {
    const { ctx, store } = setup(makeDefinition({
      migrateVariant: () => { throw new Error('migration exploded') },
    }))
    const before = store.getSchema()

    expect(changeContainerVariantHandler(ctx, {
      containerId: 'layout',
      variant: 'stacked',
    })).toMatchObject({
      ok: false,
      code: 'CONTAINER_VARIANT_MIGRATION_FAILED',
      message: 'migration exploded',
    })
    expect(store.getSchema()).toEqual(before)
  })

  it('rejects unresolved containers and unknown variants', () => {
    const { ctx, registry } = setup()

    expect(changeContainerVariantHandler(ctx, {
      containerId: 'missing',
      variant: 'stacked',
    })).toEqual({ ok: false, code: 'CONTAINER_UNRESOLVED' })
    expect(changeContainerVariantHandler(ctx, {
      containerId: 'layout',
      variant: 'missing',
    })).toEqual({ ok: false, code: 'CONTAINER_VARIANT_UNKNOWN' })

    registry.registerWidget({
      type: 'variant-layout',
      title: 'Ordinary',
      group: 'g',
      defaultProps: {},
      formSchema: { sections: [] },
    })
    expect(changeContainerVariantHandler(ctx, {
      containerId: 'layout',
      variant: 'stacked',
    })).toEqual({ ok: false, code: 'CONTAINER_UNRESOLVED' })
  })
})
