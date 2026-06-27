import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
// playground/src/widgets/SwiperWidget.ts
import { defineComponent, h } from 'vue'

const DEFAULT_IMAGES = [
  'https://picsum.photos/seed/swiper1/750/300',
  'https://picsum.photos/seed/swiper2/750/300',
  'https://picsum.photos/seed/swiper3/750/300',
]

export const swiperWidgetMeta: WidgetMeta = {
  type: 'swiper',
  title: '轮播',
  group: 'basic',
  icon: 'swiper',
  defaultProps: {
    images: DEFAULT_IMAGES,
    showIndicator: true,
    height: 180,
    borderRadius: 0,
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
            key: 'images',
            label: '图片列表 (每行一个 URL)',
            component: 'textarea',
            defaultValue: DEFAULT_IMAGES,
            props: { rows: 4, placeholder: '每行一个图片 URL' },
          },
        ],
      },
      {
        title: '样式设置',
        fields: [
          {
            key: 'showIndicator',
            label: '显示指示器',
            component: 'switch',
            defaultValue: true,
          },
          {
            key: 'height',
            label: '高度 (px)',
            component: 'number',
            defaultValue: 180,
            props: { min: 80, max: 500 },
          },
          {
            key: 'borderRadius',
            label: '圆角 (px)',
            component: 'number',
            defaultValue: 0,
            props: { min: 0, max: 50 },
          },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcSwiperWidget',

  props: {
    images: {
      type: Array as PropType<string[]>,
      default: () => DEFAULT_IMAGES,
    },
    showIndicator: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    height: {
      type: Number as PropType<number>,
      default: 180,
    },
    borderRadius: {
      type: Number as PropType<number>,
      default: 0,
    },
  },

  setup(props) {
    return () => {
      const imgSrc = props.images.length > 0
        ? props.images[0]
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="750" height="300"%3E%3Crect fill="%23f0f0f0" width="750" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="16"%3ESwiper%3C/text%3E%3C/svg%3E'

      return h('div', {
        class: 'dc-widget-swiper',
        style: {
          position: 'relative',
          width: '100%',
          boxSizing: 'border-box',
          height: `${props.height}px`,
          overflow: 'hidden',
          borderRadius: `${props.borderRadius}px`,
        },
      }, [
        h('img', {
          src: imgSrc,
          alt: 'swiper',
          style: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            borderRadius: `${props.borderRadius}px`,
          },
        }),
        props.showIndicator && props.images.length > 1
          ? h('div', {
              class: 'dc-widget-swiper__indicators',
              style: {
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '6px',
              },
            }, props.images.map((_, i) =>
              h('span', {
                key: i,
                class: 'dc-widget-swiper__dot',
                style: {
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: i === 0 ? '#ffffff' : 'rgba(255,255,255,0.5)',
                },
              }),
            ))
          : null,
      ])
    }
  },
})
