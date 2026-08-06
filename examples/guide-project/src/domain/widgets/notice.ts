import type { FormContext } from '@dragcraft/designer'
import { defineMaterial } from '@dragcraft/designer'
import { computed, defineComponent, h } from 'vue'

export const NoticeWidget = defineComponent({
  name: 'GuideNoticeWidget',
  props: {
    text: { type: String, default: '活动公告' },
    tone: { type: String, default: 'warm' },
    image: { type: String, default: '' },
    featured: { type: Boolean, default: false },
  },
  setup(props) {
    const backgroundImage = computed(() => props.image
      ? { backgroundImage: `url(${props.image})` }
      : undefined)
    return () => h('section', {
      class: {
        'guide-notice': true,
        [`guide-notice--${props.tone}`]: true,
        'guide-notice--featured': props.featured,
      },
      style: backgroundImage.value,
    }, [
      h('strong', props.featured ? '精选活动' : '活动提示'),
      h('p', props.text),
    ])
  },
})

export const noticeMaterial = defineMaterial({
  type: 'notice',
  schema: { defaultProps: { text: '夏日活动已经开始', tone: 'warm', hasImage: false, image: '', featured: false } },
  authoring: { policy: { remove: 'confirmation-required' } },
  panel: { title: '公告', group: 'marketing', description: '在页面中展示活动信息', keywords: ['notice', 'announcement'] },
  inspector: { formSchema: { sections: [{ title: '公告内容', fields: [
    { key: 'text', label: '文案', component: 'Input', rules: [{ required: true, message: '公告文案不能为空' }] },
    { key: 'tone', label: '色调', component: 'Select', componentProps: { options: [{ label: '暖色', value: 'warm' }, { label: '冷色', value: 'cool' }] } },
    { key: 'hasImage', label: '使用背景图', component: 'Switch' },
    { key: 'image', label: '背景图', component: 'Asset', visible: (context: FormContext) => context.values.hasImage === true },
    { key: 'featured', label: '标记为精选', component: 'Switch' },
  ] }] } },
  presentation: { kind: 'visual', preview: NoticeWidget },
})
