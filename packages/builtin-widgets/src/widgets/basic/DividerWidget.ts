import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const dividerWidgetMeta: WidgetMeta = {
  type: 'divider',
  title: '分割线',
  group: 'basic',
  icon: 'divider',
  defaultProps: {
    direction: 'horizontal',
    color: '#e8e8e8',
    thickness: 1,
  },
  defaultStyle: {
    width: '100%',
    margin: '8px 0',
  },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        fields: [
          {
            key: 'direction',
            label: '方向',
            component: 'select',
            defaultValue: 'horizontal',
            props: {
              options: [
                { label: '水平', value: 'horizontal' },
                { label: '垂直', value: 'vertical' },
              ],
            },
          },
          {
            key: 'color',
            label: '颜色',
            component: 'color',
            defaultValue: '#e8e8e8',
          },
          {
            key: 'thickness',
            label: '粗细',
            component: 'number',
            defaultValue: 1,
            props: { min: 1, max: 10 },
          },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcDividerWidget',

  props: {
    direction: {
      type: String as PropType<'horizontal' | 'vertical'>,
      default: 'horizontal',
    },
    color: {
      type: String as PropType<string>,
      default: '#e8e8e8',
    },
    thickness: {
      type: Number as PropType<number>,
      default: 1,
    },
  },

  setup(props) {
    return () =>
      h('hr', {
        class: ['dc-widget-divider', `dc-widget-divider--${props.direction}`],
        style: {
          borderColor: props.color,
          borderWidth: props.direction === 'horizontal'
            ? `${props.thickness}px 0 0 0`
            : `0 0 0 ${props.thickness}px`,
          borderStyle: 'solid',
          margin: 0,
        },
      })
  },
})
