import type { DesignerEngine, DesignerSchema, SchemaNode } from '@dragcraft/core'
import type { RendererContext, RendererSessionMaterials } from '../types'
import { createContainerPlan, findNodeById, resolveAuthoringCapability, resolveNodeLayout } from '@dragcraft/core'
import { describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { createNodeActionRegistry } from '../action-registry'
import { useNodeActions } from './useNodeActions'

function makeNode(id: string): SchemaNode {
  return { id, type: 'text', props: {} }
}

function makeContext(schema: DesignerSchema): RendererContext {
  const registry = {
    getWidget: vi.fn(() => ({
      type: 'text',
      title: 'Text',
      group: 'g',
      defaultProps: {},
      formSchema: { sections: [] },
    })),
  } as unknown as DesignerEngine['registry']
  const engine = {
    store: { schema: { value: schema } },
    state: {
      getSchema: () => schema,
      getNodeById: (id: string) => findNodeById(schema.root, id),
    },
    registry,
  } as unknown as DesignerEngine
  const materials: RendererSessionMaterials = {
    get: type => registry.getWidget(type),
    getAll: () => [],
    resolveCapability: (node, capability) => resolveAuthoringCapability(
      registry.getWidget(node.type),
      { node, schema },
      capability,
    ),
    resolveLayout: node => resolveNodeLayout(node as SchemaNode, registry, schema),
    resolveContainer: node => createContainerPlan(node as SchemaNode, registry),
    getLockedIndices: () => new Set<number>(),
    canCreateSubtree: () => true,
    canDeleteSubtree: () => true,
  }
  return {
    engine,
    schema: computed(() => schema),
    session: {
      document: {
        rootNodes: computed(() => schema.root.children ?? []),
        getStructurePosition: () => null,
        getRegionNodes: (containerId: string, regionId: string) =>
          schema.root.children?.find(node => node.id === containerId)?.container?.regions[regionId] ?? [],
      },
      materials,
    } as unknown as RendererContext['session'],
    actionRegistry: createNodeActionRegistry(),
    actionInterceptors: [],
  } as unknown as RendererContext
}

describe('useNodeActions', () => {
  it('builds a root owner from the resolved page sort scope', () => {
    const node = makeNode('root-child')
    const schema: DesignerSchema = {
      version: '1.0.0',
      globalConfig: {},
      root: { id: 'root', type: 'root', props: {}, children: [node] },
    }

    const { actionContext } = useNodeActions(() => node, makeContext(schema))

    expect(actionContext.value.owner).toEqual({ kind: 'root', sortScope: 'content' })
    expect(actionContext.value.index).toBe(0)
    expect(actionContext.value.siblingCount).toBe(1)
  })

  it('builds a container owner and region sibling coordinates', () => {
    const child = makeNode('child')
    const container: SchemaNode = {
      id: 'layout',
      type: 'layout',
      props: {},
      container: { variant: 'split', regions: { left: [makeNode('first'), child] } },
    }
    const schema: DesignerSchema = {
      version: '1.0.0',
      globalConfig: {},
      root: { id: 'root', type: 'root', props: {}, children: [container] },
    }

    const owner = { kind: 'container' as const, containerId: 'layout', regionId: 'left' }
    const { actionContext } = useNodeActions(() => child, makeContext(schema), () => owner)

    expect(actionContext.value.owner).toEqual({
      kind: 'container',
      containerId: 'layout',
      regionId: 'left',
    })
    expect(actionContext.value.index).toBe(1)
    expect(actionContext.value.siblingCount).toBe(2)
    expect(actionContext.value.sortScope).toBe(false)
  })
})
