import { defineComponent, h } from 'vue'
import { RuntimeColumnContainer } from './RuntimeColumnContainer'

const RuntimePageHeader = defineComponent({
  props: { title: String },
  setup: props => () => h('header', { class: 'guide-page-header' }, props.title),
})
const RuntimeNotice = defineComponent({
  props: { text: String, tone: String, featured: Boolean },
  setup: props => () => h('section', {
    class: ['guide-notice', `guide-notice--${props.tone ?? 'warm'}`, { 'guide-notice--featured': props.featured }],
  }, [h('strong', props.featured ? '精选活动' : '活动提示'), h('p', props.text)]),
})
const RuntimeText = defineComponent({
  props: { content: String },
  setup: props => () => h('p', { class: 'guide-text-widget' }, props.content),
})
const RuntimeFloatingAction = defineComponent({
  props: { label: String },
  setup: props => () => h('button', { class: 'guide-floating-action', type: 'button' }, props.label),
})

export type {
  RuntimeContainerDefinition,
  RuntimeDefinition,
  RuntimeMount,
  RuntimeNodeDefinition,
  RuntimeRegions,
  RuntimeRegistry,
} from './registry'
export { RuntimeColumnContainer } from './RuntimeColumnContainer'
export {
  createRuntimeDocumentView,
  createRuntimeNodeRenderer,
  DefaultRuntimeFallback,
  RuntimePage,
} from './RuntimePage'

export const guideRuntimeRegistry = {
  'page-header': { kind: 'node', component: RuntimePageHeader, mount: 'header' },
  'notice': { kind: 'node', component: RuntimeNotice },
  'guide-text': { kind: 'node', component: RuntimeText },
  'column-container': { kind: 'container', component: RuntimeColumnContainer },
  'floating-action': { kind: 'node', component: RuntimeFloatingAction, mount: 'overlay' },
} as const
