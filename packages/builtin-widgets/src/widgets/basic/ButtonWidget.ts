import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const buttonWidgetMeta: WidgetMeta = {
  type: 'button',
  title: '按钮',
  group: 'basic',
  icon: 'button',
  defaultProps: {
    text: '按钮',
    type: 'button',
    disabled: false,
    size: 'medium',
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
            key: 'text',
            label: '按钮文字',
            component: 'input',
            defaultValue: '按钮',
            props: { placeholder: '请输入按钮文字' },
          },
          {
            key: 'type',
            label: '按钮类型',
            component: 'select',
            defaultValue: 'button',
            props: {
              options: [
                { label: '普通按钮', value: 'button' },
                { label: '提交按钮', value: 'submit' },
                { label: '重置按钮', value: 'reset' },
              ],
            },
          },
          {
            key: 'size',
            label: '按钮尺寸',
            component: 'select',
            defaultValue: 'medium',
            props: {
              options: [
                { label: '小', value: 'small' },
                { label: '中', value: 'medium' },
                { label: '大', value: 'large' },
              ],
            },
          },
          {
            key: 'disabled',
            label: '禁用状态',
            component: 'switch',
            defaultValue: false,
          },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcButtonWidget',

  props: {
    text: {
      type: String as PropType<string>,
      default: '按钮',
    },
    type: {
      type: String as PropType<'button' | 'submit' | 'reset'>,
      default: 'button',
    },
    disabled: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
    size: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'medium',
    },
  },

  setup(props) {
    return () =>
      h(
        'button',
        {
          class: ['dc-widget-button', `dc-widget-button--${props.size}`],
          type: props.type,
          disabled: props.disabled,
        },
        props.text,
      )
  },
})
