import type { ResolvedDocument, StructuralDestination } from '@dragcraft/core'
import type { PropType, VNode } from 'vue'
import type { MaterialCatalog } from '../materials/create-material-catalog'
import { computed, defineComponent, h, nextTick, onMounted, provide, ref } from 'vue'
import DesignerRegionOutlet, { REGION_OUTLET_CONTEXT_KEY } from './designer-region-outlet'
import { VIEWPORT_PORTAL_OWNER_KEY } from './designer-viewport-portal'
import PresentationFrame from './presentation-frame'
import RegionRecovery from './recovery/region-recovery'

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
  },
  setup(props) {
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
      catalog: props.catalog,
      containerId: props.node.node.id,
      document: props.document,
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
    onMounted(() => nextTick(refreshMissingRegions))

    return () => {
      const presentation = props.catalog.getPresentation(props.node.node.type)
      const declaredRegions = props.catalog.getMaterial(props.node.node.type)
        ?.schema
        ?.container
        ?.regions ?? []
      const resolvedContainer = props.document.containersById.get(props.node.node.id)
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
          ? h(presentation.preview, { ...props.node.node.props })
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

      const host = h('div', {
        'aria-readonly': !presentation || props.node.readOnly ? 'true' : undefined,
        'data-dc-component': 'node-host',
        'data-dc-node-id': props.node.node.id,
        'data-dc-node-type': props.node.node.type,
      }, [content, ...recovery])

      return presentation?.kind === 'visual' && presentation.frame
        ? h(PresentationFrame, {
            frame: presentation.frame,
            nodeId: props.node.node.id,
          }, { default: () => host })
        : host
    }
  },
})
