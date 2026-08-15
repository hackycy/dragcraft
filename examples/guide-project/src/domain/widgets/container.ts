import { DesignerRegionOutlet } from '@dragcraft/designer'
import { defineComponent, h } from 'vue'

export function resolveVerticalDropIndex(ctx: any): number {
  for (const [index, element] of ctx.itemElements.entries()) {
    const rect = element.getBoundingClientRect()
    if (ctx.event.clientY < rect.top + rect.height / 2)
      return index
  }
  return ctx.itemElements.length
}

function outlet(regionId: string) {
  return h(DesignerRegionOutlet, {
    regionId,
    class: 'guide-column-container__region',
    resolveDropIndex: resolveVerticalDropIndex,
  })
}

export const ColumnContainerWidget = defineComponent({
  name: 'GuideColumnContainerWidget',
  props: {
    gap: { type: Number, default: 12 },
  },
  setup(props) {
    return () => h('div', {
      class: 'guide-column-container',
      style: { gap: `${props.gap}px` },
    }, [outlet('content')])
  },
})
