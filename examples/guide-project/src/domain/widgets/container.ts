import type { RegionDropGeometryContext, StructuralDestination } from '@dragcraft/designer'
import { defineMaterial, DesignerRegionOutlet } from '@dragcraft/designer'
import { defineComponent, h } from 'vue'

export function resolveVerticalDropAnchor(
  context: RegionDropGeometryContext,
): StructuralDestination['position'] {
  for (const [index, element] of context.itemElements.entries()) {
    const rect = element.getBoundingClientRect()
    if (context.event.clientY < rect.top + rect.height / 2)
      return { kind: 'before', nodeId: context.nodeIds[index]! }
  }
  const lastNodeId = context.nodeIds.at(-1)
  return lastNodeId ? { kind: 'after', nodeId: lastNodeId } : { kind: 'end' }
}

export const ColumnContainerWidget = defineComponent({
  name: 'GuideColumnContainerWidget',
  props: { gap: { type: Number, default: 12 } },
  setup: props => () => h(DesignerRegionOutlet, {
    regionId: 'content',
    class: 'guide-column-container__region',
    resolveDropAnchor: resolveVerticalDropAnchor,
    style: { '--dc-internal-guide-column-gap': `${props.gap}px` },
  }),
})

export const columnContainerMaterial = defineMaterial({
  type: 'column-container',
  schema: {
    defaultProps: { gap: 12 },
    container: { regions: [{ id: 'content', maxItems: 12 }] },
  },
  authoring: { policy: { remove: 'confirmation-required' } },
  panel: { title: '分栏容器', group: 'layout', description: '由业务组件决定内容排列和插入方向' },
  inspector: { formSchema: { sections: [{ title: '布局', fields: [
    { key: 'gap', label: '间距', component: 'InputNumber', componentProps: { min: 0, max: 48 } },
  ] }] } },
  presentation: { kind: 'visual', preview: ColumnContainerWidget },
})
