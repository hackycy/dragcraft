import type { DesignerWidgetMeta } from '@dragcraft/designer'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const textWidgetMeta: DesignerWidgetMeta = {
  type: 'text',
  title: '文本',
  titleKey: 'widget.text.title',
  group: 'basic',
  icon: 'text',
  material: {
    icon: '文',
    description: '展示标题、段落和说明文案',
    descriptionKey: 'widget.text.material.description',
    tags: ['基础'],
    keywords: ['copy', 'paragraph', 'content', '文案', '段落'],
  },
  defaultProps: {
    content: '文本内容',
    fontSize: 14,
    fontWeight: 'normal',
    color: '#333333',
    textAlign: 'left',
  },
  defaultStyle: { content: { display: 'block' } },
  formSchema: {
    sections: [
      {
        title: '内容',
        titleKey: 'widget.text.form.basic.title',
        fields: [
          {
            key: 'content',
            label: '文本内容',
            labelKey: 'widget.text.field.content.label',
            placeholderKey: 'widget.text.field.content.placeholder',
            component: 'Textarea',
            defaultValue: '文本内容',
            componentProps: { rows: 3, placeholder: '请输入文本' },
          },
        ],
      },
      {
        title: '样式',
        titleKey: 'widget.text.form.style.title',
        fields: [
          { key: 'fontSize', label: '字号', labelKey: 'widget.text.field.fontSize.label', component: 'InputNumber', defaultValue: 14, componentProps: { min: 10, max: 72 } },
          {
            key: 'fontWeight',
            label: '字重',
            labelKey: 'widget.text.field.fontWeight.label',
            optionKeyPrefix: 'widget.text.field.fontWeight.option',
            component: 'Select',
            defaultValue: 'normal',
            componentProps: {
              options: [
                { label: '常规', value: 'normal' },
                { label: '粗体', value: 'bold' },
                { label: '轻', value: '300' },
                { label: '半粗', value: '600' },
              ],
            },
          },
          { key: 'color', label: '文字颜色', labelKey: 'widget.text.field.color.label', component: 'Color', defaultValue: '#333333' },
          {
            key: 'textAlign',
            label: '对齐方式',
            labelKey: 'widget.text.field.textAlign.label',
            optionKeyPrefix: 'widget.text.field.textAlign.option',
            component: 'Select',
            defaultValue: 'left',
            componentProps: {
              options: [
                { label: '左对齐', value: 'left' },
                { label: '居中', value: 'center' },
                { label: '右对齐', value: 'right' },
              ],
            },
          },
        ],
      },
      {
        title: '容器样式',
        fields: [
          {
            key: 'marginTop',
            label: '上外边距',
            component: 'InputNumber',
            defaultValue: 0,
            bindTo: { scope: 'node', path: 'style.container.marginTop' },
            componentProps: { min: -120, max: 120 },
          },
        ],
      },
    ],
  },
}

export const TextWidget = defineComponent({
  name: 'PlaygroundTextWidget',
  props: {
    content: { type: String as PropType<string>, default: '文本内容' },
    fontSize: { type: Number as PropType<number>, default: 14 },
    fontWeight: { type: String as PropType<string>, default: 'normal' },
    color: { type: String as PropType<string>, default: '#333333' },
    textAlign: { type: String as PropType<string>, default: 'left' },
  },
  setup(props) {
    return () =>
      h('div', {
        class: 'pg-widget-text',
        style: {
          fontSize: `${props.fontSize}px`,
          fontWeight: props.fontWeight,
          color: props.color,
          textAlign: props.textAlign,
        },
      }, props.content)
  },
})

export const buttonWidgetMeta: DesignerWidgetMeta = {
  type: 'button',
  title: '按钮',
  titleKey: 'widget.button.title',
  group: 'basic',
  icon: 'button',
  material: {
    icon: '钮',
    description: '触发提交、跳转和业务动作',
    descriptionKey: 'widget.button.material.description',
    tags: ['操作'],
    keywords: ['cta', 'action', 'submit', '点击'],
  },
  defaultProps: {
    text: '按钮',
    type: 'button',
    disabled: false,
    size: 'medium',
  },
  defaultStyle: {},
  formSchema: {
    sections: [
      {
        title: '基础设置',
        titleKey: 'widget.button.form.basic.title',
        fields: [
          { key: 'text', label: '按钮文字', labelKey: 'widget.button.field.text.label', placeholderKey: 'widget.button.field.text.placeholder', component: 'Input', defaultValue: '按钮', componentProps: { placeholder: '请输入按钮文字' } },
          {
            key: 'type',
            label: '按钮类型',
            labelKey: 'widget.button.field.type.label',
            optionKeyPrefix: 'widget.button.field.type.option',
            component: 'Select',
            defaultValue: 'button',
            componentProps: { options: [{ label: '普通按钮', value: 'button' }, { label: '提交按钮', value: 'submit' }, { label: '重置按钮', value: 'reset' }] },
          },
          {
            key: 'size',
            label: '按钮尺寸',
            labelKey: 'widget.button.field.size.label',
            optionKeyPrefix: 'widget.button.field.size.option',
            component: 'Select',
            defaultValue: 'medium',
            componentProps: { options: [{ label: '小', value: 'small' }, { label: '中', value: 'medium' }, { label: '大', value: 'large' }] },
          },
          { key: 'disabled', label: '禁用状态', labelKey: 'widget.button.field.disabled.label', component: 'Switch', defaultValue: false },
        ],
      },
    ],
  },
}

export const ButtonWidget = defineComponent({
  name: 'PlaygroundButtonWidget',
  props: {
    text: { type: String as PropType<string>, default: '按钮' },
    type: { type: String as PropType<'button' | 'submit' | 'reset'>, default: 'button' },
    disabled: { type: Boolean as PropType<boolean>, default: false },
    size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'medium' },
  },
  setup(props) {
    return () =>
      h('button', {
        class: ['pg-widget-button', `pg-widget-button--${props.size}`],
        type: props.type,
        disabled: props.disabled,
      }, props.text)
  },
})

export const imageWidgetMeta: DesignerWidgetMeta = {
  type: 'image',
  title: '图片',
  titleKey: 'widget.image.title',
  group: 'basic',
  icon: 'image',
  material: {
    icon: '图',
    description: '展示商品、横幅和内容配图',
    descriptionKey: 'widget.image.material.description',
    tags: ['媒体'],
    keywords: ['media', 'banner', 'photo', '图片', '海报'],
  },
  defaultProps: {
    src: '',
    alt: '',
    objectFit: 'contain',
  },
  defaultStyle: {
    content: {
      width: '200px',
      height: '150px',
    },
  },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        titleKey: 'widget.image.form.basic.title',
        fields: [
          { key: 'src', label: '图片地址', labelKey: 'widget.image.field.src.label', placeholderKey: 'widget.image.field.src.placeholder', component: 'Input', defaultValue: '', componentProps: { placeholder: '请输入图片 URL' } },
          { key: 'alt', label: '替代文本', labelKey: 'widget.image.field.alt.label', placeholderKey: 'widget.image.field.alt.placeholder', component: 'Input', defaultValue: '', componentProps: { placeholder: '图片无法显示时的替代文本' } },
          {
            key: 'objectFit',
            label: '填充方式',
            labelKey: 'widget.image.field.objectFit.label',
            optionKeyPrefix: 'widget.image.field.objectFit.option',
            component: 'Select',
            defaultValue: 'contain',
            componentProps: { options: [{ label: '包含', value: 'contain' }, { label: '覆盖', value: 'cover' }, { label: '拉伸', value: 'fill' }, { label: '原始', value: 'none' }] },
          },
        ],
      },
    ],
  },
}

export const ImageWidget = defineComponent({
  name: 'PlaygroundImageWidget',
  props: {
    src: { type: String as PropType<string>, default: '' },
    alt: { type: String as PropType<string>, default: '' },
    objectFit: { type: String as PropType<'contain' | 'cover' | 'fill' | 'none'>, default: 'contain' },
  },
  setup(props) {
    return () =>
      props.src
        ? h('img', {
            class: 'pg-widget-image',
            src: props.src,
            alt: props.alt,
            style: { objectFit: props.objectFit },
          })
        : h('div', { class: 'pg-widget-image pg-widget-image--empty' }, [
            h('span', null, 'Image'),
            h('small', null, 'Set source URL'),
          ])
  },
})

export const linkWidgetMeta: DesignerWidgetMeta = {
  type: 'link',
  title: '链接',
  titleKey: 'widget.link.title',
  group: 'basic',
  icon: 'link',
  material: {
    icon: '链',
    description: '跳转到页面、活动或外部地址',
    descriptionKey: 'widget.link.material.description',
    tags: ['跳转'],
    keywords: ['href', 'navigation', 'url', '链接'],
  },
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
          { key: 'text', label: '链接文字', labelKey: 'widget.link.field.text.label', placeholderKey: 'widget.link.field.text.placeholder', component: 'Input', defaultValue: '链接', componentProps: { placeholder: '请输入链接文字' } },
          { key: 'href', label: '链接地址', labelKey: 'widget.link.field.href.label', component: 'Input', defaultValue: '#', componentProps: { placeholder: 'https://example.com' } },
          {
            key: 'target',
            label: '打开方式',
            labelKey: 'widget.link.field.target.label',
            optionKeyPrefix: 'widget.link.field.target.option',
            component: 'Select',
            defaultValue: '_self',
            componentProps: { options: [{ label: '当前窗口', value: '_self' }, { label: '新窗口', value: '_blank' }] },
          },
          { key: 'color', label: '链接颜色', labelKey: 'widget.link.field.color.label', component: 'Color', defaultValue: '#1890ff' },
        ],
      },
    ],
  },
}

export const LinkWidget = defineComponent({
  name: 'PlaygroundLinkWidget',
  props: {
    text: { type: String as PropType<string>, default: '链接' },
    href: { type: String as PropType<string>, default: '#' },
    target: { type: String as PropType<'_self' | '_blank'>, default: '_self' },
    color: { type: String as PropType<string>, default: '#1890ff' },
  },
  setup(props) {
    return () =>
      h('a', {
        class: 'pg-widget-link',
        href: props.href,
        target: props.target,
        style: { color: props.color },
      }, props.text)
  },
})

export const dividerWidgetMeta: DesignerWidgetMeta = {
  type: 'divider',
  title: '分割线',
  titleKey: 'widget.divider.title',
  group: 'basic',
  icon: 'divider',
  material: {
    icon: '线',
    description: '分隔内容区块并建立视觉层次',
    descriptionKey: 'widget.divider.material.description',
    tags: ['布局'],
    keywords: ['line', 'separator', 'rule', '分隔'],
  },
  defaultProps: {
    direction: 'horizontal',
    color: '#e8e8e8',
    thickness: 1,
  },
  defaultStyle: {
    container: { margin: '8px 0' },
    content: { width: '100%' },
  },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        titleKey: 'widget.divider.form.basic.title',
        fields: [
          {
            key: 'direction',
            label: '方向',
            labelKey: 'widget.divider.field.direction.label',
            optionKeyPrefix: 'widget.divider.field.direction.option',
            component: 'Select',
            defaultValue: 'horizontal',
            componentProps: { options: [{ label: '水平', value: 'horizontal' }, { label: '垂直', value: 'vertical' }] },
          },
          { key: 'color', label: '颜色', labelKey: 'widget.divider.field.color.label', component: 'Color', defaultValue: '#e8e8e8' },
          { key: 'thickness', label: '粗细', labelKey: 'widget.divider.field.thickness.label', component: 'InputNumber', defaultValue: 1, componentProps: { min: 1, max: 10 } },
        ],
      },
    ],
  },
}

export const DividerWidget = defineComponent({
  name: 'PlaygroundDividerWidget',
  props: {
    direction: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
    color: { type: String as PropType<string>, default: '#e8e8e8' },
    thickness: { type: Number as PropType<number>, default: 1 },
  },
  setup(props) {
    return () =>
      h('div', {
        class: ['pg-widget-divider', `pg-widget-divider--${props.direction}`],
        style: {
          '--pg-divider-color': props.color,
          '--pg-divider-size': `${props.thickness}px`,
        },
      })
  },
})

export const basicWidgetDefinitions = [
  { meta: textWidgetMeta, component: TextWidget },
  { meta: buttonWidgetMeta, component: ButtonWidget },
  { meta: imageWidgetMeta, component: ImageWidget },
  { meta: linkWidgetMeta, component: LinkWidget },
  { meta: dividerWidgetMeta, component: DividerWidget },
]
