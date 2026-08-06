import type { MaterialDefinition } from '@dragcraft/designer'
import type { PropType } from 'vue'
import { defineMaterial } from '@dragcraft/designer'
import { defineComponent, h } from 'vue'

const protectedRemoval = { remove: 'confirmation-required' as const }

export const TextWidget = defineComponent({
  name: 'PlaygroundTextWidget',
  props: {
    content: { type: String, default: '文本内容' },
    fontSize: { type: Number, default: 14 },
    fontWeight: { type: String, default: 'normal' },
    color: { type: String, default: '#333333' },
    textAlign: { type: String, default: 'left' },
  },
  setup: props => () => h('div', {
    class: 'pg-widget-text',
    style: {
      color: props.color,
      fontSize: `${props.fontSize}px`,
      fontWeight: props.fontWeight,
      textAlign: props.textAlign,
    },
  }, props.content),
})

export const ButtonWidget = defineComponent({
  name: 'PlaygroundButtonWidget',
  props: {
    text: { type: String, default: '按钮' },
    type: { type: String as PropType<'button' | 'submit' | 'reset'>, default: 'button' },
    disabled: { type: Boolean, default: false },
    size: { type: String, default: 'medium' },
  },
  setup: props => () => h('button', {
    class: ['pg-widget-button', `pg-widget-button--${props.size}`],
    disabled: props.disabled,
    type: props.type,
  }, props.text),
})

export const ImageWidget = defineComponent({
  name: 'PlaygroundImageWidget',
  props: {
    src: { type: String, default: '' },
    alt: { type: String, default: '' },
    objectFit: { type: String, default: 'contain' },
    height: { type: Number, default: 180 },
  },
  setup: props => () => props.src
    ? h('img', {
        class: 'pg-widget-image',
        src: props.src,
        alt: props.alt,
        style: { height: `${props.height}px`, objectFit: props.objectFit, width: '100%' },
      })
    : h('div', { class: 'pg-widget-image pg-widget-image--empty' }, [
        h('span', 'Image'),
        h('small', 'Set source URL'),
      ]),
})

export const LinkWidget = defineComponent({
  name: 'PlaygroundLinkWidget',
  props: {
    text: { type: String, default: '链接' },
    href: { type: String, default: '#' },
    target: { type: String as PropType<'_self' | '_blank'>, default: '_self' },
    color: { type: String, default: '#1677ff' },
  },
  setup: props => () => h('a', {
    class: 'pg-widget-link',
    href: props.href,
    target: props.target,
    style: { color: props.color },
  }, props.text),
})

export const DividerWidget = defineComponent({
  name: 'PlaygroundDividerWidget',
  props: {
    direction: { type: String, default: 'horizontal' },
    color: { type: String, default: '#e8e8e8' },
    thickness: { type: Number, default: 1 },
  },
  setup: props => () => h('div', {
    class: ['pg-widget-divider', `pg-widget-divider--${props.direction}`],
    style: {
      '--pg-divider-color': props.color,
      '--pg-divider-size': `${props.thickness}px`,
    },
  }),
})

export const basicMaterials: readonly MaterialDefinition[] = [
  defineMaterial({
    type: 'text',
    schema: { defaultProps: { content: '文本内容', fontSize: 14, fontWeight: 'normal', color: '#333333', textAlign: 'left' } },
    authoring: { policy: protectedRemoval },
    panel: { title: '文本', titleKey: 'widget.text.title', group: 'basic', icon: '文', keywords: ['copy', 'paragraph', '文案'] },
    inspector: { formSchema: { sections: [
      { title: '内容', fields: [{ key: 'content', label: '文本内容', component: 'Textarea' }] },
      { title: '样式', fields: [
        { key: 'fontSize', label: '字号', component: 'InputNumber', componentProps: { min: 10, max: 72 } },
        { key: 'fontWeight', label: '字重', component: 'Select', componentProps: { options: [{ label: '常规', value: 'normal' }, { label: '粗体', value: 'bold' }] } },
        { key: 'color', label: '文字颜色', component: 'Input' },
        { key: 'textAlign', label: '对齐方式', component: 'Select', componentProps: { options: [{ label: '左', value: 'left' }, { label: '中', value: 'center' }, { label: '右', value: 'right' }] } },
      ] },
    ] } },
    presentation: { kind: 'visual', preview: TextWidget },
  }),
  defineMaterial({
    type: 'button',
    schema: { defaultProps: { text: '按钮', type: 'button', disabled: false, size: 'medium' } },
    authoring: { policy: protectedRemoval },
    panel: { title: '按钮', titleKey: 'widget.button.title', group: 'basic', icon: '钮', keywords: ['action', 'submit'] },
    inspector: { formSchema: { sections: [{ title: '基础设置', fields: [
      { key: 'text', label: '按钮文字', component: 'Input' },
      { key: 'size', label: '尺寸', component: 'Select', componentProps: { options: [{ label: '小', value: 'small' }, { label: '中', value: 'medium' }, { label: '大', value: 'large' }] } },
      { key: 'disabled', label: '禁用', component: 'Switch' },
    ] }] } },
    presentation: { kind: 'visual', preview: ButtonWidget },
  }),
  defineMaterial({
    type: 'image',
    schema: { defaultProps: { src: '', alt: '', objectFit: 'contain', height: 180 } },
    authoring: { policy: protectedRemoval },
    panel: { title: '图片', titleKey: 'widget.image.title', group: 'basic', icon: '图', keywords: ['image', 'media'] },
    inspector: { formSchema: { sections: [{ title: '基础设置', fields: [
      { key: 'src', label: '图片地址', component: 'Input' },
      { key: 'alt', label: '替代文本', component: 'Input' },
      { key: 'height', label: '高度', component: 'InputNumber', componentProps: { min: 80, max: 600 } },
      { key: 'objectFit', label: '填充方式', component: 'Select', componentProps: { options: [{ label: '覆盖', value: 'cover' }, { label: '包含', value: 'contain' }] } },
    ] }] } },
    presentation: { kind: 'visual', preview: ImageWidget },
  }),
  defineMaterial({
    type: 'link',
    schema: { defaultProps: { text: '链接', href: '#', target: '_self', color: '#1677ff' } },
    authoring: { policy: protectedRemoval },
    panel: { title: '链接', titleKey: 'widget.link.title', group: 'basic', icon: '链', keywords: ['link', 'url'] },
    inspector: { formSchema: { sections: [{ title: '基础设置', fields: [
      { key: 'text', label: '链接文字', component: 'Input' },
      { key: 'href', label: '链接地址', component: 'Input' },
      { key: 'color', label: '颜色', component: 'Input' },
    ] }] } },
    presentation: { kind: 'visual', preview: LinkWidget },
  }),
  defineMaterial({
    type: 'divider',
    schema: { defaultProps: { direction: 'horizontal', color: '#e8e8e8', thickness: 1 } },
    authoring: { policy: protectedRemoval },
    panel: { title: '分割线', titleKey: 'widget.divider.title', group: 'basic', icon: '线' },
    inspector: { formSchema: { sections: [{ title: '基础设置', fields: [
      { key: 'color', label: '颜色', component: 'Input' },
      { key: 'thickness', label: '粗细', component: 'InputNumber', componentProps: { min: 1, max: 10 } },
    ] }] } },
    presentation: { kind: 'visual', preview: DividerWidget },
  }),
]
