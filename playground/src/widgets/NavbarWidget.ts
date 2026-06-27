// playground/src/widgets/NavbarWidget.ts
import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'

import { defineComponent, h } from 'vue'

export const navbarWidgetMeta: WidgetMeta = {
  type: 'navbar',
  title: '导航栏',
  group: 'navigation',
  icon: 'navbar',
  draggable: false,
  sortable: false,
  defaultProps: {
    title: '页面标题',
    showBack: false,
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    transparent: false,
  },
  defaultStyle: {
    width: '100%',
  },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        fields: [
          {
            key: 'title',
            label: '标题文字',
            component: 'input',
            defaultValue: '页面标题',
            props: { placeholder: '请输入导航栏标题' },
          },
          {
            key: 'showBack',
            label: '显示返回按钮',
            component: 'switch',
            defaultValue: false,
          },
        ],
      },
      {
        title: '样式设置',
        fields: [
          {
            key: 'backgroundColor',
            label: '背景颜色',
            component: 'color',
            defaultValue: '#ffffff',
          },
          {
            key: 'textColor',
            label: '文字颜色',
            component: 'color',
            defaultValue: '#1a1a1a',
          },
          {
            key: 'transparent',
            label: '透明背景',
            component: 'switch',
            defaultValue: false,
          },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcNavbarWidget',

  props: {
    title: {
      type: String as PropType<string>,
      default: '页面标题',
    },
    showBack: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
    backgroundColor: {
      type: String as PropType<string>,
      default: '#ffffff',
    },
    textColor: {
      type: String as PropType<string>,
      default: '#1a1a1a',
    },
    transparent: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
  },

  setup(props) {
    return () =>
      h('div', {
        class: 'dc-widget-navbar',
        style: {
          position: 'sticky',
          top: '0',
          zIndex: '100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '44px',
          paddingTop: '20px',
          paddingBottom: '4px',
          backgroundColor: props.transparent ? 'transparent' : props.backgroundColor,
          color: props.textColor,
          borderBottom: props.transparent ? 'none' : '1px solid #f0f0f0',
        },
      }, [
        props.showBack
          ? h('span', {
              class: 'dc-widget-navbar__back',
              style: {
                position: 'absolute',
                left: '12px',
                fontSize: '18px',
                cursor: 'pointer',
              },
            }, '←')
          : null,
        h('span', {
          class: 'dc-widget-navbar__title',
          style: {
            fontSize: '16px',
            fontWeight: '600',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '200px',
          },
        }, props.title),
      ])
  },
})
