import type { InstanceBehaviorContext, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { Component, ComputedRef } from 'vue'
import type { NodeInteractionState, RendererContext } from '../types'
import { computed } from 'vue'
import { fireAfterHook, resolveBeforeHook } from '../event-hooks'
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
  /** Whether this node is sortable / position-locked (from meta.sortable, default true) */
  sortable: ComputedRef<boolean>
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

  function readInstanceCtx(): InstanceBehaviorContext {
    // Read schema.value to establish reactive dependency, then return raw for predicate evaluation
    void engine.store.schema.value
    return { node: getNode(), schema: engine.store.getRawSchema() }
  }

  const useMask = computed(() => {
    const field = meta.value?.mask
    if (typeof field !== 'function')
      return field !== false
    return field(readInstanceCtx())
  })

  const selectable = computed(() => {
    const field = meta.value?.selectable
    if (typeof field !== 'function')
      return field !== false
    return field(readInstanceCtx())
  })

  const sortable = computed(() => {
    const field = meta.value?.sortable
    if (typeof field !== 'function')
      return field !== false
    return field(readInstanceCtx())
  })

  const draggable = computed(() => {
    // sortable: false implies not draggable
    if (!sortable.value)
      return false
    const field = meta.value?.draggable
    if (typeof field !== 'function')
      return field !== false
    return field(readInstanceCtx())
  })

  const wrapperClasses = computed<Array<string | Record<string, boolean>>>(() => [
    'dc-node',
    'dc-node--widget',
    {
      'dc-node--masked': useMask.value,
      'dc-node--unmasked': !useMask.value,
      'dc-node--non-selectable': !selectable.value,
      'dc-node--locked': !sortable.value,
    },
    state.interactionClasses.value,
  ])

  // Guard against concurrent async selections
  let selectPending = false

  const handleSelect = (e: MouseEvent) => {
    if (!selectable.value || selectPending)
      return
    e.stopPropagation()

    const nodeId = getNode().id
    const beforeHook = eventHooks.onBeforeSelect

    if (beforeHook) {
      const hookResult = beforeHook({ nodeId, event: e })

      // Fast path: sync hook returned a non-promise value
      if (typeof hookResult === 'boolean' || hookResult === undefined) {
        if (hookResult === false)
          return
        engine.store.selectNode(nodeId)
        fireAfterHook(eventHooks.onAfterSelect, { nodeId })
        return
      }

      // Async path: hook returned a Promise
      selectPending = true
      resolveBeforeHook(hookResult).then((allowed) => {
        selectPending = false
        if (!allowed)
          return
        engine.store.selectNode(nodeId)
        fireAfterHook(eventHooks.onAfterSelect, { nodeId })
      })
      return
    }

    // No before hook at all
    engine.store.selectNode(nodeId)
    fireAfterHook(eventHooks.onAfterSelect, { nodeId })
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
    sortable,
    wrapperClasses,
    handleSelect,
    handleMouseEnter,
    handleMouseLeave,
  }
}
