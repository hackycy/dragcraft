import type { LayoutEdge, NodeOwner, ResolvedChromePresentation } from './semantic'
import type { ApplicationSurfaceOptions, PresentationContext, PresentationNode, SurfaceEntry, SurfaceProjection } from './types'
import { computed, inject, ref } from 'vue'
import { createNodeActionRegistry } from './action-registry'
import { PRESENTATION_CONTEXT_KEY } from './types'

function pushEntry(
  entries: Map<string, SurfaceEntry[]>,
  key: string,
  entry: SurfaceEntry,
): void {
  const group = entries.get(key)
  if (group)
    group.push(entry)
  else
    entries.set(key, [entry])
}

function sortEntries(entries: SurfaceEntry[]): void {
  entries.sort((a, b) => {
    const orderA = a.layout.order ?? a.arrayIndex
    const orderB = b.layout.order ?? b.arrayIndex
    return orderA === orderB ? a.arrayIndex - b.arrayIndex : orderA - orderB
  })
}

function edgeOrder(edge: LayoutEdge): number {
  return ['block-start', 'inline-start', 'inline-end', 'block-end'].indexOf(edge)
}

function createSurfaceProjection(options: ApplicationSurfaceOptions): SurfaceProjection {
  const entries: SurfaceEntry[] = []
  const regions = new Map<string, SurfaceEntry[]>()
  const chrome: SurfaceEntry[] = []
  const layers = new Map<string, SurfaceEntry[]>()
  const sortScopes = new Map<string, SurfaceEntry[]>()

  options.session.document.rootNodes.value.forEach((node, arrayIndex) => {
    const entry: SurfaceEntry = {
      node,
      arrayIndex,
      layout: options.session.materials.resolvePresentation(node),
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
    const placementA = a.layout.placement as ResolvedChromePresentation
    const placementB = b.layout.placement as ResolvedChromePresentation
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
        const placement = entry.layout.placement as ResolvedChromePresentation
        return placement.avoidContent
          ? [{ edge: placement.edge, sourceNodeId: entry.node.id, reserve: placement.reserve }]
          : []
      }),
    },
  }
}

/**
 * Creates a PresentationContext from the semantic session projection.
 * Called internally by ApplicationSurface.
 */
export function createPresentationContext(options: ApplicationSurfaceOptions): PresentationContext {
  const schema = computed(() => options.session.document.schema.value)
  const layout = computed(() => createSurfaceProjection(options))

  function resolveNodeActionPosition(node: PresentationNode, owner: NodeOwner) {
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
    const nodeLayout = options.session.materials.resolvePresentation(node)
    const siblings = nodeLayout.sortScope === false
      ? rootNodes
      : rootNodes.filter(candidate => options.session.materials.resolvePresentation(candidate).sortScope === nodeLayout.sortScope)
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
    containerShell: options.containerShell,
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
 * Injects the PresentationContext from the nearest ancestor ApplicationSurface.
 * Throws if called outside the Application Surface component tree.
 */
export function usePresentationContext(): PresentationContext {
  const ctx = inject(PRESENTATION_CONTEXT_KEY)
  if (!ctx) {
    throw new Error(
      '[dragcraft/designer] PresentationContext not found. '
      + 'Ensure this component is a descendant of ApplicationSurface.',
    )
  }
  return ctx
}
