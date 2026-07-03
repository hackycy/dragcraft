import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const floatingButtonWidgetMeta: WidgetMeta = {
  type: 'floating-button',
  title: '浮动按钮',
  group: 'action',
  icon: 'fab',
  defaultLayout: {
    placement: {
      kind: 'layer',
      layer: 'float',
      mode: 'self',
      avoid: ['safe-area', 'chrome'],
    },
  },
  defaultProps: {
    label: '+',
    side: 'right',
    bottom: 16,
    sideOffset: 16,
    size: 52,
    backgroundColor: '#07C160',
    textColor: '#ffffff',
  },
  formSchema: {
    sections: [
      {
        title: '内容',
        fields: [
          {
            key: 'label',
            label: '按钮文字',
            component: 'input',
            defaultValue: '+',
          },
        ],
      },
      {
        title: '位置',
        fields: [
          {
            key: 'side',
            label: '水平位置',
            component: 'select',
            defaultValue: 'right',
            props: {
              options: [
                { label: '右侧', value: 'right' },
                { label: '左侧', value: 'left' },
              ],
            },
          },
          {
            key: 'bottom',
            label: '底部距离',
            component: 'number',
            defaultValue: 16,
            props: { min: 0, max: 120 },
          },
          {
            key: 'sideOffset',
            label: '侧边距离',
            component: 'number',
            defaultValue: 16,
            props: { min: 0, max: 120 },
          },
        ],
      },
      {
        title: '样式',
        fields: [
          {
            key: 'size',
            label: '尺寸',
            component: 'number',
            defaultValue: 52,
            props: { min: 36, max: 88 },
          },
          {
            key: 'backgroundColor',
            label: '背景颜色',
            component: 'color',
            defaultValue: '#07C160',
          },
          {
            key: 'textColor',
            label: '文字颜色',
            component: 'color',
            defaultValue: '#ffffff',
          },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcFloatingButtonWidget',

  props: {
    label: {
      type: String as PropType<string>,
      default: '+',
    },
    side: {
      type: String as PropType<'left' | 'right'>,
      default: 'right',
    },
    bottom: {
      type: Number as PropType<number>,
      default: 16,
    },
    sideOffset: {
      type: Number as PropType<number>,
      default: 16,
    },
    size: {
      type: Number as PropType<number>,
      default: 52,
    },
    backgroundColor: {
      type: String as PropType<string>,
      default: '#07C160',
    },
    textColor: {
      type: String as PropType<string>,
      default: '#ffffff',
    },
  },

  setup(props) {
    return () => {
      const horizontal = props.side === 'left'
        ? { left: `calc(var(--dc-inset-inline-start) + ${props.sideOffset}px)` }
        : { right: `calc(var(--dc-inset-inline-end) + ${props.sideOffset}px)` }

      return h('button', {
        class: 'dc-widget-floating-button',
        style: {
          position: 'absolute',
          bottom: `calc(var(--dc-inset-block-end) + ${props.bottom}px)`,
          ...horizontal,
          width: `${props.size}px`,
          height: `${props.size}px`,
          borderRadius: '50%',
          border: 'none',
          background: props.backgroundColor,
          color: props.textColor,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
          fontSize: `${Math.max(16, props.size * 0.42)}px`,
          fontWeight: 700,
          lineHeight: 1,
          cursor: 'pointer',
        },
      }, props.label)
    }
  },
})
