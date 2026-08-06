import { defineMaterial, DesignerViewportPortal, useSurfaceReservation } from '@dragcraft/designer'
import { defineComponent, h, ref } from 'vue'

const PageHeaderFrame = defineComponent({
  name: 'GuidePageHeaderFrame',
  setup(_, { slots }) {
    const element = ref<HTMLElement | null>(null)
    const reservation = useSurfaceReservation(element, { edge: 'block-start', fallbackSize: 48 })
    return () => h(DesignerViewportPortal, null, {
      default: () => h('div', {
        ref: element,
        class: 'guide-page-header-frame',
        style: { insetBlockStart: `${reservation.offset.value}px` },
      }, slots.default?.()),
    })
  },
})

export const GuidePageHeaderWidget = defineComponent({
  name: 'GuidePageHeaderWidget',
  props: { title: { type: String, default: '活动页' } },
  setup: props => () => h('header', { class: 'guide-page-header' }, props.title),
})

export const pageHeaderMaterial = defineMaterial({
  type: 'page-header',
  schema: { defaultProps: { title: '夏日活动页' } },
  authoring: { policy: { remove: 'confirmation-required' } },
  inspector: { formSchema: { sections: [{ title: '页头内容', fields: [
    { key: 'title', label: '标题', component: 'Input' },
  ] }] } },
  presentation: { kind: 'visual', preview: GuidePageHeaderWidget, frame: PageHeaderFrame },
})
