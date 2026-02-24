import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const textWidgetMeta: WidgetMeta = {
  type: 'text',
  title: '文本',
  group: 'basic',
  icon: 'text',
  defaultProps: {
    content: '文本内容',
    fontSize: 14,
    fontWeight: 'normal',
    color: '#333333',
    textAlign: 'left',
  },
  defaultStyle: {
    display: 'inline-block',
  },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        fields: [
          {
            key: 'content',
            label: '文本内容',
            component: 'textarea',
            defaultValue: '文本内容',
            props: { rows: 3, placeholder: '请输入文本' },
          },
        ],
      },
      {
        title: '样式设置',
        fields: [
          {
            key: 'fontSize',
            label: '字体大小',
            component: 'number',
            defaultValue: 14,
            props: { min: 10, max: 72 },
          },
          {
            key: 'fontWeight',
            label: '字体粗细',
            component: 'select',
            defaultValue: 'normal',
            props: {
              options: [
                { label: '正常', value: 'normal' },
                { label: '粗体', value: 'bold' },
                { label: '较细', value: '300' },
                { label: '较粗', value: '600' },
              ],
            },
          },
          {
            key: 'color',
            label: '文字颜色',
            component: 'color',
            defaultValue: '#333333',
          },
          {
            key: 'textAlign',
            label: '对齐方式',
            component: 'select',
            defaultValue: 'left',
            props: {
              options: [
                { label: '左对齐', value: 'left' },
                { label: '居中', value: 'center' },
                { label: '右对齐', value: 'right' },
              ],
            },
          },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcTextWidget',

  props: {
    content: {
      type: String as PropType<string>,
      default: '文本内容',
    },
    fontSize: {
      type: Number as PropType<number>,
      default: 14,
    },
    fontWeight: {
      type: String as PropType<string>,
      default: 'normal',
    },
    color: {
      type: String as PropType<string>,
      default: '#333333',
    },
    textAlign: {
      type: String as PropType<string>,
      default: 'left',
    },
  },

  setup(props) {
    return () =>
      h(
        'span',
        {
          class: 'dc-widget-text',
          style: {
            fontSize: `${props.fontSize}px`,
            fontWeight: props.fontWeight,
            color: props.color,
            textAlign: props.textAlign,
          },
        },
        props.content,
      )
  },
})
