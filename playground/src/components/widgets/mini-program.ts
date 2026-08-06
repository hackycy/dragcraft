import type { JsonObject, MaterialDefinition } from '@dragcraft/designer'
import type { PropType } from 'vue'
import {
  defineMaterial,
  DesignerViewportPortal,
  useSurfaceReservation,
} from '@dragcraft/designer'
import { defineComponent, h, ref } from 'vue'
import { IconMaterial, IconNavHome, IconNavRecent, IconPlus } from '../icons'

interface TabItem extends JsonObject {
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
const protectedRemoval = { remove: 'confirmation-required' as const }

function edgeFrame(
  name: string,
  edge: 'block-start' | 'block-end',
  className: string,
  fallbackSize: number,
) {
  return defineComponent({
    name,
    setup(_, { slots }) {
      const element = ref<HTMLElement | null>(null)
      const reservation = useSurfaceReservation(element, { edge, fallbackSize })
      return () => h(DesignerViewportPortal, null, {
        default: () => h('div', {
          ref: element,
          class: className,
          style: edge === 'block-start'
            ? { insetBlockStart: `${reservation.offset.value}px` }
            : { insetBlockEnd: `${reservation.offset.value}px` },
        }, slots.default?.()),
      })
    },
  })
}

const NavbarFrame = edgeFrame('PlaygroundNavbarFrame', 'block-start', 'pg-frame pg-frame--navbar', 44)
const TabBarFrame = edgeFrame('PlaygroundTabBarFrame', 'block-end', 'pg-frame pg-frame--tabbar', 56)
const PurchaseBarFrame = edgeFrame('PlaygroundPurchaseBarFrame', 'block-end', 'pg-frame pg-frame--purchase-bar', 64)

const FloatingFrame = defineComponent({
  name: 'PlaygroundFloatingFrame',
  setup: (_, { slots }) => () => h(DesignerViewportPortal, null, {
    default: () => h('div', { class: 'pg-frame pg-frame--floating' }, slots.default?.()),
  }),
})

const DialogFrame = defineComponent({
  name: 'PlaygroundDialogFrame',
  setup: (_, { slots }) => () => h(DesignerViewportPortal, null, {
    default: () => h('div', { class: 'pg-frame pg-frame--dialog' }, slots.default?.()),
  }),
})

function renderTabIcon(icon: string) {
  const props = { size: 20, color: 'currentColor' }
  if (icon === 'home')
    return h(IconNavHome, props)
  if (icon === 'category')
    return h(IconMaterial, props)
  if (icon === 'cart')
    return h(IconPlus, props)
  if (icon === 'user')
    return h(IconNavRecent, props)
  return h('span', { class: 'pg-widget-tabbar__text-icon' }, icon.trim().slice(0, 2).toUpperCase())
}

export const NavbarWidget = defineComponent({
  name: 'PlaygroundNavbarWidget',
  props: { title: { type: String, default: '页面标题' } },
  setup: props => () => h('div', { class: 'pg-widget-navbar' }, [
    h('div', { class: 'pg-widget-navbar__title-wrap' }, [h('div', { class: 'pg-widget-navbar__title' }, props.title)]),
    h('div', { 'class': 'pg-widget-navbar__capsule', 'aria-hidden': 'true' }, [
      h('span', { class: 'pg-widget-navbar__capsule-more' }),
      h('span', { class: 'pg-widget-navbar__capsule-divider' }),
      h('span', { class: 'pg-widget-navbar__capsule-circle' }),
    ]),
  ]),
})

export const TabBarWidget = defineComponent({
  name: 'PlaygroundTabBarWidget',
  props: {
    tabs: { type: Array as PropType<TabItem[]>, default: () => DEFAULT_TABS },
    activeIndex: { type: Number, default: 0 },
    backgroundColor: { type: String, default: '#ffffff' },
    activeColor: { type: String, default: '#07c160' },
    inactiveColor: { type: String, default: '#8a8f98' },
  },
  setup: props => () => h('nav', {
    class: 'pg-widget-tabbar',
    style: { backgroundColor: props.backgroundColor },
  }, props.tabs.map((tab, index) => {
    const active = index === props.activeIndex
    return h('div', {
      key: `${tab.label}-${index}`,
      class: ['pg-widget-tabbar__item', { 'pg-widget-tabbar__item--active': active }],
      style: { color: active ? props.activeColor : props.inactiveColor },
    }, [
      h('span', { class: 'pg-widget-tabbar__icon' }, [renderTabIcon(tab.icon)]),
      h('span', { class: 'pg-widget-tabbar__label' }, tab.label),
    ])
  })),
})

export const FloatingButtonWidget = defineComponent({
  name: 'PlaygroundFloatingButtonWidget',
  props: {
    label: { type: String, default: '+' },
    side: { type: String as PropType<'left' | 'right'>, default: 'right' },
    bottom: { type: Number, default: 16 },
    sideOffset: { type: Number, default: 16 },
    size: { type: Number, default: 52 },
    backgroundColor: { type: String, default: '#07c160' },
    textColor: { type: String, default: '#ffffff' },
  },
  setup: props => () => h('button', {
    class: 'pg-widget-floating-button',
    type: 'button',
    style: {
      [props.side]: `${props.sideOffset}px`,
      bottom: `${props.bottom}px`,
      width: `${props.size}px`,
      height: `${props.size}px`,
      backgroundColor: props.backgroundColor,
      color: props.textColor,
    },
  }, props.label === '+' ? h(IconPlus, { size: 22, color: 'currentColor' }) : props.label),
})

export const SwiperWidget = defineComponent({
  name: 'PlaygroundSwiperWidget',
  props: {
    images: { type: Array as PropType<string[]>, default: () => DEFAULT_IMAGES },
    showIndicator: { type: Boolean, default: true },
    height: { type: Number, default: 180 },
  },
  setup: props => () => h('div', { class: 'pg-widget-swiper', style: { height: `${props.height}px` } }, [
    props.images[0]
      ? h('img', { class: 'pg-widget-swiper__image', src: props.images[0], alt: 'carousel item' })
      : h('div', { class: 'pg-widget-swiper__empty' }, 'Carousel'),
    props.showIndicator && props.images.length > 1
      ? h('div', { class: 'pg-widget-swiper__indicators' }, props.images.map((_, index) => h('span', {
          key: index,
          class: ['pg-widget-swiper__dot', { 'pg-widget-swiper__dot--active': index === 0 }],
        })))
      : null,
  ]),
})

const PurchaseBarWidget = defineComponent({
  name: 'PlaygroundPurchaseBarWidget',
  props: {
    secondaryLabel: { type: String, default: '加入购物车' },
    primaryLabel: { type: String, default: '立即购买' },
  },
  setup: props => () => h('div', { class: 'pg-widget-purchase-bar' }, [
    h('button', { class: 'pg-widget-purchase-bar__secondary', type: 'button' }, props.secondaryLabel),
    h('button', { class: 'pg-widget-purchase-bar__primary', type: 'button' }, props.primaryLabel),
  ]),
})

const DialogWidget = defineComponent({
  name: 'PlaygroundDialogWidget',
  props: {
    title: { type: String, default: '限时优惠' },
    content: { type: String, default: '现在下单可享会员折扣。' },
  },
  setup: props => () => h('div', { class: 'pg-widget-dialog' }, [
    h('div', { class: 'pg-widget-dialog__mask' }),
    h('section', { class: 'pg-widget-dialog__panel' }, [
      h('strong', props.title),
      h('p', props.content),
    ]),
  ]),
})

export const miniProgramMaterials: readonly MaterialDefinition[] = [
  defineMaterial({
    type: 'navbar',
    schema: { defaultProps: { title: '页面标题' } },
    authoring: { policy: protectedRemoval },
    inspector: { formSchema: { sections: [{ title: '标题设置', fields: [{ key: 'title', label: '标题', component: 'Input' }] }] } },
    presentation: { kind: 'visual', preview: NavbarWidget, frame: NavbarFrame },
  }),
  defineMaterial({
    type: 'tab-bar',
    schema: { defaultProps: { tabs: DEFAULT_TABS, activeIndex: 0, backgroundColor: '#ffffff', activeColor: '#07c160', inactiveColor: '#8a8f98' } },
    authoring: {
      policy: {
        ...protectedRemoval,
        create: context => context.schema.nodes.some(node => node.type === 'tab-bar') ? 'denied' : 'allowed',
      },
    },
    panel: { title: 'Tab 栏', titleKey: 'widget.tab-bar.title', group: 'navigation', icon: '栏' },
    inspector: { formSchema: { sections: [{ title: 'Tab 配置', fields: [
      { key: 'activeIndex', label: '当前选中', component: 'InputNumber' },
      { key: 'backgroundColor', label: '背景颜色', component: 'Input' },
      { key: 'activeColor', label: '选中颜色', component: 'Input' },
    ] }] } },
    presentation: { kind: 'visual', preview: TabBarWidget, frame: TabBarFrame },
  }),
  defineMaterial({
    type: 'floating-button',
    schema: { defaultProps: { label: '+', side: 'right', bottom: 16, sideOffset: 16, size: 52, backgroundColor: '#07c160', textColor: '#ffffff' } },
    authoring: { policy: protectedRemoval },
    panel: { title: '浮动按钮', titleKey: 'widget.floating-button.title', group: 'action', icon: '浮' },
    presentation: { kind: 'visual', preview: FloatingButtonWidget, frame: FloatingFrame },
  }),
  defineMaterial({
    type: 'swiper',
    schema: { defaultProps: { images: DEFAULT_IMAGES, showIndicator: true, height: 180 } },
    authoring: { policy: protectedRemoval },
    panel: { title: '轮播', titleKey: 'widget.swiper.title', group: 'basic', icon: '播' },
    inspector: { formSchema: { sections: [{ title: '基础设置', fields: [
      { key: 'showIndicator', label: '显示指示器', component: 'Switch' },
      { key: 'height', label: '高度', component: 'InputNumber' },
    ] }] } },
    presentation: { kind: 'visual', preview: SwiperWidget },
  }),
  defineMaterial({
    type: 'purchase-bar',
    schema: { defaultProps: { secondaryLabel: '加入购物车', primaryLabel: '立即购买' } },
    authoring: { policy: protectedRemoval },
    panel: { title: '购买栏', group: 'action', icon: '购' },
    presentation: { kind: 'visual', preview: PurchaseBarWidget, frame: PurchaseBarFrame },
  }),
  defineMaterial({
    type: 'promo-dialog',
    schema: { defaultProps: { title: '限时优惠', content: '现在下单可享会员折扣。' } },
    authoring: { policy: protectedRemoval },
    panel: { title: '浮层对话框', group: 'action', icon: '窗' },
    presentation: { kind: 'visual', preview: DialogWidget, frame: DialogFrame },
  }),
  defineMaterial({
    type: 'analytics-config',
    schema: { defaultProps: { eventName: 'page_view' } },
    authoring: { policy: protectedRemoval },
    panel: { title: '分析配置', group: 'action', icon: '析' },
    inspector: { formSchema: { sections: [{ title: '事件设置', fields: [{ key: 'eventName', label: '事件名', component: 'Input' }] }] } },
    presentation: { kind: 'headless' },
  }),
]
