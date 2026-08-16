import type { Component, PropType, VNode } from 'vue'
import type { ResolveContainerDropIndex } from './types'
import { computed, defineComponent, h, mergeProps, onBeforeUnmount } from 'vue'
import { useContainerRuntime } from './container-runtime'
import { usePresentationContext } from './context'
import DefaultContainerRecovery from './default-container-recovery'
import DefaultDropIndicator from './default-drop-indicator'
import DefaultEmptyState from './default-empty-state'
import DefaultForbiddenOverlay from './default-forbidden-overlay'
import NodeHost from './node-host'

function isNestedRegionEvent(event: DragEvent, regionElement: HTMLElement): boolean {
  return event.target instanceof Element
    && event.target.closest('[data-dc-container-region]') !== regionElement
}

export default defineComponent({
  name: 'DcContainerRegionOutlet',
  inheritAttrs: false,
  props: {
    regionId: { type: String, required: true },
    as: { type: [String, Object] as PropType<string | Component>, default: 'div' },
    resolveDropIndex: {
      type: Function as PropType<ResolveContainerDropIndex>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const ctx = usePresentationContext()
    const runtime = useContainerRuntime()
    const registration = runtime.registerOutlet(props.regionId)
    onBeforeUnmount(registration.unregister)
    const outletState = computed(() => runtime.getOutletState(props.regionId, registration.id))
    const isPrimaryOutlet = computed(() => runtime.isPrimaryOutlet(props.regionId, registration.id))
    const definition = computed(() =>
      runtime.regionDefinitions.value.find(item => item.id === props.regionId),
    )
    const regionNodes = computed(() => runtime.getRegionNodes(props.regionId))
    const isEmpty = computed(() => regionNodes.value.length === 0)
    const isActive = computed(() => {
      const destination = ctx.activeDestination.value
      return destination?.kind === 'container'
        && destination.containerId === runtime.nodeId.value
        && destination.regionId === props.regionId
    })
    const isForbidden = computed(() =>
      isActive.value && ctx.containerDropDecision.value?.allowed === false,
    )
    const isHeadlessMaterialDrag = computed(() => {
      const target = ctx.session.state.dragTarget.value
      return target?.sourceNodeId === null
        && target.widgetType !== null
        && ctx.session.materials.get(target.widgetType)?.presentation.kind === 'headless'
    })
    const showPlacementFeedback = computed(() =>
      isActive.value && !isHeadlessMaterialDrag.value,
    )

    function handleDragOver(event: DragEvent): void {
      const regionElement = event.currentTarget as HTMLElement
      if (isNestedRegionEvent(event, regionElement))
        return
      event.preventDefault()
      event.stopPropagation()
      const resolver = props.resolveDropIndex
      if (!resolver) {
        ctx.onContainerDragOver?.({
          event,
          containerId: runtime.nodeId.value,
          regionId: props.regionId,
          allowed: false,
          code: 'CONTAINER_DROP_ADAPTER_MISSING',
        })
        return
      }
      try {
        const nodes = regionNodes.value
        const index = resolver({
          event,
          regionElement,
          itemElements: Array.from(regionElement.querySelectorAll<HTMLElement>(':scope > [data-node-id]')),
          nodes,
        })
        if (index === null) {
          ctx.onContainerDragOver?.({
            event,
            containerId: runtime.nodeId.value,
            regionId: props.regionId,
            allowed: false,
            code: 'CONTAINER_DROP_NO_TARGET',
          })
          return
        }
        if (!Number.isInteger(index) || index < 0 || index > nodes.length) {
          ctx.onContainerDragOver?.({
            event,
            containerId: runtime.nodeId.value,
            regionId: props.regionId,
            allowed: false,
            code: 'CONTAINER_DROP_ADAPTER_INVALID',
          })
          return
        }
        ctx.onContainerDragOver?.({
          event,
          destination: { kind: 'container', containerId: runtime.nodeId.value, regionId: props.regionId, index },
        })
      }
      catch (error) {
        ctx.onContainerDragOver?.({
          event,
          containerId: runtime.nodeId.value,
          regionId: props.regionId,
          allowed: false,
          code: 'CONTAINER_DROP_ADAPTER_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }

    function handleDragLeave(event: DragEvent): void {
      const regionElement = event.currentTarget as HTMLElement
      if (isNestedRegionEvent(event, regionElement))
        return
      event.stopPropagation()
      ctx.onContainerDragLeave?.(event)
    }

    function handleDrop(event: DragEvent): void {
      const regionElement = event.currentTarget as HTMLElement
      if (isNestedRegionEvent(event, regionElement))
        return
      event.preventDefault()
      event.stopPropagation()
      ctx.onContainerDrop?.(event)
    }

    return () => {
      if (outletState.value !== 'valid') {
        if (outletState.value === 'duplicate' && !isPrimaryOutlet.value) {
          return h('div', {
            'class': 'dc-container-region dc-container-region--diagnostic',
            'data-dc-component': 'container-region-diagnostic',
            'data-dc-diagnostic-code': 'CONTAINER_REGION_DUPLICATE_OUTLET',
            'data-dc-container-id': runtime.nodeId.value,
            'data-dc-container-region': props.regionId,
            'aria-hidden': 'true',
          })
        }
        return h(DefaultContainerRecovery, {
          containerId: runtime.nodeId.value,
          regionIds: [props.regionId],
          code: outletState.value === 'duplicate'
            ? 'CONTAINER_REGION_DUPLICATE_OUTLET'
            : 'CONTAINER_REGION_UNKNOWN_OUTLET',
        })
      }
      const children: VNode[] = regionNodes.value.map(node => h(NodeHost, {
        key: node.id,
        node,
        owner: {
          kind: 'container',
          containerId: runtime.nodeId.value,
          regionId: props.regionId,
        },
      }))
      if (isEmpty.value && !isForbidden.value)
        children.push(h(DefaultEmptyState, { isDragOver: showPlacementFeedback.value }))

      if (showPlacementFeedback.value && !isForbidden.value) {
        const index = ctx.activeDestination.value?.index
        if (Number.isInteger(index) && index != null && index >= 0 && index <= regionNodes.value.length)
          children.splice(index, 0, h(DefaultDropIndicator, { key: '__container-drop-indicator__' }))
      }

      if (isForbidden.value) {
        children.push(h(DefaultForbiddenOverlay, {
          widgetType: ctx.session.state.dragTarget.value?.widgetType ?? '',
          reason: ctx.containerDropDecision.value,
        }))
      }

      const themeState = isForbidden.value
        ? 'forbidden'
        : showPlacementFeedback.value
          ? 'active'
          : isEmpty.value
            ? 'empty'
            : undefined

      return h(props.as, mergeProps(attrs, {
        'class': [
          'dc-container-region',
          {
            'dc-container-region--empty': isEmpty.value,
            'dc-container-region--active': showPlacementFeedback.value,
            'dc-container-region--forbidden': isForbidden.value,
          },
        ],
        'data-dc-component': 'container-region',
        'data-dc-state': themeState,
        'data-dc-container-id': runtime.nodeId.value,
        'data-dc-container-region': props.regionId,
        'role': attrs.role ?? 'group',
        'aria-label': attrs['aria-label'] ?? definition.value?.title ?? props.regionId,
        'aria-disabled': isForbidden.value ? 'true' : undefined,
        'onDragover': handleDragOver,
        'onDragleave': handleDragLeave,
        'onDrop': handleDrop,
      }), children)
    }
  },
})
