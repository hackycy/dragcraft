import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const linkWidgetMeta: WidgetMeta = {
  type: 'link',
  title: '链接',
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
        fields: [
          {
            key: 'text',
            label: '链接文字',
            component: 'input',
            defaultValue: '链接',
            props: { placeholder: '请输入链接文字' },
          },
          {
            key: 'href',
            label: '链接地址',
            component: 'input',
            defaultValue: '#',
            props: { placeholder: 'https://example.com' },
          },
          {
            key: 'target',
            label: '打开方式',
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
