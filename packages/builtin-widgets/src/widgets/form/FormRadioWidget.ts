import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const formRadioWidgetMeta: WidgetMeta = {
  type: 'form-radio',
  title: '单选组',
  group: 'form',
  icon: 'radio',
  defaultProps: {
    label: '单选组',
    value: '',
    options: [
      { label: '选项 A', value: 'a' },
      { label: '选项 B', value: 'b' },
    ],
    direction: 'horizontal',
    disabled: false,
  },
  defaultStyle: {},
  formSchema: {
    sections: [
      {
        title: '基础设置',
        fields: [
          { key: 'label', label: '标签', component: 'input', defaultValue: '单选组' },
          {
            key: 'direction',
            label: '排列方向',
            component: 'select',
            defaultValue: 'horizontal',
            props: {
              options: [
                { label: '水平', value: 'horizontal' },
                { label: '垂直', value: 'vertical' },
              ],
            },
          },
          { key: 'disabled', label: '禁用', component: 'switch', defaultValue: false },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcFormRadioWidget',

  props: {
    label: {
      type: String as PropType<string>,
      default: '单选组',
    },
    value: {
      type: [String, Number] as PropType<string | number>,
      default: '',
    },
    options: {
      type: Array as PropType<Array<{ label: string, value: string | number }>>,
      default: () => [
        { label: '选项 A', value: 'a' },
        { label: '选项 B', value: 'b' },
      ],
    },
    direction: {
      type: String as PropType<'horizontal' | 'vertical'>,
      default: 'horizontal',
    },
    disabled: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
  },

  setup(props) {
    return () =>
      h('div', { class: 'dc-widget-form-radio' }, [
        h('div', { class: 'dc-widget-form-radio__label' }, props.label),
        h(
          'div',
          {
            class: [
              'dc-widget-form-radio__group',
              `dc-widget-form-radio__group--${props.direction}`,
            ],
          },
          props.options.map((opt, i) =>
            h('label', { class: 'dc-widget-form-radio__item', key: i }, [
              h('input', {
                type: 'radio',
                value: String(opt.value),
                checked: String(props.value) === String(opt.value),
                disabled: props.disabled,
              }),
              h('span', null, opt.label),
            ]),
          ),
        ),
      ])
  },
})
