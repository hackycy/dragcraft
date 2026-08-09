import type { ContainerVariantMigrationContext } from './contract'
import { expect, it } from 'vitest'
import { columnContainerMeta, migrateColumnVariant, node } from './container'

function context(
  fromVariantId: 'single' | 'split',
  toVariantId: 'single' | 'split',
  regions: Record<string, ReturnType<typeof node>[]>,
): ContainerVariantMigrationContext {
  const definition = columnContainerMeta.container
  return {
    schema: {
      version: '1.0.0',
      globalConfig: {},
      root: { id: 'root', type: 'root', props: {}, children: [] },
    },
    container: { id: 'layout-1', type: 'column-container', props: {} },
    fromVariantId,
    toVariantId,
    fromVariant: definition.variants[fromVariantId],
    toVariant: definition.variants[toVariantId],
    state: { variant: fromVariantId, regions },
  }
}

it('keeps child order when a single column becomes two columns', () => {
  expect(migrateColumnVariant(context('single', 'split', {
    content: [node('one'), node('two'), node('three')],
  }))).toEqual({
    allowed: true,
    state: {
      variant: 'split',
      regions: {
        left: [node('one'), node('two')],
        right: [node('three')],
      },
    },
  })
})

it('rejects a migration that exceeds the supported capacity', () => {
  expect(migrateColumnVariant(context('single', 'split', {
    content: [node('one'), node('two'), node('three'), node('four'), node('five')],
  }))).toEqual({
    allowed: false,
    code: 'GUIDE_CONTAINER_CAPACITY_EXCEEDED',
    details: { maxItems: 4, nodeCount: 5 },
  })
})
