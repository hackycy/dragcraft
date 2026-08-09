import type { WidgetFixtureDefinition } from './contract'
import { defineComponent, h } from 'vue'

export const GuidePageHeaderWidget = defineComponent({
  name: 'GuidePageHeaderWidget',
  props: {
    title: { type: String, default: '活动页' },
  },
  setup(props) {
    return () => h('header', { class: 'guide-page-header' }, props.title)
  },
})

export const pageHeaderWidgetDefinition: WidgetFixtureDefinition = {
  meta: {
    type: 'page-header',
    title: '活动页头',
    group: 'chrome',
    authoring: 'schema-managed',
    defaultProps: { title: '夏日活动页' },
    defaultLayout: {
      placement: {
        kind: 'chrome',
        edge: 'block-start',
        position: 'sticky',
        reserve: { mode: 'size', size: 48 },
      },
    },
    formSchema: {
      sections: [{
        title: '页头内容',
        fields: [{ key: 'title', label: '标题', component: 'Input' }],
      }],
    },
  },
  component: GuidePageHeaderWidget,
}
