import type { ResolvedDocument, StructuralDestination } from '@dragcraft/core'
import type { PropType, VNode } from 'vue'
import type { AuthoringAction, AuthoringResult } from '../authoring/types'
import type { MaterialCatalog } from '../materials/create-material-catalog'
import { computed, defineComponent, h, inject, nextTick, onBeforeUnmount, onMounted, provide, ref } from 'vue'
import DesignerRegionOutlet, { REGION_OUTLET_CONTEXT_KEY } from './designer-region-outlet'
import { VIEWPORT_PORTAL_OWNER_KEY } from './designer-viewport-portal'
import { GEOMETRY_REGISTRY_KEY } from './geometry-registry'
import { createMaterialPreviewContext } from './material-preview-context'
import PresentationFrame from './presentation-frame'
import RegionRecovery from './recovery/region-recovery'
import { SURFACE_RESERVATION_OWNER_KEY } from './surface-reservation'

type ResolvedNode = ResolvedDocument['root'][number]

export type PresentationOwner
  = | { readonly kind: 'page-root' }
    | {
      readonly kind: 'container-region'
      readonly containerId: string
      readonly regionId: string
    }

export default defineComponent({
  name: 'DcNodeHost',
  props: {
    node: {
      type: Object as PropType<ResolvedNode>,
      required: true,
    },
    catalog: {
      type: Object as PropType<MaterialCatalog>,
      required: true,
    },
    document: {
      type: Object as PropType<ResolvedDocument>,
      required: true,
    },
    owner: {
      type: Object as PropType<PresentationOwner>,
      required: true,
    },
    onDropAnchor: {
      type: Function as PropType<(destination: StructuralDestination) => void>,
      default: undefined,
    },
    renderNode: {
      type: Function as PropType<(node: ResolvedNode, owner: PresentationOwner) => VNode>,
      required: true,
    },
    execute: {
      type: Function as PropType<(action: AuthoringAction) => AuthoringResult>,
      default: undefined,
    },
    selected: { type: Boolean, default: false },
    hovered: { type: Boolean, default: false },
    dragging: { type: Boolean, default: false },
  },
  setup(props) {
    const geometry = inject(GEOMETRY_REGISTRY_KEY)
    const hostElement = ref<HTMLElement | null>(null)
    let unregisterGeometry: (() => void) | undefined
    const mountedOutlets = new Map<string, symbol[]>()
    const outletRevision = ref(0)
    const missingRegionIds = ref<readonly string[]>([])

    function refreshMissingRegions(): void {
      const presentation = props.catalog.getPresentation(props.node.node.type)
      if (presentation?.kind !== 'visual')
        return
      const declaredRegionIds = props.catalog.getMaterial(props.node.node.type)
        ?.schema
        ?.container
        ?.regions
        .map(region => region.id) ?? []
      const next = declaredRegionIds.filter(regionId => !mountedOutlets.get(regionId)?.length)
      if (next.join('\0') !== missingRegionIds.value.join('\0'))
        missingRegionIds.value = next
    }

    provide(REGION_OUTLET_CONTEXT_KEY, {
      get catalog() {
        return props.catalog
      },
      containerId: props.node.node.id,
      get document() {
        return props.document
      },
      onDropAnchor: props.onDropAnchor,
      registerOutlet(regionId: string) {
        const token = Symbol(regionId)
        const registrations = mountedOutlets.get(regionId) ?? []
        mountedOutlets.set(regionId, [...registrations, token])
        outletRevision.value += 1
        refreshMissingRegions()
        return {
          primary: computed(() => {
            void outletRevision.value
            return mountedOutlets.get(regionId)?.[0] === token
          }),
          unregister: () => {
            const next = (mountedOutlets.get(regionId) ?? [])
              .filter(registration => registration !== token)
            if (next.length === 0)
              mountedOutlets.delete(regionId)
            else
              mountedOutlets.set(regionId, next)
            outletRevision.value += 1
            refreshMissingRegions()
          },
        }
      },
      renderNode: props.renderNode,
    })
    provide(VIEWPORT_PORTAL_OWNER_KEY, props.owner)
    provide(SURFACE_RESERVATION_OWNER_KEY, {
      nodeId: props.node.node.id,
      owner: props.owner,
    })
    onMounted(() => {
      if (geometry && hostElement.value)
        unregisterGeometry = geometry.registerNode(props.node.node.id, hostElement.value)
      void nextTick(refreshMissingRegions)
    })
    onBeforeUnmount(() => unregisterGeometry?.())

    return () => {
      const presentation = props.catalog.getPresentation(props.node.node.type)
      const declaredRegions = props.catalog.getMaterial(props.node.node.type)
        ?.schema
        ?.container
        ?.regions ?? []
      const resolvedContainer = props.document.containersById.get(props.node.node.id)
      const rootContainerOwner = props.owner.kind === 'page-root'
        && props.node.state === 'resolved'
        && resolvedContainer !== undefined
      const usesSelectionMask = presentation !== undefined
        && !props.node.readOnly
        && !rootContainerOwner
      const content = !presentation
        ? h('div', {
            'aria-readonly': 'true',
            'data-dc-material': 'unknown',
          }, [
            h('strong', props.node.node.type),
            h('span', props.node.node.id),
            ...Array.from(resolvedContainer?.regions.values() ?? []).map((region) => {
              const owner: PresentationOwner = {
                kind: 'container-region',
                containerId: props.node.node.id,
                regionId: region.id,
              }
              return h('div', {
                'key': region.id,
                'data-dc-recovery-region': region.id,
              }, region.children.map(node => props.renderNode(node, owner)))
            }),
          ])
        : presentation.kind === 'visual'
          ? h(presentation.preview, {
              ...props.node.node.props,
              context: createMaterialPreviewContext({
                document: props.document,
                node: props.node,
                owner: props.owner,
                execute: props.execute,
                selected: props.selected,
                hovered: props.hovered,
                dragging: props.dragging,
              }),
            })
          : h('div', {
              'data-dc-material': 'headless',
            }, [
              h('span', props.node.node.type),
              ...declaredRegions.map(region => h(DesignerRegionOutlet, {
                key: region.id,
                regionId: region.id,
              })),
            ])

      const recovery = missingRegionIds.value.map((regionId) => {
        const region = props.document.containersById
          .get(props.node.node.id)
          ?.regions
          .get(regionId)
        const owner: PresentationOwner = {
          kind: 'container-region',
          containerId: props.node.node.id,
          regionId,
        }
        return h(RegionRecovery, {
          key: regionId,
          containerId: props.node.node.id,
          regionId,
        }, {
          default: () => region?.children.map(node => props.renderNode(node, owner)) ?? [],
        })
      })

      const selectionMask = usesSelectionMask
        ? h('div', {
            class: 'dc-internal-node-host__selection-mask',
            onClick: (event: MouseEvent) => {
              event.stopPropagation()
              props.execute?.({ type: 'select-node', nodeId: props.node.node.id })
            },
          })
        : null

      const host = h('div', {
        'ref': hostElement,
        'aria-readonly': !presentation || props.node.readOnly ? 'true' : undefined,
        'aria-selected': props.selected ? 'true' : undefined,
        'data-dc-component': 'node-host',
        'data-dc-node-id': props.node.node.id,
        'data-dc-node-type': props.node.node.type,
        'data-dc-state': [
          props.selected ? 'selected' : null,
          props.hovered ? 'hovered' : null,
          props.dragging ? 'dragging' : null,
        ].filter(Boolean).join(' ') || undefined,
        'style': props.node.node.style,
        'onClick': (event: MouseEvent) => {
          if (event.target !== event.currentTarget)
            return
          event.stopPropagation()
          props.execute?.({ type: 'select-node', nodeId: props.node.node.id })
        },
        'onMouseenter': () => {
          props.execute?.({ type: 'hover-node', nodeId: props.node.node.id })
        },
        'onMouseleave': () => {
          props.execute?.({ type: 'hover-node', nodeId: null })
        },
      }, [content, selectionMask, ...recovery])

      return presentation?.kind === 'visual' && presentation.frame
        ? h(PresentationFrame, {
            frame: presentation.frame,
            nodeId: props.node.node.id,
          }, { default: () => host })
        : host
    }
  },
})
