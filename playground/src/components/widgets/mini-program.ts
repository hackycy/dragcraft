import type { PropType } from 'vue'
import type { MaterialEditorMetadata } from './contract'
import { defineComponent, h } from 'vue'
import { IconMaterial, IconNavHome, IconNavRecent, IconPlus } from '../icons'

interface TabItem {
  label: string
  icon: string
}

const DEFAULT_IMAGES = [
  'https://picsum.photos/seed/swiper1/750/300',
  'https://picsum.photos/seed/swiper2/750/300',
  'https://picsum.photos/seed/swiper3/750/300',
]

const DEFAULT_TABS: TabItem[] = [
  { label: '首页', icon: 'home' },
  { label: '我的', icon: 'user' },
]

function normalizeImages(images: string[] | string): string[] {
  if (Array.isArray(images))
    return images.filter(Boolean)
  return images.split('\n').map(item => item.trim()).filter(Boolean)
}

function renderTabIcon(icon: string, active: boolean) {
  const props = { size: 20, color: 'currentColor' }

  if (icon === 'home')
    return h(IconNavHome, props)
  if (icon === 'category')
    return h(IconMaterial, props)
  if (icon === 'cart')
    return h(IconPlus, props)
  if (icon === 'user')
    return h(IconNavRecent, props)

  const text = icon.trim().slice(0, 2).toUpperCase() || (active ? 'ON' : 'IT')
  return h('span', { class: 'pg-widget-tabbar__text-icon' }, text)
}

export const navbarWidgetMeta: MaterialEditorMetadata = {
  type: 'navbar',
  title: '导航栏',
  titleKey: 'widget.navbar.title',
  group: 'navigation',
  icon: 'navbar',
  authoring: 'schema-managed',
  material: {
    icon: '导',
    description: '配置页面顶部标题和系统胶囊',
    descriptionKey: 'widget.navbar.material.description',
    tags: ['框架'],
    keywords: ['navigation', 'header', 'top bar', '导航'],
  },
  defaultProps: {
    title: '页面标题',
  },
  formSchema: {
    sections: [
      {
        title: '标题设置',
        fields: [
          {
            key: 'title',
            label: '标题',
            component: 'Input',
            defaultValue: '页面标题',
            componentProps: { placeholder: '请输入标题' },
          },
        ],
      },
    ],
  },
}

export const NavbarWidget = defineComponent({
  name: 'PlaygroundNavbarWidget',
  props: {
    title: { type: String as PropType<string>, default: '页面标题' },
  },
  setup(props) {
    return () => h('div', { class: 'pg-widget-navbar' }, [
      h('div', { class: 'pg-widget-navbar__title-wrap' }, [
        h('div', { class: 'pg-widget-navbar__title' }, props.title),
      ]),
      h('div', { 'class': 'pg-widget-navbar__capsule', 'aria-hidden': 'true' }, [
        h('span', { class: 'pg-widget-navbar__capsule-more' }),
        h('span', { class: 'pg-widget-navbar__capsule-divider' }),
        h('span', { class: 'pg-widget-navbar__capsule-circle' }),
      ]),
    ])
  },
})

export const tabBarWidgetMeta: MaterialEditorMetadata = {
  type: 'tab-bar',
  title: 'Tab 栏',
  titleKey: 'widget.tab-bar.title',
  group: 'navigation',
  icon: 'tabbar',
  material: {
    icon: '栏',
    description: '配置底部多页面导航入口',
    descriptionKey: 'widget.tab-bar.material.description',
    tags: ['框架'],
    keywords: ['tab', 'bottom navigation', 'tabs', '底部导航'],
  },
  creatable: (ctx: any) => {
    const children = ctx.schema.structure?.root ?? []
    return children.some((child: any) => child.type === 'tab-bar')
      ? {
          allowed: false,
          code: 'singleton.tab-bar',
          messageKey: 'forbidden.tabBarExists',
          message: '页面只能配置一个 Tab 栏',
        }
      : true
  },
  defaultProps: {
    tabs: DEFAULT_TABS,
    activeIndex: 0,
    backgroundColor: '#ffffff',
    activeColor: '#07C160',
    inactiveColor: '#8a8f98',
  },
  defaultStyle: { content: { width: '100%' } },
  formSchema: {
    sections: [
      {
        title: 'Tab 配置',
        fields: [
          {
            key: 'tabs',
            label: 'Tab 列表',
            component: 'Array',
            componentProps: {
              title: 'Tab 列表',
              itemFields: [
                { key: 'label', label: '标签文字', component: 'Input', componentProps: { placeholder: '请输入标签文字' } },
                { key: 'icon', label: '图标', component: 'Input', componentProps: { placeholder: 'home/category/cart/user' } },
              ],
              defaultItem: { label: '新标签', icon: 'home' },
              sortable: true,
              minItems: 2,
              maxItems: 5,
            },
          },
          { key: 'activeIndex', label: '当前选中', component: 'InputNumber', defaultValue: 0, componentProps: { min: 0, max: 10 } },
        ],
      },
      {
        title: '样式设置',
        fields: [
          { key: 'backgroundColor', label: '背景颜色', component: 'Color', defaultValue: '#ffffff' },
          { key: 'activeColor', label: '选中颜色', component: 'Color', defaultValue: '#07C160' },
          { key: 'inactiveColor', label: '未选中颜色', component: 'Color', defaultValue: '#8a8f98' },
        ],
      },
    ],
  },
}

export const TabBarWidget = defineComponent({
  name: 'PlaygroundTabBarWidget',
  props: {
    tabs: { type: Array as PropType<TabItem[]>, default: () => DEFAULT_TABS },
    activeIndex: { type: Number as PropType<number>, default: 0 },
    backgroundColor: { type: String as PropType<string>, default: '#ffffff' },
    activeColor: { type: String as PropType<string>, default: '#07C160' },
    inactiveColor: { type: String as PropType<string>, default: '#8a8f98' },
  },
  setup(props) {
    return () =>
      h('nav', {
        class: 'pg-widget-tabbar',
        style: { backgroundColor: props.backgroundColor },
      }, props.tabs.map((tab, index) => {
        const active = index === props.activeIndex
        return h('div', {
          key: `${tab.label}-${index}`,
          class: ['pg-widget-tabbar__item', { 'pg-widget-tabbar__item--active': active }],
          style: { color: active ? props.activeColor : props.inactiveColor },
        }, [
          h('span', { class: 'pg-widget-tabbar__icon' }, [renderTabIcon(tab.icon, active)]),
          h('span', { class: 'pg-widget-tabbar__label' }, tab.label),
        ])
      }))
  },
})

export const floatingButtonWidgetMeta: MaterialEditorMetadata = {
  type: 'floating-button',
  title: '浮动按钮',
  titleKey: 'widget.floating-button.title',
  group: 'action',
  icon: 'fab',
  material: {
    icon: '浮',
    description: '悬浮在页面上的快捷操作入口',
    descriptionKey: 'widget.floating-button.material.description',
    tags: ['操作'],
    keywords: ['fab', 'floating action', 'quick action', '悬浮'],
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
        fields: [{ key: 'label', label: '按钮文字', component: 'Input', defaultValue: '+' }],
      },
      {
        title: '位置',
        fields: [
          {
            key: 'side',
            label: '水平位置',
            component: 'Select',
            defaultValue: 'right',
            componentProps: { options: [{ label: '右侧', value: 'right' }, { label: '左侧', value: 'left' }] },
          },
          { key: 'bottom', label: '底部距离', component: 'InputNumber', defaultValue: 16, componentProps: { min: 0, max: 120 } },
          { key: 'sideOffset', label: '侧边距离', component: 'InputNumber', defaultValue: 16, componentProps: { min: 0, max: 120 } },
        ],
      },
      {
        title: '样式',
        fields: [
          { key: 'size', label: '尺寸', component: 'InputNumber', defaultValue: 52, componentProps: { min: 36, max: 88 } },
          { key: 'backgroundColor', label: '背景颜色', component: 'Color', defaultValue: '#07C160' },
          { key: 'textColor', label: '文字颜色', component: 'Color', defaultValue: '#ffffff' },
        ],
      },
    ],
  },
}

export const FloatingButtonWidget = defineComponent({
  name: 'PlaygroundFloatingButtonWidget',
  props: {
    label: { type: String as PropType<string>, default: '+' },
    side: { type: String as PropType<'left' | 'right'>, default: 'right' },
    bottom: { type: Number as PropType<number>, default: 16 },
    sideOffset: { type: Number as PropType<number>, default: 16 },
    size: { type: Number as PropType<number>, default: 52 },
    backgroundColor: { type: String as PropType<string>, default: '#07C160' },
    textColor: { type: String as PropType<string>, default: '#ffffff' },
  },
  setup(props) {
    return () => {
      const horizontal = props.side === 'left'
        ? { left: `calc(var(--dc-inset-inline-start) + ${props.sideOffset}px)` }
        : { right: `calc(var(--dc-inset-inline-end) + ${props.sideOffset}px)` }

      return h('button', {
        class: 'pg-widget-floating-button',
        type: 'button',
        style: {
          ...horizontal,
          bottom: `calc(var(--dc-inset-block-end) + ${props.bottom}px)`,
          width: `${props.size}px`,
          height: `${props.size}px`,
          backgroundColor: props.backgroundColor,
          color: props.textColor,
        },
      }, props.label === '+'
        ? h(IconPlus, { size: Math.max(18, props.size * 0.42), color: 'currentColor' })
        : h('span', { style: { fontSize: `${Math.max(12, props.size * 0.32)}px` } }, props.label))
    }
  },
})

export const swiperWidgetMeta: MaterialEditorMetadata = {
  type: 'swiper',
  title: '轮播',
  titleKey: 'widget.swiper.title',
  group: 'basic',
  icon: 'swiper',
  material: {
    icon: '播',
    description: '展示多张活动图或商品图',
    descriptionKey: 'widget.swiper.material.description',
    tags: ['媒体'],
    keywords: ['carousel', 'banner', 'swiper', '轮播'],
  },
  defaultProps: {
    images: DEFAULT_IMAGES,
    showIndicator: true,
    height: 180,
  },
  defaultStyle: { content: { width: '100%' } },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        fields: [
          {
            key: 'images',
            label: '图片列表',
            component: 'Textarea',
            defaultValue: DEFAULT_IMAGES,
            valueFormat: (value: unknown) => Array.isArray(value) ? value.join('\n') : value,
            parseValue: (value: unknown) => String(value ?? '').split('\n').map(item => item.trim()).filter(Boolean),
            componentProps: { rows: 4, placeholder: '每行一个图片 URL' },
          },
        ],
      },
      {
        title: '样式设置',
        fields: [
          { key: 'showIndicator', label: '显示指示器', component: 'Switch', defaultValue: true },
          { key: 'height', label: '高度 (px)', component: 'InputNumber', defaultValue: 180, componentProps: { min: 80, max: 500 } },
          { key: 'borderRadius', label: '圆角 (px)', component: 'InputNumber', componentProps: { min: 0, max: 50 } },
        ],
      },
    ],
  },
}

export const SwiperWidget = defineComponent({
  name: 'PlaygroundSwiperWidget',
  props: {
    images: { type: [Array, String] as PropType<string[] | string>, default: () => DEFAULT_IMAGES },
    showIndicator: { type: Boolean as PropType<boolean>, default: true },
    height: { type: Number as PropType<number>, default: 180 },
    borderRadius: Number as PropType<number | undefined>,
  },
  setup(props) {
    return () => {
      const images = normalizeImages(props.images)
      return h('div', {
        class: 'pg-widget-swiper',
        style: {
          height: `${props.height}px`,
          ...(props.borderRadius === undefined ? {} : { borderRadius: `${props.borderRadius}px` }),
        },
      }, [
        images[0]
          ? h('img', { src: images[0], alt: 'carousel item', class: 'pg-widget-swiper__image' })
          : h('div', { class: 'pg-widget-swiper__empty' }, 'Carousel'),
        props.showIndicator && images.length > 1
          ? h('div', { class: 'pg-widget-swiper__indicators' }, images.map((_, index) => h('span', {
              key: index,
              class: ['pg-widget-swiper__dot', { 'pg-widget-swiper__dot--active': index === 0 }],
            })))
          : null,
      ])
    }
  },
})
