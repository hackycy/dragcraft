import type { SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { Component, ComputedRef } from 'vue'
import type { NodeInteractionState, RendererContext } from '../types'
import { computed } from 'vue'
import { useNodeState } from './useNodeState'

export interface UseWidgetNodeReturn {
  /** Reactive interaction state (selected, hovered, drag-over) */
  state: NodeInteractionState
  /** The resolved Vue component for this widget type, or undefined */
  resolvedComponent: ComputedRef<Component | undefined>
  /** The widget meta from the registry */
  meta: ComputedRef<WidgetMeta | undefined>
  /** Whether to use mask (from meta.mask, default true) */
  useMask: ComputedRef<boolean>
  /** Whether this node is selectable (from meta.selectable, default true) */
  selectable: ComputedRef<boolean>
  /** Whether this node is draggable (from meta.draggable, default true) */
  draggable: ComputedRef<boolean>
  /** CSS classes for the node wrapper */
  wrapperClasses: ComputedRef<Array<string | Record<string, boolean>>>
  /** Handle select event */
  handleSelect: (e: MouseEvent) => void
  /** Handle mouse enter */
  handleMouseEnter: () => void
  /** Handle mouse leave */
  handleMouseLeave: () => void
}

/**
 * Composable that extracts all widget node state and event handling logic.
 * This is the primary composable for building custom node renderers.
 *
 * @param getNode - Getter for the current schema node
 * @param ctx - The renderer context (from useRendererContext)
 */
export function useWidgetNode(
  getNode: () => SchemaNode,
  ctx: RendererContext,
): UseWidgetNodeReturn {
  const { engine, componentMap, eventHooks } = ctx

  const state = useNodeState(() => getNode().id, ctx)

  const meta = computed(() => engine.registry.getWidget(getNode().type))
  const resolvedComponent = computed(() => componentMap[getNode().type])
  const useMask = computed(() => meta.value?.mask !== false)
  const selectable = computed(() => meta.value?.selectable !== false)
  const draggable = computed(() => meta.value?.draggable !== false)

  const wrapperClasses = computed<Array<string | Record<string, boolean>>>(() => [
    'dc-node',
    'dc-node--widget',
    {
      'dc-node--masked': useMask.value,
      'dc-node--unmasked': !useMask.value,
      'dc-node--non-selectable': !selectable.value,
    },
    state.interactionClasses.value,
  ])

  const handleSelect = (e: MouseEvent) => {
    if (!selectable.value)
      return
    e.stopPropagation()

    const nodeId = getNode().id
    if (eventHooks.onBeforeSelect) {
      const result = eventHooks.onBeforeSelect({ nodeId, event: e })
      if (result === false)
        return
    }
    engine.store.selectNode(nodeId)
    eventHooks.onAfterSelect?.({ nodeId })
  }

  const handleMouseEnter = () => {
    const nodeId = getNode().id
    engine.store.hoverNode(nodeId)
    eventHooks.onHoverChange?.({ nodeId })
  }

  const handleMouseLeave = () => {
    engine.store.hoverNode(null)
    eventHooks.onHoverChange?.({ nodeId: null })
  }

  return {
    state,
    resolvedComponent,
    meta,
    useMask,
    selectable,
    draggable,
    wrapperClasses,
    handleSelect,
    handleMouseEnter,
    handleMouseLeave,
  }
}
