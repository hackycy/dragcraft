import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const flexRowWidgetMeta: WidgetMeta = {
  type: 'flex-row',
  title: '横向布局',
  group: 'layout',
  icon: 'flex-row',
  defaultProps: {
    gap: 8,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    wrap: false,
  },
  defaultStyle: {
    minHeight: '50px',
    padding: '8px',
  },
  formSchema: {
    sections: [
      {
        title: '布局设置',
        fields: [
          {
            key: 'gap',
            label: '间距',
            component: 'number',
            defaultValue: 8,
            props: { min: 0, max: 100 },
          },
          {
            key: 'justifyContent',
            label: '水平对齐',
            component: 'select',
            defaultValue: 'flex-start',
            props: {
              options: [
                { label: '左对齐', value: 'flex-start' },
                { label: '居中', value: 'center' },
                { label: '右对齐', value: 'flex-end' },
                { label: '两端对齐', value: 'space-between' },
                { label: '均匀分布', value: 'space-around' },
              ],
            },
          },
          {
            key: 'alignItems',
            label: '垂直对齐',
            component: 'select',
            defaultValue: 'stretch',
            props: {
              options: [
                { label: '顶部', value: 'flex-start' },
                { label: '居中', value: 'center' },
                { label: '底部', value: 'flex-end' },
                { label: '拉伸', value: 'stretch' },
              ],
            },
          },
          {
            key: 'wrap',
            label: '自动换行',
            component: 'switch',
            defaultValue: false,
          },
        ],
      },
    ],
  },
  canHaveChildren: true,
}

export default defineComponent({
  name: 'DcFlexRowWidget',

  props: {
    gap: {
      type: Number as PropType<number>,
      default: 8,
    },
    justifyContent: {
      type: String as PropType<string>,
      default: 'flex-start',
    },
    alignItems: {
      type: String as PropType<string>,
      default: 'stretch',
    },
    wrap: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
  },

  setup(props, { slots }) {
    return () =>
      h(
        'div',
        {
          class: 'dc-widget-flex-row',
          style: {
            display: 'flex',
            flexDirection: 'row',
            gap: `${props.gap}px`,
            justifyContent: props.justifyContent,
            alignItems: props.alignItems,
            flexWrap: props.wrap ? 'wrap' : 'nowrap',
          },
        },
        slots.default?.(),
      )
  },
})
