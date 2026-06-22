import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const linkWidgetMeta: WidgetMeta = {
  type: 'link',
  title: '链接',
  titleKey: 'widget.link.title',
  group: 'basic',
  icon: 'link',
  defaultProps: {
    text: '链接',
    href: '#',
    target: '_self',
    color: '#1890ff',
  },
  defaultStyle: {},
  formSchema: {
    sections: [
      {
        title: '基础设置',
        titleKey: 'widget.link.form.basic.title',
        fields: [
          {
            key: 'text',
            label: '链接文字',
            labelKey: 'widget.link.field.text.label',
            placeholderKey: 'widget.link.field.text.placeholder',
            component: 'input',
            defaultValue: '链接',
            props: { placeholder: '请输入链接文字' },
          },
          {
            key: 'href',
            label: '链接地址',
            labelKey: 'widget.link.field.href.label',
            component: 'input',
            defaultValue: '#',
            props: { placeholder: 'https://example.com' },
          },
          {
            key: 'target',
            label: '打开方式',
            labelKey: 'widget.link.field.target.label',
            optionKeyPrefix: 'widget.link.field.target.option',
            component: 'select',
            defaultValue: '_self',
            props: {
              options: [
                { label: '当前窗口', value: '_self' },
                { label: '新窗口', value: '_blank' },
              ],
            },
          },
          {
            key: 'color',
            label: '链接颜色',
            labelKey: 'widget.link.field.color.label',
            component: 'color',
            defaultValue: '#1890ff',
          },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcLinkWidget',

  props: {
    text: {
      type: String as PropType<string>,
      default: '链接',
    },
    href: {
      type: String as PropType<string>,
      default: '#',
    },
    target: {
      type: String as PropType<'_self' | '_blank'>,
      default: '_self',
    },
    color: {
      type: String as PropType<string>,
      default: '#1890ff',
    },
  },

  setup(props) {
    return () =>
      h(
        'a',
        {
          class: 'dc-widget-link',
          href: props.href,
          target: props.target,
          style: { color: props.color },
        },
        props.text,
      )
  },
})
