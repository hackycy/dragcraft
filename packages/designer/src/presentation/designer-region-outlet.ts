import type { ResolvedDocument, StructuralDestination } from '@dragcraft/core'
import type { Component, InjectionKey, PropType, Ref, VNode } from 'vue'
import type { MaterialCatalog } from '../materials/create-material-catalog'
import type { PresentationOwner } from './node-host'
import { defineComponent, h, inject, mergeProps, onBeforeUnmount, watch } from 'vue'
import { GEOMETRY_REGISTRY_KEY } from './geometry-registry'
import { PRESENTATION_DIAGNOSTIC_REGISTRY_KEY } from './presentation-diagnostics'

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
    const regionContext = context
    const registration = regionContext.registerOutlet(props.regionId)
    const diagnostics = inject(PRESENTATION_DIAGNOSTIC_REGISTRY_KEY)
    const geometry = inject(GEOMETRY_REGISTRY_KEY)
    let unregisterDiagnostic: (() => void) | undefined
    let outletElement: HTMLElement | null = null
    let unregisterGeometry: (() => void) | undefined
    function syncGeometry(): void {
      unregisterGeometry?.()
      unregisterGeometry = registration.primary.value && outletElement
        ? geometry?.registerRegion(regionContext.containerId, props.regionId, outletElement)
        : undefined
    }
    function setOutletElement(value: unknown): void {
      const direct = value instanceof HTMLElement ? value : null
      const componentElement = value && typeof value === 'object'
        ? (value as { readonly $el?: unknown }).$el
        : null
      const next = direct ?? (componentElement instanceof HTMLElement ? componentElement : null)
      if (outletElement === next)
        return
      outletElement = next
      syncGeometry()
    }
    const stopWatchingPrimary = watch(registration.primary, (primary) => {
      unregisterDiagnostic?.()
      unregisterDiagnostic = primary
        ? undefined
        : diagnostics?.register({
            code: 'REGION_OUTLET_DUPLICATE',
            containerId: regionContext.containerId,
            regionId: props.regionId,
          })
      syncGeometry()
    }, { immediate: true })
    onBeforeUnmount(() => {
      stopWatchingPrimary()
      unregisterDiagnostic?.()
      unregisterGeometry?.()
      registration.unregister()
    })

    function handleDragOver(event: DragEvent): void {
      const regionElement = event.currentTarget as HTMLElement
      event.preventDefault()
      event.stopPropagation()
      const region = regionContext.document.containersById
        .get(regionContext.containerId)
        ?.regions
        .get(props.regionId)
      const elementsByNodeId = new Map(
        Array.from(regionElement.querySelectorAll<HTMLElement>('[data-dc-component="node-host"]'))
          .flatMap(element => element.dataset.dcNodeId
            ? [[element.dataset.dcNodeId, element] as const]
            : []),
      )
      const orderedItems = region?.children.flatMap(({ node }) => {
        const element = elementsByNodeId.get(node.id)
        return element ? [{ element, nodeId: node.id }] : []
      }) ?? []
      const itemElements = orderedItems.map(item => item.element)
      const nodeIds = orderedItems.map(item => item.nodeId)
      const resolveDropAnchor = props.resolveDropAnchor ?? resolveDefaultDropAnchor
      const position = resolveDropAnchor({ event, itemElements, nodeIds, regionElement })
      if (!position)
        return
      regionContext.onDropAnchor?.({
        owner: {
          kind: 'container-region',
          containerId: regionContext.containerId,
          regionId: props.regionId,
        },
        position,
      })
    }

    return () => {
      const region = regionContext.document.containersById
        .get(regionContext.containerId)
        ?.regions
        .get(props.regionId)
      const owner: PresentationOwner = {
        kind: 'container-region',
        containerId: regionContext.containerId,
        regionId: props.regionId,
      }

      if (!registration.primary.value) {
        return h(props.as, mergeProps(attrs, {
          'data-dc-component': 'designer-region-outlet',
          'data-dc-container-id': regionContext.containerId,
          'data-dc-presentation-diagnostic': 'REGION_OUTLET_DUPLICATE',
          'data-dc-region-outlet': props.regionId,
        }))
      }

      return h(props.as, mergeProps(attrs, {
        'ref': setOutletElement,
        'data-dc-component': 'designer-region-outlet',
        'data-dc-container-id': regionContext.containerId,
        'data-dc-region-outlet': props.regionId,
        'onDragover': handleDragOver,
      }), region?.children.map(node => regionContext.renderNode(node, owner)) ?? [])
    }
  },
})
