import type { MaterialDefinition, RegionDropGeometryContext, StructuralDestination } from '@dragcraft/designer'
import type { PropType } from 'vue'
import { defineMaterial, DesignerRegionOutlet } from '@dragcraft/designer'
import { defineComponent, h } from 'vue'
import { localizedSection } from './localized-section'

type FlexDirection = 'row' | 'column'
type FlexAlign = 'stretch' | 'flex-start' | 'center' | 'flex-end'

export function resolveLinearDropAnchor(
  context: RegionDropGeometryContext,
  axis: 'x' | 'y',
): StructuralDestination['position'] {
  const pointer = axis === 'x' ? context.event.clientX : context.event.clientY
  for (const [index, element] of context.itemElements.entries()) {
    const rect = element.getBoundingClientRect()
    const midpoint = axis === 'x'
      ? rect.left + rect.width / 2
      : rect.top + rect.height / 2
    if (pointer < midpoint)
      return { kind: 'before', nodeId: context.nodeIds[index]! }
  }
  const lastNodeId = context.nodeIds.at(-1)
  return lastNodeId ? { kind: 'after', nodeId: lastNodeId } : { kind: 'end' }
}

export const FlexContainer = defineComponent({
  name: 'PlaygroundFlexContainer',
  props: {
    direction: { type: String as PropType<FlexDirection>, default: 'column' },
    wrap: { type: Boolean, default: false },
    gap: { type: Number, default: 12 },
    align: { type: String as PropType<FlexAlign>, default: 'stretch' },
  },
  setup: props => () => h(DesignerRegionOutlet, {
    regionId: 'content',
    resolveDropAnchor: (context: RegionDropGeometryContext) => resolveLinearDropAnchor(
      context,
      props.direction === 'row' ? 'x' : 'y',
    ),
    class: 'pg-container-flex',
    style: {
      '--dc-internal-playground-container-direction': props.direction,
      '--dc-internal-playground-container-wrap': props.wrap ? 'wrap' : 'nowrap',
      '--dc-internal-playground-container-gap': `${props.gap}px`,
      '--dc-internal-playground-container-align': props.align,
    },
  }),
})

function region(regionId: string, className: string) {
  return h(DesignerRegionOutlet, {
    regionId,
    class: className,
    resolveDropAnchor: (context: RegionDropGeometryContext) => resolveLinearDropAnchor(context, 'y'),
  })
}

export const SplitContainer = defineComponent({
  name: 'PlaygroundSplitContainer',
  props: {
    gap: { type: Number, default: 12 },
    primarySize: { type: String, default: '44%' },
  },
  setup: props => () => h('div', {
    class: 'pg-split pg-split--top-one-bottom-two',
    style: {
      '--dc-internal-playground-split-gap': `${props.gap}px`,
      '--dc-internal-playground-split-primary-size': props.primarySize,
    },
  }, [
    region('top', 'pg-split__top'),
    h('div', { class: 'pg-split__bottom' }, [
      region('bottomLeft', 'pg-split__bottom-left'),
      region('bottomRight', 'pg-split__bottom-right'),
    ]),
  ]),
})

export const containerMaterials: readonly MaterialDefinition[] = [
  defineMaterial({
    type: 'flex-container',
    schema: {
      defaultProps: { direction: 'column', wrap: false, gap: 12, align: 'stretch' },
      container: { regions: [{ id: 'content', maxItems: 20 }] },
    },
    authoring: { policy: { remove: 'confirmation-required' } },
    panel: { title: 'Flex 容器', titleKey: 'widget.flex-container.title', group: 'layout', icon: '容' },
    inspector: { formSchema: { sections: [localizedSection('flex-container', 'layout', { title: '布局', fields: [
      { key: 'direction', label: '方向', component: 'Select', componentProps: { options: [{ label: '横向', value: 'row' }, { label: '纵向', value: 'column' }] } },
      { key: 'wrap', label: '自动换行', component: 'Switch' },
      { key: 'gap', label: '间距', component: 'InputNumber' },
      { key: 'align', label: '对齐', component: 'Select', componentProps: { options: [{ label: '拉伸', value: 'stretch' }, { label: '起点', value: 'flex-start' }, { label: '居中', value: 'center' }, { label: '终点', value: 'flex-end' }] } },
    ] })] } },
    presentation: { kind: 'visual', preview: FlexContainer },
  }),
  defineMaterial({
    type: 'split-container',
    schema: {
      defaultProps: { gap: 8, primarySize: '44%' },
      container: { regions: [
        { id: 'top', maxItems: 8 },
        { id: 'bottomLeft', maxItems: 8 },
        { id: 'bottomRight', maxItems: 8 },
      ] },
    },
    authoring: { policy: { remove: 'confirmation-required' } },
    panel: { title: '异形容器', titleKey: 'widget.split-container.title', group: 'layout', icon: '分' },
    inspector: { formSchema: { sections: [localizedSection('split-container', 'layout', { title: '布局', fields: [
      { key: 'gap', label: '间距', component: 'InputNumber' },
      { key: 'primarySize', label: '主区域尺寸', component: 'Input' },
    ] })] } },
    presentation: { kind: 'visual', preview: SplitContainer },
  }),
]
