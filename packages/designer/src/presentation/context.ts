import type { DesignerSchema, LayoutEdge, NodeOwner, ResolvedChromePlacement, SchemaNode } from '@dragcraft/legacy-core'
import type { RendererContext, RendererLayoutEntry, RendererLayoutProjection, RendererOptions } from './types'
import { computed, inject, ref } from 'vue'
import { createNodeActionRegistry } from './action-registry'
import { createDefaultEventHooks } from './event-hooks'
import { RENDERER_CONTEXT_KEY } from './types'

function pushEntry(
  entries: Map<string, RendererLayoutEntry[]>,
  key: string,
  entry: RendererLayoutEntry,
): void {
  const group = entries.get(key)
  if (group)
    group.push(entry)
  else
    entries.set(key, [entry])
}

function sortEntries(entries: RendererLayoutEntry[]): void {
  entries.sort((a, b) => {
    const orderA = a.layout.order ?? a.arrayIndex
    const orderB = b.layout.order ?? b.arrayIndex
    return orderA === orderB ? a.arrayIndex - b.arrayIndex : orderA - orderB
  })
}

function edgeOrder(edge: LayoutEdge): number {
  return ['block-start', 'inline-start', 'inline-end', 'block-end'].indexOf(edge)
}

function createRendererLayoutProjection(options: RendererOptions): RendererLayoutProjection {
  const entries: RendererLayoutEntry[] = []
  const regions = new Map<string, RendererLayoutEntry[]>()
  const chrome: RendererLayoutEntry[] = []
  const layers = new Map<string, RendererLayoutEntry[]>()
  const sortScopes = new Map<string, RendererLayoutEntry[]>()

  options.session.document.rootNodes.value.forEach((node, arrayIndex) => {
    const entry: RendererLayoutEntry = {
      node,
      arrayIndex,
      layout: options.session.materials.resolveLayout(node),
    }
    if (!entry.layout.visible)
      return
    entries.push(entry)
    if (entry.layout.placement.kind === 'flow') {
      pushEntry(regions, entry.layout.placement.region, entry)
      if (entry.layout.placement.sortScope !== false)
        pushEntry(sortScopes, entry.layout.placement.sortScope, entry)
      return
    }
    if (entry.layout.placement.kind === 'chrome') {
      chrome.push(entry)
      return
    }
    pushEntry(layers, entry.layout.placement.layer, entry)
  })

  sortEntries(entries)
  regions.forEach(sortEntries)
  sortScopes.forEach(sortEntries)
  layers.forEach(sortEntries)
  chrome.sort((a, b) => {
    const placementA = a.layout.placement as ResolvedChromePlacement
    const placementB = b.layout.placement as ResolvedChromePlacement
    const edgeDelta = edgeOrder(placementA.edge) - edgeOrder(placementB.edge)
    if (edgeDelta !== 0)
      return edgeDelta
    const orderA = a.layout.order ?? a.arrayIndex
    const orderB = b.layout.order ?? b.arrayIndex
    return orderA === orderB ? a.arrayIndex - b.arrayIndex : orderA - orderB
  })

  return {
    entries,
    regions,
    chrome,
    layers,
    sortScopes,
    insets: {
      contributors: chrome.flatMap((entry) => {
        const placement = entry.layout.placement as ResolvedChromePlacement
        return placement.avoidContent
          ? [{ edge: placement.edge, sourceNodeId: entry.node.id, reserve: placement.reserve }]
          : []
      }),
    },
  }
}

/**
 * Creates a RendererContext from the semantic session projection.
 * Called internally by RootRenderer.
 */
export function createRendererContext(options: RendererOptions): RendererContext {
  const schema = computed(() => ({
    version: options.session.document.version.value,
    globalConfig: options.session.document.globalConfig.value,
    root: options.session.document.root.value,
  }) as DesignerSchema)
  const layout = computed(() => createRendererLayoutProjection(options))

  function resolveNodeActionPosition(node: SchemaNode, owner: NodeOwner) {
    const position = options.session.document.getStructurePosition(node.id)
    if (position) {
      return {
        owner: position.owner,
        index: position.index,
        siblingCount: position.siblingCount,
        sortScope: position.sortScope,
        lockedIndices: new Set(position.lockedIndices),
      }
    }

    if (owner.kind === 'container') {
      const siblings = options.session.document.getRegionNodes(owner.containerId, owner.regionId)
      return {
        owner,
        index: siblings.findIndex(item => item.id === node.id),
        siblingCount: siblings.length,
        sortScope: false as const,
        lockedIndices: options.session.materials.getLockedIndices(siblings),
      }
    }

    const rootNodes = options.session.document.rootNodes.value
    const nodeLayout = options.session.materials.resolveLayout(node)
    const siblings = nodeLayout.sortScope === false
      ? rootNodes
      : rootNodes.filter(candidate => options.session.materials.resolveLayout(candidate).sortScope === nodeLayout.sortScope)
    return {
      owner: {
        kind: 'root' as const,
        ...(nodeLayout.sortScope === false ? {} : { sortScope: nodeLayout.sortScope }),
      },
      index: siblings.findIndex(item => item.id === node.id),
      siblingCount: siblings.length,
      sortScope: nodeLayout.sortScope,
      lockedIndices: nodeLayout.sortScope === false
        ? new Set<number>()
        : options.session.materials.getLockedIndices(siblings),
    }
  }

  return {
    session: options.session,
    schema,
    layout,
    resolveNodeActionPosition,
    componentMap: options.componentMap,
    nodeRenderer: options.nodeRenderer,
    regionRenderer: options.regionRenderer,
    extensions: options.extensions ?? {},
    eventHooks: options.eventHooks ?? createDefaultEventHooks(),
    actionInterceptors: options.actionInterceptors ?? [],
    actionRegistry: options.actionRegistry ?? createNodeActionRegistry(),
    selectedNodeId: options.session.state.selectedNodeId,
    hoveredNodeId: options.session.state.hoveredNodeId,
    dragOverNodeId: options.dragOverNodeId ?? ref(null),
    activeDestination: options.activeDestination ?? options.session.state.drag.activeDestination,
    containerDropDecision: options.containerDropDecision ?? options.session.state.drag.containerDropDecision,
    onContainerDragOver: options.onContainerDragOver,
    onContainerDragLeave: options.onContainerDragLeave,
    onContainerDrop: options.onContainerDrop,
    interactionBoundary: options.interactionBoundary,
    viewScale: options.viewScale ?? ref(1),
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
