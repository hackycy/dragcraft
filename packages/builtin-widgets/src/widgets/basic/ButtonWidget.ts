import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const buttonWidgetMeta: WidgetMeta = {
  type: 'button',
  title: '按钮',
  titleKey: 'widget.button.title',
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
        titleKey: 'widget.button.form.basic.title',
        fields: [
          {
            key: 'text',
            label: '按钮文字',
            labelKey: 'widget.button.field.text.label',
            placeholderKey: 'widget.button.field.text.placeholder',
            component: 'input',
            defaultValue: '按钮',
            props: { placeholder: '请输入按钮文字' },
          },
          {
            key: 'type',
            label: '按钮类型',
            labelKey: 'widget.button.field.type.label',
            optionKeyPrefix: 'widget.button.field.type.option',
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
            labelKey: 'widget.button.field.size.label',
            optionKeyPrefix: 'widget.button.field.size.option',
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
            labelKey: 'widget.button.field.disabled.label',
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
