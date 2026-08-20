import type { DocumentSchema, MaterialDefinition } from '@dragcraft/designer'
import { DesignerViewportPortal, useSurfaceReservation } from '@dragcraft/designer'
import { defineComponent, h, ref } from 'vue'
import {
  ButtonWidget,
  buttonWidgetMeta,
  DividerWidget,
  dividerWidgetMeta,
  ImageWidget,
  imageWidgetMeta,
  LinkWidget,
  linkWidgetMeta,
  TextWidget,
  textWidgetMeta,
} from '../components/widgets/basic'
import {
  FlexContainer,
  flexContainerMeta,
  SplitContainer,
  splitContainerMeta,
} from '../components/widgets/container'
import {
  FormCheckboxWidget,
  formCheckboxWidgetMeta,
  FormInputWidget,
  formInputWidgetMeta,
  FormRadioWidget,
  formRadioWidgetMeta,
  FormSelectWidget,
  formSelectWidgetMeta,
  FormTextareaWidget,
  formTextareaWidgetMeta,
} from '../components/widgets/form'
import {
  FloatingButtonWidget,
  floatingButtonWidgetMeta,
  NavbarWidget,
  navbarWidgetMeta,
  SwiperWidget,
  swiperWidgetMeta,
  TabBarWidget,
  tabBarWidgetMeta,
} from '../components/widgets/mini-program'

const StickyNavigationFrame = defineComponent({
  name: 'PlaygroundStickyNavigationFrame',
  setup(_, { slots }) {
    const element = ref<HTMLElement | null>(null)
    useSurfaceReservation(element, { edge: 'block-start', fallbackSize: 44 })
    return () => h(DesignerViewportPortal, null, {
      default: () => h('div', {
        ref: element,
        class: 'pg-presentation-frame pg-presentation-frame--sticky-navigation',
      }, slots.default?.()),
    })
  },
})

const BottomNavigationFrame = defineComponent({
  name: 'PlaygroundBottomNavigationFrame',
  setup(_, { slots }) {
    const element = ref<HTMLElement | null>(null)
    useSurfaceReservation(element, { edge: 'block-end', fallbackSize: 50 })
    return () => h(DesignerViewportPortal, null, {
      default: () => h('div', {
        ref: element,
        class: 'pg-presentation-frame pg-presentation-frame--bottom-navigation',
      }, slots.default?.()),
    })
  },
})

const FloatingActionFrame = defineComponent({
  name: 'PlaygroundFloatingActionFrame',
  setup(_, { slots }) {
    return () => h(DesignerViewportPortal, null, {
      default: () => h('div', { class: 'pg-presentation-frame pg-presentation-frame--floating-action' }, slots.default?.()),
    })
  },
})

const ViewportContainerFrame = defineComponent({
  name: 'PlaygroundViewportContainerFrame',
  setup(_, { slots }) {
    return () => h(DesignerViewportPortal, null, {
      default: () => h('div', { class: 'pg-presentation-frame pg-presentation-frame--viewport-container' }, slots.default?.()),
    })
  },
})

function addStyleInspector(material: MaterialDefinition): MaterialDefinition {
  if (material.presentation.kind !== 'visual')
    return material

  const formSchema = material.inspector?.formSchema ?? { sections: [] }
  return {
    ...material,
    inspector: {
      ...material.inspector,
      formSchema: {
        ...formSchema,
        sections: [
          ...formSchema.sections,
          {
            title: '容器样式',
            fields: [
              {
                key: 'containerMargin',
                label: '外边距',
                component: 'Spacing',
                bindTo: { scope: 'node', path: 'style.container' },
                defaultValue: {},
                componentProps: { type: 'margin', min: -120, max: 120 },
              },
              {
                key: 'containerPadding',
                label: '内边距',
                component: 'Spacing',
                bindTo: { scope: 'node', path: 'style.container' },
                defaultValue: {},
                componentProps: { type: 'padding', min: 0, max: 120 },
              },
            ],
          },
          {
            title: '内容样式',
            fields: [
              {
                key: 'contentMargin',
                label: '内容外边距',
                component: 'Spacing',
                bindTo: { scope: 'node', path: 'style.content' },
                defaultValue: {},
                componentProps: { type: 'margin', min: -120, max: 120 },
              },
              {
                key: 'contentPadding',
                label: '内容内边距',
                component: 'Spacing',
                bindTo: { scope: 'node', path: 'style.content' },
                defaultValue: {},
                componentProps: { type: 'padding', min: 0, max: 120 },
              },
            ],
          },
        ],
      },
    },
  }
}

const basePlaygroundNextMaterials: readonly MaterialDefinition[] = [
  {
    type: 'text',
    panel: { title: '文本', group: 'basic', groupTitle: '基础展示', groupTitleKey: 'group.basic', icon: '文' },
    schema: {
      defaultProps: { content: '文本内容', fontSize: 14, fontWeight: 'normal', color: '#333333', textAlign: 'left' },
      defaultStyle: { content: { display: 'block' } },
    },
    inspector: { formSchema: textWidgetMeta.formSchema },
    presentation: { kind: 'visual', preview: TextWidget },
  },
  {
    type: 'button',
    panel: { title: '按钮', group: 'basic', icon: '钮' },
    schema: { defaultProps: { text: '按钮', type: 'button', disabled: false, size: 'medium' } },
    inspector: { formSchema: buttonWidgetMeta.formSchema },
    presentation: { kind: 'visual', preview: ButtonWidget },
  },
  {
    type: 'image',
    panel: { title: '图片', group: 'basic', icon: '图' },
    schema: {
      defaultProps: { src: '', alt: '', objectFit: 'contain' },
      defaultStyle: { content: { width: '100%', height: '150px' } },
    },
    inspector: { formSchema: imageWidgetMeta.formSchema },
    presentation: { kind: 'visual', preview: ImageWidget },
  },
  {
    type: 'link',
    panel: { title: '链接', group: 'basic', icon: '链' },
    schema: { defaultProps: { text: '链接', href: '#', target: '_self', color: '#1890ff' } },
    inspector: { formSchema: linkWidgetMeta.formSchema },
    presentation: { kind: 'visual', preview: LinkWidget },
  },
  {
    type: 'divider',
    panel: { title: '分割线', group: 'basic', icon: '线' },
    schema: {
      defaultProps: { direction: 'horizontal', color: '#e8e8e8', thickness: 1 },
      defaultStyle: { content: { width: '100%' } },
    },
    inspector: { formSchema: dividerWidgetMeta.formSchema },
    presentation: { kind: 'visual', preview: DividerWidget },
  },
  {
    type: 'form-input',
    panel: { title: '输入框', group: 'form', groupTitle: '表单交互', groupTitleKey: 'group.form', icon: '入' },
    schema: {
      defaultProps: { label: '标签', placeholder: '请输入', value: '', required: false, disabled: false },
      defaultStyle: { content: { width: '100%' } },
    },
    inspector: { formSchema: formInputWidgetMeta.formSchema },
    presentation: { kind: 'visual', preview: FormInputWidget },
  },
  {
    type: 'form-textarea',
    panel: { title: '多行文本', group: 'form', icon: '多' },
    schema: {
      defaultProps: { label: '标签', placeholder: '请输入', value: '', rows: 3, required: false, disabled: false },
      defaultStyle: { content: { width: '100%' } },
    },
    inspector: { formSchema: formTextareaWidgetMeta.formSchema },
    presentation: { kind: 'visual', preview: FormTextareaWidget },
  },
  {
    type: 'form-select',
    panel: { title: '下拉选择', group: 'form', icon: '选' },
    schema: {
      defaultProps: { label: '标签', placeholder: '请选择', value: '', options: [], required: false, disabled: false },
      defaultStyle: { content: { width: '100%' } },
    },
    inspector: { formSchema: formSelectWidgetMeta.formSchema },
    presentation: { kind: 'visual', preview: FormSelectWidget },
  },
  {
    type: 'form-checkbox',
    panel: { title: '复选框', group: 'form', icon: '勾' },
    schema: { defaultProps: { label: '标签', checked: false, disabled: false } },
    inspector: { formSchema: formCheckboxWidgetMeta.formSchema },
    presentation: { kind: 'visual', preview: FormCheckboxWidget },
  },
  {
    type: 'form-radio-group',
    panel: { title: '单选组', group: 'form', icon: '单' },
    schema: {
      defaultProps: { label: '标签', value: '', options: [], disabled: false },
      defaultStyle: { content: { width: '100%' } },
    },
    inspector: { formSchema: formRadioWidgetMeta.formSchema },
    presentation: { kind: 'visual', preview: FormRadioWidget },
  },
  {
    type: 'navbar',
    panel: { title: '导航栏', group: 'navigation', groupTitle: '导航容器', groupTitleKey: 'group.navigation', icon: '导' },
    schema: { defaultProps: { title: '页面标题' } },
    authoring: {
      policy: {
        duplicate: 'denied',
        move: 'denied',
      },
    },
    inspector: { formSchema: navbarWidgetMeta.formSchema },
    presentation: {
      kind: 'visual',
      preview: NavbarWidget,
      frame: StickyNavigationFrame,
    },
  },
  {
    type: 'tab-bar',
    panel: { title: 'Tab 栏', group: 'navigation', icon: '栏' },
    schema: { defaultProps: { tabs: [], activeIndex: 0, backgroundColor: '#ffffff', activeColor: '#07C160', inactiveColor: '#8a8f98' } },
    authoring: {
      policy: {
        create: ({ schema }) => schema.nodes.some(node => node.type === 'tab-bar') ? 'denied' : 'allowed',
        duplicate: 'denied',
        move: 'denied',
      },
    },
    inspector: { formSchema: tabBarWidgetMeta.formSchema },
    presentation: {
      kind: 'visual',
      preview: TabBarWidget,
      frame: BottomNavigationFrame,
    },
  },
  {
    type: 'floating-button',
    panel: { title: '浮动按钮', group: 'action', groupTitle: '操作组件', groupTitleKey: 'group.action', icon: '浮' },
    schema: { defaultProps: { label: '+', side: 'right', bottom: 16, sideOffset: 16, size: 52, backgroundColor: '#07C160', textColor: '#ffffff' } },
    authoring: { policy: { move: 'denied' } },
    inspector: { formSchema: floatingButtonWidgetMeta.formSchema },
    presentation: {
      kind: 'visual',
      preview: FloatingButtonWidget,
      frame: FloatingActionFrame,
    },
  },
  {
    type: 'swiper',
    panel: { title: '轮播', group: 'basic', icon: '播' },
    schema: {
      defaultProps: { images: [], showIndicator: true, height: 180 },
      defaultStyle: { content: { width: '100%' } },
    },
    inspector: { formSchema: swiperWidgetMeta.formSchema },
    presentation: { kind: 'visual', preview: SwiperWidget },
  },
  {
    type: 'flex-container',
    panel: { title: 'Flex 容器', group: 'layout', groupTitle: '布局容器', groupTitleKey: 'group.layout', icon: '容' },
    schema: {
      defaultProps: { direction: 'column', wrap: false, gap: 12, align: 'stretch' },
      container: { regions: [{ id: 'default', cardinality: { max: 12 } }] },
    },
    inspector: { formSchema: flexContainerMeta.formSchema },
    presentation: { kind: 'visual', preview: FlexContainer },
  },
  {
    type: 'viewport-flex-container',
    panel: { title: 'Viewport Flex Container', visible: false },
    schema: {
      defaultProps: { direction: 'column', wrap: false, gap: 12, align: 'stretch' },
      container: { regions: [{ id: 'default', cardinality: { max: 12 } }] },
    },
    inspector: { formSchema: flexContainerMeta.formSchema },
    presentation: { kind: 'visual', preview: FlexContainer, frame: ViewportContainerFrame },
  },
  {
    type: 'split-container',
    panel: { title: '异形容器', group: 'layout', icon: '分' },
    schema: {
      defaultProps: { gap: 12, primarySize: '40%' },
      container: {
        regions: [
          { id: 'top', cardinality: { max: 8 } },
          { id: 'bottomLeft', cardinality: { max: 8 } },
          { id: 'bottomRight', cardinality: { max: 8 } },
        ],
      },
    },
    inspector: { formSchema: splitContainerMeta.formSchema },
    presentation: { kind: 'visual', preview: SplitContainer },
  },
  {
    type: 'seo-meta',
    panel: { title: '页面 SEO', group: 'page', groupTitle: '页面设置', icon: 'SEO', description: '设置页面标题和搜索描述' },
    schema: {
      defaultProps: { title: '', description: '' },
    },
    authoring: {
      policy: {
        create: ({ schema }) => schema.nodes.some(node => node.type === 'seo-meta') ? 'denied' : 'allowed',
        duplicate: 'denied',
        move: 'denied',
      },
    },
    inspector: {
      formSchema: {
        sections: [{
          title: '搜索引擎信息',
          fields: [
            { key: 'title', label: '页面标题', component: 'Input' },
            { key: 'description', label: '页面描述', component: 'Textarea', componentProps: { rows: 3 } },
          ],
        }],
      },
    },
    presentation: {
      kind: 'headless',
    },
  },
]

export const playgroundNextMaterials: readonly MaterialDefinition[] = basePlaygroundNextMaterials.map(addStyleInspector)

export const ecommerceNextSchema: DocumentSchema = {
  version: '1',
  globalConfig: { title: '好物精选', description: '小程序商城首页', backgroundColor: '#ffffff' },
  page: { props: {}, style: { surface: { backgroundColor: '#ffffff', backgroundSize: 'cover' } } },
  nodes: [
    { id: 'nav-ecommerce', type: 'navbar', props: { title: '好物精选' } },
    { id: 'tabbar-main', type: 'tab-bar', props: { tabs: [{ label: '首页', icon: 'home' }, { label: '分类', icon: 'category' }, { label: '购物车', icon: 'cart' }, { label: '我的', icon: 'user' }], activeIndex: 0, backgroundColor: '#ffffff', activeColor: '#07C160', inactiveColor: '#999999' }, style: { content: { width: '100%' } } },
    { id: 'floating-cart', type: 'floating-button', props: { label: '+', side: 'right', bottom: 14, sideOffset: 16, size: 52, backgroundColor: '#07C160', textColor: '#ffffff' } },
    { id: 'swiper-banner', type: 'swiper', props: { images: ['https://picsum.photos/seed/store-banner/750/300', 'https://picsum.photos/seed/store-banner2/750/300', 'https://picsum.photos/seed/store-banner3/750/300'], showIndicator: true, height: 180 }, style: { content: { width: '100%' } } },
    { id: 'shop-title', type: 'text', props: { content: '好物精选商城', fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'left' } },
    { id: 'shop-desc', type: 'text', props: { content: '精选好物，品质生活。每日上新，限时特惠！', fontSize: 13, fontWeight: 'normal', color: '#999999', textAlign: 'left' } },
    { id: 'divider-1', type: 'divider', props: { direction: 'horizontal', color: '#f0f0f0', thickness: 1 }, style: { content: { width: '100%' } } },
    { id: 'product-img', type: 'image', props: { src: 'https://picsum.photos/seed/product-1/750/400', alt: '热销商品', objectFit: 'cover' }, style: { content: { width: '100%', height: '200px' } } },
    { id: 'product-name', type: 'text', props: { content: '限量款轻奢手提包 | 头层牛皮', fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'left' } },
    { id: 'product-price', type: 'text', props: { content: '¥ 299.00', fontSize: 18, fontWeight: 'bold', color: '#e64340', textAlign: 'left' } },
    { id: 'buy-btn', type: 'button', props: { text: '立即购买', type: 'button', disabled: false, size: 'large' }, style: { content: { width: '100%' } } },
    { id: 'divider-2', type: 'divider', props: { direction: 'horizontal', color: '#f0f0f0', thickness: 8 }, style: { content: { width: '100%' } } },
    { id: 'member-title', type: 'text', props: { content: '会员登记', fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'left' } },
    { id: 'member-desc', type: 'text', props: { content: '注册会员即享 9 折优惠', fontSize: 13, fontWeight: 'normal', color: '#999999', textAlign: 'left' } },
    { id: 'form-name', type: 'form-input', props: { label: '姓名', placeholder: '请输入您的姓名', value: '', required: true, disabled: false }, style: { content: { width: '100%' } } },
    { id: 'form-phone', type: 'form-input', props: { label: '手机号', placeholder: '请输入手机号码', value: '', required: true, disabled: false }, style: { content: { width: '100%' } } },
    { id: 'form-gender', type: 'form-radio-group', props: { label: '性别', value: '', options: [{ label: '男', value: 'male' }, { label: '女', value: 'female' }], disabled: false }, style: { content: { width: '100%' } } },
    { id: 'form-agree', type: 'form-checkbox', props: { label: '我已阅读并同意《会员服务条款》', checked: false, disabled: false } },
    { id: 'form-submit', type: 'button', props: { text: '提交登记', type: 'submit', disabled: false, size: 'large' }, style: { content: { width: '100%' } } },
  ],
  structure: { root: ['nav-ecommerce', 'tabbar-main', 'floating-cart', 'swiper-banner', 'shop-title', 'shop-desc', 'divider-1', 'product-img', 'product-name', 'product-price', 'buy-btn', 'divider-2', 'member-title', 'member-desc', 'form-name', 'form-phone', 'form-gender', 'form-agree', 'form-submit'], containers: {} },
}

export const contentDetailNextSchema: DocumentSchema = {
  version: '1',
  globalConfig: { title: '精选文章', description: '内容详情页', backgroundColor: '#ffffff' },
  page: { props: {}, style: { surface: { backgroundColor: '#ffffff', backgroundSize: 'cover' } } },
  nodes: [
    { id: 'nav-content', type: 'navbar', props: { title: '精选文章' } },
    { id: 'cover-img', type: 'image', props: { src: 'https://picsum.photos/seed/article-cover/750/400', alt: '文章封面', objectFit: 'cover' }, style: { content: { width: '100%', height: '200px' } } },
    { id: 'article-content', type: 'flex-container', props: { direction: 'column', wrap: false, gap: 12, align: 'stretch' } },
    { id: 'article-title', type: 'text', props: { content: '如何用 Dragcraft 搭建小程序页面', fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'left' } },
    { id: 'author-info', type: 'text', props: { content: 'Dragcraft 团队 · 2026-06-26', fontSize: 12, fontWeight: 'normal', color: '#999999', textAlign: 'left' } },
    { id: 'divider-1', type: 'divider', props: { direction: 'horizontal', color: '#f0f0f0', thickness: 1 }, style: { content: { width: '100%' } } },
    { id: 'body-1', type: 'text', props: { content: 'Dragcraft 是一个面向小程序装修场景的可视化页面搭建引擎。采用 Core Engine + Vue Visual Builder Workbench + Standard Workbench Theme 架构，构建核心与 UI 分离的页面设计引擎。', fontSize: 15, fontWeight: 'normal', color: '#333333', textAlign: 'left' }, style: { content: { lineHeight: '1.8' } } },
    { id: 'inline-img', type: 'image', props: { src: 'https://picsum.photos/seed/dragcraft-demo/750/300', alt: '架构示意图', objectFit: 'cover' }, style: { content: { width: '100%', height: '180px' } } },
    { id: 'body-2', type: 'text', props: { content: '容器的 DOM、CSS、区域和插入几何都由外部物料负责，框架只提供结构协议与交互出口。', fontSize: 15, fontWeight: 'normal', color: '#333333', textAlign: 'left' }, style: { content: { lineHeight: '1.8' } } },
    { id: 'article-actions', type: 'split-container', props: { gap: 8, primarySize: '44%' } },
    { id: 'follow-btn', type: 'button', props: { text: '关注作者', type: 'button', disabled: false, size: 'medium' }, style: { content: { width: '100%' } } },
    { id: 'share-link', type: 'link', props: { text: '分享给朋友', href: '#', target: '_self', color: '#07C160' } },
    { id: 'favorite-link', type: 'link', props: { text: '收藏文章', href: '#', target: '_self', color: '#1677ff' } },
  ],
  structure: {
    root: ['nav-content', 'cover-img', 'article-content', 'article-actions'],
    containers: {
      'article-content': { regions: { default: ['article-title', 'author-info', 'divider-1', 'body-1', 'inline-img', 'body-2'] } },
      'article-actions': { regions: { top: ['follow-btn'], bottomLeft: ['share-link'], bottomRight: ['favorite-link'] } },
    },
  },
}

export const productDetailNextSchema: DocumentSchema = {
  version: '1',
  globalConfig: { title: '商品详情', description: '商品详情页', backgroundColor: '#ffffff' },
  page: { props: {}, style: { surface: { backgroundColor: '#ffffff', backgroundSize: 'cover' } } },
  nodes: [
    { id: 'nav-product', type: 'navbar', props: { title: '商品详情' } },
    { id: 'product-hero', type: 'image', props: { src: 'https://picsum.photos/seed/product-hero/750/750', alt: '商品主图', objectFit: 'cover' }, style: { content: { width: '100%', height: '300px' } } },
    { id: 'price-current', type: 'text', props: { content: '¥ 199.00', fontSize: 24, fontWeight: 'bold', color: '#e64340', textAlign: 'left' } },
    { id: 'price-original', type: 'text', props: { content: '原价 ¥ 399.00', fontSize: 13, fontWeight: 'normal', color: '#999999', textAlign: 'left' }, style: { content: { textDecoration: 'line-through' } } },
    { id: 'product-name', type: 'text', props: { content: '轻奢简约真皮手提包 | 头层牛皮 手工缝制', fontSize: 17, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'left' } },
    { id: 'product-desc', type: 'text', props: { content: '精选头层牛皮，意大利进口五金，大容量内袋设计，适合通勤与日常出行。', fontSize: 13, fontWeight: 'normal', color: '#666666', textAlign: 'left' } },
    { id: 'divider-1', type: 'divider', props: { direction: 'horizontal', color: '#f0f0f0', thickness: 8 }, style: { content: { width: '100%' } } },
    { id: 'spec-color', type: 'form-select', props: { label: '颜色', placeholder: '请选择颜色', value: '', options: [{ label: '经典黑', value: 'black' }, { label: '复古棕', value: 'brown' }, { label: '奶白色', value: 'white' }], required: false, disabled: false }, style: { content: { width: '100%' } } },
    { id: 'spec-size', type: 'form-select', props: { label: '尺寸', placeholder: '请选择尺寸', value: '', options: [{ label: '小号 (20cm)', value: 'S' }, { label: '中号 (25cm)', value: 'M' }, { label: '大号 (30cm)', value: 'L' }], required: false, disabled: false }, style: { content: { width: '100%' } } },
    { id: 'divider-2', type: 'divider', props: { direction: 'horizontal', color: '#f0f0f0', thickness: 1 }, style: { content: { width: '100%' } } },
    { id: 'quantity-note', type: 'text', props: { content: '库存充足，下单后 48 小时内发货', fontSize: 12, fontWeight: 'normal', color: '#999999', textAlign: 'left' } },
    { id: 'divider-3', type: 'divider', props: { direction: 'horizontal', color: '#f0f0f0', thickness: 8 }, style: { content: { width: '100%' } } },
    { id: 'cart-btn', type: 'button', props: { text: '加入购物车', type: 'button', disabled: false, size: 'large' }, style: { content: { width: '100%' } } },
    { id: 'buy-btn', type: 'button', props: { text: '立即购买', type: 'button', disabled: false, size: 'large' }, style: { content: { width: '100%' } } },
    { id: 'product-seo', type: 'seo-meta', props: { title: '商品详情', description: '轻奢简约真皮手提包' } },
  ],
  structure: { root: ['nav-product', 'product-hero', 'price-current', 'price-original', 'product-name', 'product-desc', 'divider-1', 'spec-color', 'spec-size', 'divider-2', 'quantity-note', 'divider-3', 'cart-btn', 'buy-btn', 'product-seo'], containers: {} },
}

export const playgroundNextTemplates = [
  { id: 'ecommerce', label: '电商首页', schema: ecommerceNextSchema },
  { id: 'content-detail', label: '内容详情页', schema: contentDetailNextSchema },
  { id: 'product-detail', label: '商品详情页', schema: productDetailNextSchema },
] as const
