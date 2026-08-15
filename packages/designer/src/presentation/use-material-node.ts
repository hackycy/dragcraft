import type { Component, ComputedRef } from 'vue'
import type { MaterialDefinition } from '../materials/types'
import type { ResolvedPresentationLayout } from './semantic'
import type { NodeInteractionState, PresentationContext, PresentationNode } from './types'
import { computed } from 'vue'
import { useNodeState } from './use-node-state'

export interface UseMaterialNodeReturn {
  /** Reactive interaction state (selected, hovered, drag-over) */
  state: NodeInteractionState
  /** The resolved Vue component for this widget type, or undefined */
  resolvedComponent: ComputedRef<Component | undefined>
  /** The registered material definition, if available. */
  material: ComputedRef<Readonly<MaterialDefinition> | undefined>
  /** Whether to use the Designer-owned blocking mask. */
  useMask: ComputedRef<boolean>
  /** Whether this node is selectable. */
  selectable: ComputedRef<boolean>
  /** Whether this node is draggable. */
  draggable: ComputedRef<boolean>
  /** Whether this node is sortable. */
  sortable: ComputedRef<boolean>
  /** Whether this node belongs to a sortable scope */
  inSortScope: ComputedRef<boolean>
  /** Whether this node is the active drag source */
  isDragging: ComputedRef<boolean>
  /** Whether this node is visible (from layout.visible, default true) */
  visible: ComputedRef<boolean>
  /** Resolved open layout metadata */
  layout: ComputedRef<ResolvedPresentationLayout>
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
 * This is the primary composable for building custom NodeHost behavior.
 *
 * @param getNode - Getter for the current schema node
 * @param ctx - The Presentation context (from usePresentationContext)
 */
export function useMaterialNode(
  getNode: () => PresentationNode,
  ctx: PresentationContext,
): UseMaterialNodeReturn {
  const { session } = ctx

  const state = useNodeState(() => getNode().id, ctx)

  const material = computed<Readonly<MaterialDefinition> | undefined>(() =>
    session.materials.get(getNode().type),
  )
  const resolvedComponent = computed(() => {
    const presentation = material.value?.presentation
    return presentation?.kind === 'visual' ? presentation.preview : undefined
  })
  const layout = computed(() => session.materials.resolvePresentation(getNode()))
  const inSortScope = computed(() => layout.value.sortScope !== false)
  const isDragging = computed(() => session.state.dragTarget.value?.sourceNodeId === getNode().id)
  const visible = computed(() => layout.value.visible)
  const useMask = computed(() => true)

  const selectable = computed(() =>
    session.materials.resolveCapability(getNode(), 'selectable'),
  )

  const sortable = computed(() =>
    session.materials.resolveCapability(getNode(), 'sortable'),
  )

  const draggable = computed(() => {
    if (!inSortScope.value || !sortable.value)
      return false
    return session.materials.resolveCapability(getNode(), 'draggable')
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
      'dc-node--dragging': isDragging.value,
      'dc-node--hidden': !visible.value,
    },
    state.interactionClasses.value,
  ])

  const handleSelect = (e: MouseEvent) => {
    if (!selectable.value)
      return
    e.stopPropagation()
    session.execute({ type: 'selection.set', nodeId: getNode().id })
  }

  const handleMouseEnter = () => {
    const nodeId = getNode().id
    if (ctx.hoveredNodeId.value === nodeId)
      return
    session.execute({ type: 'hover.set', nodeId })
  }

  const handleMouseLeave = () => {
    if (ctx.hoveredNodeId.value !== getNode().id)
      return
    session.execute({ type: 'hover.set', nodeId: null })
  }

  return {
    state,
    resolvedComponent,
    material,
    useMask,
    selectable,
    draggable,
    sortable,
    inSortScope,
    isDragging,
    visible,
    layout,
    wrapperClasses,
    handleSelect,
    handleMouseEnter,
    handleMouseLeave,
  }
}
