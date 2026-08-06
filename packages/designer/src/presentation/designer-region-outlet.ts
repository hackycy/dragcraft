import type { ResolvedDocument, StructuralDestination } from '@dragcraft/core'
import type { Component, InjectionKey, PropType, Ref, VNode } from 'vue'
import type { MaterialCatalog } from '../materials/create-material-catalog'
import type { PresentationOwner } from './node-host'
import { defineComponent, h, inject, mergeProps, onBeforeUnmount } from 'vue'

type ResolvedNode = ResolvedDocument['root'][number]

export interface RegionOutletContext {
  readonly catalog: MaterialCatalog
  readonly containerId: string
  readonly document: ResolvedDocument
  readonly onDropAnchor?: (destination: StructuralDestination) => void
  readonly registerOutlet: (regionId: string) => {
    readonly primary: Readonly<Ref<boolean>>
    readonly unregister: () => void
  }
  readonly renderNode: (node: ResolvedNode, owner: PresentationOwner) => VNode
}

export interface RegionDropGeometryContext {
  readonly event: DragEvent
  readonly itemElements: readonly HTMLElement[]
  readonly nodeIds: readonly string[]
  readonly regionElement: HTMLElement
}

export type RegionDropAnchorResolver = (
  context: RegionDropGeometryContext,
) => StructuralDestination['position'] | null

function resolveDefaultDropAnchor(
  context: RegionDropGeometryContext,
): StructuralDestination['position'] {
  for (let index = 0; index < context.itemElements.length; index += 1) {
    const element = context.itemElements[index]!
    const rect = element.getBoundingClientRect()
    if (context.event.clientY < rect.top + rect.height / 2) {
      return { kind: 'before', nodeId: context.nodeIds[index]! }
    }
  }
  const lastNodeId = context.nodeIds.at(-1)
  return lastNodeId
    ? { kind: 'after', nodeId: lastNodeId }
    : { kind: 'end' }
}

export const REGION_OUTLET_CONTEXT_KEY: InjectionKey<RegionOutletContext>
  = Symbol('dc-region-outlet-context')

export default defineComponent({
  name: 'DcDesignerRegionOutlet',
  inheritAttrs: false,
  props: {
    regionId: { type: String, required: true },
    as: { type: [String, Object] as PropType<string | Component>, default: 'div' },
    resolveDropAnchor: {
      type: Function as PropType<RegionDropAnchorResolver>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const context = inject(REGION_OUTLET_CONTEXT_KEY)
    if (!context)
      throw new Error('DesignerRegionOutlet must be rendered inside a container NodeHost')
    const registration = context.registerOutlet(props.regionId)
    onBeforeUnmount(registration.unregister)

    function handleDragOver(event: DragEvent): void {
      const regionElement = event.currentTarget as HTMLElement
      event.preventDefault()
      event.stopPropagation()
      const itemElements = Array.from(
        regionElement.querySelectorAll<HTMLElement>(':scope > [data-dc-component="node-host"]'),
      )
      const nodeIds = itemElements
        .map(element => element.dataset.dcNodeId)
        .filter((nodeId): nodeId is string => nodeId !== undefined)
      const resolveDropAnchor = props.resolveDropAnchor ?? resolveDefaultDropAnchor
      const position = resolveDropAnchor({ event, itemElements, nodeIds, regionElement })
      if (!position)
        return
      context.onDropAnchor?.({
        owner: {
          kind: 'container-region',
          containerId: context.containerId,
          regionId: props.regionId,
        },
        position,
      })
    }

    return () => {
      const region = context.document.containersById
        .get(context.containerId)
        ?.regions
        .get(props.regionId)
      const owner: PresentationOwner = {
        kind: 'container-region',
        containerId: context.containerId,
        regionId: props.regionId,
      }

      if (!registration.primary.value) {
        return h(props.as, mergeProps(attrs, {
          'data-dc-component': 'designer-region-outlet',
          'data-dc-container-id': context.containerId,
          'data-dc-presentation-diagnostic': 'REGION_OUTLET_DUPLICATE',
          'data-dc-region-outlet': props.regionId,
        }))
      }

      return h(props.as, mergeProps(attrs, {
        'data-dc-component': 'designer-region-outlet',
        'data-dc-container-id': context.containerId,
        'data-dc-region-outlet': props.regionId,
        'onDragover': handleDragOver,
      }), region?.children.map(node => context.renderNode(node, owner)) ?? [])
    }
  },
})
