import type { DesignerSchema, NodeOwner, SchemaNode } from '@dragcraft/core'
import type { RendererContext, RendererOptions } from './types'
import { buildSchemaIndex, createLayoutPlan, getLockedIndicesFromNodes } from '@dragcraft/core'
import { computed, inject, ref } from 'vue'
import { createNodeActionRegistry } from './action-registry'
import { createDefaultEventHooks } from './event-hooks'
import { RENDERER_CONTEXT_KEY } from './types'

/**
 * Creates a RendererContext from options.
 * Called internally by RootRenderer.
 */
export function createRendererContext(options: RendererOptions): RendererContext {
  const schema = computed(() => {
    void options.engine.store.schema.value
    return options.engine.state.getSchema()
  })
  const mutableSchema = () => schema.value as DesignerSchema
  const layoutPlan = computed(() => createLayoutPlan(mutableSchema(), options.engine.registry))
  const schemaIndex = computed(() => buildSchemaIndex(mutableSchema()))
  const rootActionPositions = computed(() => {
    const positions = new Map<string, {
      index: number
      siblingCount: number
      sortScope: string | false
      lockedIndices: Set<number>
    }>()
    for (const [sortScope, entries] of layoutPlan.value.sortScopes) {
      const lockedIndices = getLockedIndicesFromNodes(
        entries.map(entry => entry.node),
        options.engine.registry,
        mutableSchema(),
      )
      entries.forEach((entry, index) => positions.set(entry.node.id, {
        index,
        siblingCount: entries.length,
        sortScope,
        lockedIndices,
      }))
    }
    for (const entry of layoutPlan.value.entries) {
      if (!positions.has(entry.node.id)) {
        positions.set(entry.node.id, {
          index: entry.arrayIndex,
          siblingCount: layoutPlan.value.entries.length,
          sortScope: false,
          lockedIndices: new Set(),
        })
      }
    }
    return positions
  })
  const containerLockedIndices = computed(() => {
    const result = new Map<string, Map<string, Set<number>>>()
    for (const container of mutableSchema().root.children ?? []) {
      if (!container.container)
        continue
      const regions = new Map<string, Set<number>>()
      for (const [regionId, nodes] of Object.entries(container.container.regions)) {
        regions.set(regionId, getLockedIndicesFromNodes(
          nodes,
          options.engine.registry,
          mutableSchema(),
        ))
      }
      result.set(container.id, regions)
    }
    return result
  })

  function resolveNodeActionPosition(node: SchemaNode, owner: NodeOwner) {
    if (owner.kind === 'container') {
      const container = schemaIndex.value.index.get(owner.containerId)?.node
      const siblings = container?.container?.regions[owner.regionId] ?? []
      return {
        owner,
        index: schemaIndex.value.index.get(node.id)?.index ?? -1,
        siblingCount: siblings.length,
        sortScope: false as const,
        lockedIndices: containerLockedIndices.value.get(owner.containerId)?.get(owner.regionId) ?? new Set<number>(),
      }
    }

    const position = rootActionPositions.value.get(node.id)
    return {
      owner: {
        kind: 'root' as const,
        sortScope: position?.sortScope === false ? undefined : position?.sortScope,
      },
      index: position?.index ?? -1,
      siblingCount: position?.siblingCount ?? 0,
      sortScope: position?.sortScope ?? false,
      lockedIndices: position?.lockedIndices ?? new Set<number>(),
    }
  }
  return {
    engine: options.engine,
    schema,
    layoutPlan,
    schemaIndex,
    resolveNodeActionPosition,
    componentMap: options.componentMap,
    extensions: options.extensions ?? {},
    eventHooks: options.eventHooks ?? createDefaultEventHooks(),
    actionInterceptors: options.actionInterceptors ?? [],
    actionRegistry: options.actionRegistry ?? createNodeActionRegistry(),
    dragOverNodeId: options.dragOverNodeId ?? ref(null),
    activeDestination: options.activeDestination ?? ref(null),
    containerDropDecision: options.containerDropDecision ?? ref(null),
    onContainerDragOver: options.onContainerDragOver,
    onContainerDragLeave: options.onContainerDragLeave,
    onContainerDrop: options.onContainerDrop,
    interactionBoundary: options.interactionBoundary,
  }
}

/**
 * Injects the RendererContext from the nearest ancestor RootRenderer.
 * Throws if called outside the renderer component tree.
 */
export function useRendererContext(): RendererContext {
  const ctx = inject(RENDERER_CONTEXT_KEY)
  if (!ctx) {
    throw new Error(
      '[dragcraft/renderer] RendererContext not found. '
      + 'Ensure this component is a descendant of RootRenderer.',
    )
  }
  return ctx
}
