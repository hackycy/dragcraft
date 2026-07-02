import type { BehaviorPredicate, InstanceBehaviorContext, ResolvedNodeLayout, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { Component, ComputedRef } from 'vue'
import type { NodeInteractionState, RendererContext } from '../types'
import { resolveNodeLayout } from '@dragcraft/core'
import { computed } from 'vue'
import { runBeforeAfterHook } from '../event-hooks'
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
  /** Whether this node belongs to a sortable scope */
  inSortScope: ComputedRef<boolean>
  /** Whether this node is visible (from layout.visible, default true) */
  visible: ComputedRef<boolean>
  /** Resolved open layout metadata */
  layout: ComputedRef<ResolvedNodeLayout>
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
  const layout = computed(() => resolveNodeLayout(getNode(), engine.registry, engine.store.getRawSchema()))
  const inSortScope = computed(() => layout.value.sortScope !== false)
  const visible = computed(() => layout.value.visible)

  function readInstanceCtx(): InstanceBehaviorContext {
    // Read schema.value to establish reactive dependency, then return raw for predicate evaluation
    void engine.store.schema.value
    return { node: getNode(), schema: engine.store.getRawSchema() }
  }

  function resolveMetaBehavior(
    field: BehaviorPredicate<InstanceBehaviorContext> | undefined,
  ): boolean {
    if (typeof field !== 'function')
      return field !== false
    return field(readInstanceCtx())
  }

  const useMask = computed(() => resolveMetaBehavior(meta.value?.mask))

  const selectable = computed(() => resolveMetaBehavior(meta.value?.selectable))

  const sortable = computed(() => resolveMetaBehavior(meta.value?.sortable))

  const draggable = computed(() => {
    if (!inSortScope.value || !sortable.value)
      return false
    return resolveMetaBehavior(meta.value?.draggable)
  })

  const wrapperClasses = computed<Array<string | Record<string, boolean>>>(() => [
    'dc-node',
    'dc-node--widget',
    {
      'dc-node--masked': useMask.value,
      'dc-node--unmasked': !useMask.value,
      'dc-node--non-selectable': !selectable.value,
      'dc-node--locked': inSortScope.value && !sortable.value,
      'dc-node--unsorted': !inSortScope.value,
      'dc-node--hidden': !visible.value,
    },
    state.interactionClasses.value,
  ])

  // Guard against concurrent async selections
  const selectPending = { value: false }

  const handleSelect = (e: MouseEvent) => {
    if (!selectable.value || selectPending.value)
      return
    e.stopPropagation()

    const nodeId = getNode().id
    runBeforeAfterHook(
      eventHooks.onBeforeSelect,
      { nodeId, event: e },
      () => engine.store.selectNode(nodeId),
      eventHooks.onAfterSelect
        ? () => eventHooks.onAfterSelect?.({ nodeId })
        : undefined,
      selectPending,
    )
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
    inSortScope,
    visible,
    layout,
    wrapperClasses,
    handleSelect,
    handleMouseEnter,
    handleMouseLeave,
  }
}
