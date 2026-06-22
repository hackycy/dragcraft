import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const imageWidgetMeta: WidgetMeta = {
  type: 'image',
  title: '图片',
  titleKey: 'widget.image.title',
  group: 'basic',
  icon: 'image',
  defaultProps: {
    src: '',
    alt: '',
    objectFit: 'contain',
  },
  defaultStyle: {
    width: '200px',
    height: '150px',
  },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        titleKey: 'widget.image.form.basic.title',
        fields: [
          {
            key: 'src',
            label: '图片地址',
            labelKey: 'widget.image.field.src.label',
            placeholderKey: 'widget.image.field.src.placeholder',
            component: 'input',
            defaultValue: '',
            props: { placeholder: '请输入图片 URL' },
          },
          {
            key: 'alt',
            label: '替代文本',
            labelKey: 'widget.image.field.alt.label',
            placeholderKey: 'widget.image.field.alt.placeholder',
            component: 'input',
            defaultValue: '',
            props: { placeholder: '图片无法显示时的替代文本' },
          },
          {
            key: 'objectFit',
            label: '填充方式',
            labelKey: 'widget.image.field.objectFit.label',
            optionKeyPrefix: 'widget.image.field.objectFit.option',
            component: 'select',
            defaultValue: 'contain',
            props: {
              options: [
                { label: '包含', value: 'contain' },
                { label: '覆盖', value: 'cover' },
                { label: '拉伸', value: 'fill' },
                { label: '原始', value: 'none' },
              ],
            },
          },
        ],
      },
    ],
  },
}

const IMAGE_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'150\' viewBox=\'0 0 200 150\'%3E%3Crect fill=\'%23f0f0f0\' width=\'200\' height=\'150\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23999\' font-size=\'14\'%3EImage%3C/text%3E%3C/svg%3E'

export default defineComponent({
  name: 'DcImageWidget',

  props: {
    src: {
      type: String as PropType<string>,
      default: '',
    },
    alt: {
      type: String as PropType<string>,
      default: '',
    },
    objectFit: {
      type: String as PropType<'contain' | 'cover' | 'fill' | 'none'>,
      default: 'contain',
    },
  },

  setup(props) {
    return () =>
      h('img', {
        class: 'dc-widget-image',
        src: props.src || IMAGE_PLACEHOLDER,
        alt: props.alt,
        style: {
          objectFit: props.objectFit,
          width: '100%',
          height: '100%',
          display: 'block',
        },
      })
  },
})
