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
  defaultLayout: {
    slot: 'navbar.surface',
    sortScope: false,
  },
  layoutManifest: {
    slots: {
      'navbar.surface': {
        allocation: 'reserve',
        axis: 'block',
        edge: 'start',
        order: 10,
      },
    },
  },
  creatable: (ctx) => {
    const children = ctx.schema.root.children ?? []
    return !children.some(c => c.type === 'navbar')
  },
  defaultProps: {
    title: '页面标题',
    subtitle: '',
    titleFontSize: 16,
    titleFontWeight: '600',
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
        title: '标题设置',
        fields: [
          {
            key: 'titleConfig',
            label: '标题配置',
            component: 'navbar-title',
            parseValue: (config: Record<string, unknown>) => ({
              title: config.title,
              subtitle: config.subtitle,
              titleFontSize: config.titleFontSize,
              titleFontWeight: config.titleFontWeight,
            }),
            valueFormat: (_value: unknown, ctx: { values: Record<string, unknown> }) => ({
              title: ctx.values.title,
              subtitle: ctx.values.subtitle,
              titleFontSize: ctx.values.titleFontSize,
              titleFontWeight: ctx.values.titleFontWeight,
            }),
          },
        ],
      },
      {
        title: '基础设置',
        fields: [
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
    subtitle: {
      type: String as PropType<string>,
      default: '',
    },
    titleFontSize: {
      type: Number as PropType<number>,
      default: 16,
    },
    titleFontWeight: {
      type: String as PropType<string>,
      default: '600',
    },
    titleConfig: {
      type: Object as PropType<Record<string, unknown>>,
      default: undefined,
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
    return () => {
      const title = (props.titleConfig?.title as string) ?? props.title
      const subtitle = (props.titleConfig?.subtitle as string) ?? props.subtitle
      const titleFontSize = (props.titleConfig?.titleFontSize as number) ?? props.titleFontSize
      const titleFontWeight = (props.titleConfig?.titleFontWeight as string) ?? props.titleFontWeight

      return h('div', {
        class: 'dc-widget-navbar',
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          height: '44px',
          paddingTop: '12px',
          paddingBottom: '12px',
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
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px',
                cursor: 'pointer',
              },
            }, '←')
          : null,
        h('div', {
          class: 'dc-widget-navbar__title-wrapper',
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          },
        }, [
          h('span', {
            class: 'dc-widget-navbar__title',
            style: {
              fontSize: `${titleFontSize}px`,
              fontWeight: titleFontWeight,
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px',
            },
          }, title),
          subtitle
            ? h('span', {
                class: 'dc-widget-navbar__subtitle',
                style: {
                  fontSize: '12px',
                  color: props.textColor,
                  opacity: 0.7,
                  marginTop: '2px',
                },
              }, subtitle)
            : null,
        ]),
      ])
    }
  },
})
