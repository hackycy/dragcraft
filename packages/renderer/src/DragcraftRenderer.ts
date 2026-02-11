import type { WidgetSchema } from '@dragcraft/core'
import type { PropType } from 'vue'
import type { WidgetComponentMap } from './types'
import { defineComponent, h } from 'vue'
import { WidgetWrapper } from './WidgetWrapper'

export const DragcraftRenderer = defineComponent({
  name: 'DragcraftRenderer',
  props: {
    widgets: { type: Array as PropType<WidgetSchema[]>, required: true },
    components: { type: Object as PropType<WidgetComponentMap>, required: true },
    activeId: { type: [String, null] as PropType<string | null>, default: null },
    wrapperClass: { type: String, default: 'dragcraft-widget' },
    activeClass: { type: String, default: 'dragcraft-widget--active' },
  },
  emits: ['select'],
  setup(props, { emit, slots }) {
    return () => {
      if (props.widgets.length === 0) {
        return slots.empty
          ? slots.empty()
          : h('div', { class: 'dragcraft-renderer--empty' }, 'No widgets')
      }

      return h(
        'div',
        { class: 'dragcraft-renderer' },
        props.widgets.map(widget =>
          h(WidgetWrapper, {
            key: widget.id,
            widget,
            components: props.components,
            active: widget.id === props.activeId,
            wrapperClass: props.wrapperClass,
            activeClass: props.activeClass,
            onSelect: (id: string) => emit('select', id),
          }, {
            fallback: slots.fallback,
          }),
        ),
      )
    }
  },
})
