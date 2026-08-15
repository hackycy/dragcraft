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
