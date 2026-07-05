import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { IconMaterial, IconNavBack, IconNavHome, IconNavRecent, IconPlus } from '@dragcraft/icons'
import { defineComponent, h } from 'vue'

interface TabItem {
  label: string
  icon: string
}

interface NavbarTitleConfig {
  title?: string
  subtitle?: string
  titleFontSize?: number
  titleFontWeight?: string
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

export const navbarWidgetMeta: WidgetMeta = {
  type: 'navbar',
  title: '导航栏',
  titleKey: 'widget.navbar.title',
  group: 'navigation',
  icon: 'navbar',
  draggable: false,
  sortable: false,
  defaultLayout: {
    placement: {
      kind: 'chrome',
      edge: 'block-start',
      position: 'fixed',
      reserve: { mode: 'measure', size: 44 },
      avoidContent: true,
    },
  },
  creatable: (ctx) => {
    const children = ctx.schema.root.children ?? []
    return !children.some(child => child.type === 'navbar')
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
  defaultStyle: { width: '100%' },
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
            valueFormat: (value: unknown, ctx: { values: Record<string, unknown> }) => ({
              title: ctx.values.title,
              subtitle: ctx.values.subtitle,
              titleFontSize: ctx.values.titleFontSize,
              titleFontWeight: ctx.values.titleFontWeight,
              ...(typeof value === 'object' && value !== null ? value : {}),
            }),
          },
        ],
      },
      {
        title: '基础设置',
        fields: [
          { key: 'showBack', label: '显示返回按钮', component: 'switch', defaultValue: false },
        ],
      },
      {
        title: '样式设置',
        fields: [
          { key: 'backgroundColor', label: '背景颜色', component: 'color', defaultValue: '#ffffff' },
          { key: 'textColor', label: '文字颜色', component: 'color', defaultValue: '#1a1a1a' },
          { key: 'transparent', label: '透明背景', component: 'switch', defaultValue: false },
        ],
      },
    ],
  },
}

export const NavbarWidget = defineComponent({
  name: 'PlaygroundNavbarWidget',
  props: {
    title: { type: String as PropType<string>, default: '页面标题' },
    subtitle: { type: String as PropType<string>, default: '' },
    titleFontSize: { type: Number as PropType<number>, default: 16 },
    titleFontWeight: { type: String as PropType<string>, default: '600' },
    titleConfig: { type: Object as PropType<NavbarTitleConfig>, default: undefined },
    showBack: { type: Boolean as PropType<boolean>, default: false },
    backgroundColor: { type: String as PropType<string>, default: '#ffffff' },
    textColor: { type: String as PropType<string>, default: '#1a1a1a' },
    transparent: { type: Boolean as PropType<boolean>, default: false },
  },
  setup(props) {
    return () => {
      const title = props.titleConfig?.title ?? props.title
      const subtitle = props.titleConfig?.subtitle ?? props.subtitle
      const titleFontSize = props.titleConfig?.titleFontSize ?? props.titleFontSize
      const titleFontWeight = props.titleConfig?.titleFontWeight ?? props.titleFontWeight

      return h('div', {
        class: ['pg-widget-navbar', { 'pg-widget-navbar--transparent': props.transparent }],
        style: {
          backgroundColor: props.transparent ? 'transparent' : props.backgroundColor,
          color: props.textColor,
        },
      }, [
        props.showBack
          ? h('button', { class: 'pg-widget-navbar__back', type: 'button', style: { color: props.textColor } }, [
              h(IconNavBack, { size: 18, color: 'currentColor' }),
            ])
          : null,
        h('div', { class: 'pg-widget-navbar__title-wrap' }, [
          h('div', {
            class: 'pg-widget-navbar__title',
            style: { fontSize: `${titleFontSize}px`, fontWeight: titleFontWeight },
          }, title),
          subtitle ? h('div', { class: 'pg-widget-navbar__subtitle' }, subtitle) : null,
        ]),
      ])
    }
  },
})

export const tabBarWidgetMeta: WidgetMeta = {
  type: 'tab-bar',
  title: 'Tab 栏',
  titleKey: 'widget.tab-bar.title',
  group: 'navigation',
  icon: 'tabbar',
  defaultLayout: {
    placement: {
      kind: 'chrome',
      edge: 'block-end',
      position: 'fixed',
      reserve: { mode: 'measure', size: 50 },
      avoidContent: true,
    },
  },
  creatable: (ctx) => {
    const children = ctx.schema.root.children ?? []
    return !children.some(child => child.type === 'tab-bar')
  },
  defaultProps: {
    tabs: DEFAULT_TABS,
    activeIndex: 0,
    backgroundColor: '#ffffff',
    activeColor: '#07C160',
    inactiveColor: '#8a8f98',
  },
  defaultStyle: { width: '100%' },
  formSchema: {
    sections: [
      {
        title: 'Tab 配置',
        fields: [
          {
            key: 'tabs',
            label: 'Tab 列表',
            component: 'array',
            props: {
              itemFields: [
                { key: 'label', label: '标签文字', component: 'input', props: { placeholder: '请输入标签文字' } },
                { key: 'icon', label: '图标', component: 'input', props: { placeholder: 'home/category/cart/user' } },
              ],
              defaultItem: { label: '新标签', icon: 'home' },
              sortable: true,
              minItems: 2,
              maxItems: 5,
            },
          },
          { key: 'activeIndex', label: '当前选中', component: 'number', defaultValue: 0, props: { min: 0, max: 10 } },
        ],
      },
      {
        title: '样式设置',
        fields: [
          { key: 'backgroundColor', label: '背景颜色', component: 'color', defaultValue: '#ffffff' },
          { key: 'activeColor', label: '选中颜色', component: 'color', defaultValue: '#07C160' },
          { key: 'inactiveColor', label: '未选中颜色', component: 'color', defaultValue: '#8a8f98' },
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

export const floatingButtonWidgetMeta: WidgetMeta = {
  type: 'floating-button',
  title: '浮动按钮',
  titleKey: 'widget.floating-button.title',
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
        fields: [{ key: 'label', label: '按钮文字', component: 'input', defaultValue: '+' }],
      },
      {
        title: '位置',
        fields: [
          {
            key: 'side',
            label: '水平位置',
            component: 'select',
            defaultValue: 'right',
            props: { options: [{ label: '右侧', value: 'right' }, { label: '左侧', value: 'left' }] },
          },
          { key: 'bottom', label: '底部距离', component: 'number', defaultValue: 16, props: { min: 0, max: 120 } },
          { key: 'sideOffset', label: '侧边距离', component: 'number', defaultValue: 16, props: { min: 0, max: 120 } },
        ],
      },
      {
        title: '样式',
        fields: [
          { key: 'size', label: '尺寸', component: 'number', defaultValue: 52, props: { min: 36, max: 88 } },
          { key: 'backgroundColor', label: '背景颜色', component: 'color', defaultValue: '#07C160' },
          { key: 'textColor', label: '文字颜色', component: 'color', defaultValue: '#ffffff' },
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

export const swiperWidgetMeta: WidgetMeta = {
  type: 'swiper',
  title: '轮播',
  titleKey: 'widget.swiper.title',
  group: 'basic',
  icon: 'swiper',
  defaultProps: {
    images: DEFAULT_IMAGES,
    showIndicator: true,
    height: 180,
    borderRadius: 0,
  },
  defaultStyle: { width: '100%' },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        fields: [
          {
            key: 'images',
            label: '图片列表',
            component: 'textarea',
            defaultValue: DEFAULT_IMAGES,
            valueFormat: (value: unknown) => Array.isArray(value) ? value.join('\n') : value,
            parseValue: (value: unknown) => String(value ?? '').split('\n').map(item => item.trim()).filter(Boolean),
            props: { rows: 4, placeholder: '每行一个图片 URL' },
          },
        ],
      },
      {
        title: '样式设置',
        fields: [
          { key: 'showIndicator', label: '显示指示器', component: 'switch', defaultValue: true },
          { key: 'height', label: '高度 (px)', component: 'number', defaultValue: 180, props: { min: 80, max: 500 } },
          { key: 'borderRadius', label: '圆角 (px)', component: 'number', defaultValue: 0, props: { min: 0, max: 50 } },
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
    borderRadius: { type: Number as PropType<number>, default: 0 },
  },
  setup(props) {
    return () => {
      const images = normalizeImages(props.images)
      return h('div', {
        class: 'pg-widget-swiper',
        style: { height: `${props.height}px`, borderRadius: `${props.borderRadius}px` },
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

export const miniProgramWidgetDefinitions = [
  { meta: navbarWidgetMeta, component: NavbarWidget },
  { meta: tabBarWidgetMeta, component: TabBarWidget },
  { meta: floatingButtonWidgetMeta, component: FloatingButtonWidget },
  { meta: swiperWidgetMeta, component: SwiperWidget },
]
