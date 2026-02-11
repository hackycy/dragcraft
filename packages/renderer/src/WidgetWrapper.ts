import type { WidgetSchema } from '@dragcraft/core'
import type { PropType } from 'vue'
import type { WidgetComponentMap } from './types'
import { defineComponent, h } from 'vue'

export const WidgetWrapper = defineComponent({
  name: 'WidgetWrapper',
  props: {
    widget: { type: Object as PropType<WidgetSchema>, required: true },
    components: { type: Object as PropType<WidgetComponentMap>, required: true },
    active: { type: Boolean, default: false },
    wrapperClass: { type: String, default: 'dragcraft-widget' },
    activeClass: { type: String, default: 'dragcraft-widget--active' },
  },
  emits: ['select'],
  setup(props, { emit, slots }) {
    return () => {
      const component = props.components[props.widget.type]

      const wrapperClasses = [
        props.wrapperClass,
        props.active ? props.activeClass : '',
      ].filter(Boolean)

      const content = component
        ? h(component, {
            widget: props.widget,
            ...props.widget.props,
          })
        : slots.fallback
          ? slots.fallback({ widget: props.widget })
          : h('div', { class: 'dragcraft-widget--unknown' }, `Unknown widget type: "${props.widget.type}"`)

      return h(
        'div',
        {
          'class': wrapperClasses,
          'data-widget-id': props.widget.id,
          'data-widget-type': props.widget.type,
          'onClick': (e: Event) => {
            e.stopPropagation()
            emit('select', props.widget.id)
          },
        },
        [content],
      )
    }
  },
})
