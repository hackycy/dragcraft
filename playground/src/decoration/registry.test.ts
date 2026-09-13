// @vitest-environment happy-dom

import type { MaterialDefinition } from '@dragcraft/designer'
import type { Component } from 'vue'
import { isMaterialPanelVisible } from '@dragcraft/designer'
import { describe, expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'

import { createDefaultDiyV2BackgroundConfig } from './background'
import { createDecorationDesigner } from './designer'
import { createDecorationFieldComponentMap } from './fields'
import CarouselItemsField from './materials/Carousel/CarouselItemsField.vue'
import NavBarPreview from './materials/NavBar/NavBarPreview.vue'
import NavigationItemsField from './materials/NavigationGroup/NavigationItemsField.vue'
import {
  NAVIGATION_GROUP_DEFAULT_PROPS,
  normalizeNavigationItems,
  truncateNavigationTitle,
} from './materials/NavigationGroup/types'
import NoticeItemsField from './materials/Notice/NoticeItemsField.vue'
import { normalizeNoticeItems, NOTICE_DEFAULT_PROPS } from './materials/Notice/types'
import TabBarItemsField from './materials/TabBar/TabBarItemsField.vue'
import { normalizeTabBarItems, TAB_BAR_DEFAULT_PROPS } from './materials/TabBar/types'
import { DECORATION_MATERIALS } from './registry'

/**
 * vue-draggable-plus 底层的 SortableJS 需要真实浏览器的布局能力，在 happy-dom 下会抛
 * `Sortable: el must be an HTMLElement`。所以测试里把它换成一个只渲染默认插槽的透明组件：
 * items 字段的卡片渲染逻辑仍然可断言，**拖拽行为本身只能人工验**。
 */
vi.mock('vue-draggable-plus', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    VueDraggable: defineComponent({
      name: 'StubVueDraggable',
      inheritAttrs: false,
      setup(_, { attrs, slots }) {
        return () => h('div', { class: attrs.class }, slots.default?.())
      },
    }),
  }
})

/**
 * 机器守卫：遍历注册表而不是硬编码物料名，所以每注册一个物料就自动被覆盖。
 * 这里能抓的是"结构坏了"——类型重复、面板元数据缺失、检查器字段名解析不到、
 * 默认值不是合法 JSON、Preview 挂不起来。物料的视觉是否正确只有人能判断。
 */
const CASES: Array<[string, MaterialDefinition]> = DECORATION_MATERIALS.map(material => [
  material.type,
  material,
])

function inspectorFields(material: MaterialDefinition) {
  return (material.inspector?.formSchema?.sections ?? []).flatMap(section => section.fields)
}

function findMaterial(type: string): MaterialDefinition {
  const material = DECORATION_MATERIALS.find(item => item.type === type)
  if (!material) {
    throw new Error(`物料未注册: ${type}`)
  }
  return material
}

function mountComponent(component: Component, props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(component, props) })
  app.mount(host)

  return { app, host }
}

function mountPreview(material: MaterialDefinition) {
  const { presentation } = material
  if (presentation.kind !== 'visual') {
    throw new Error(`${material.type} 不是 visual 物料`)
  }

  return mountComponent(presentation.preview)
}

describe('decoration material registry', () => {
  it('is accepted as a whole catalog by the designer', () => {
    // createDesigner 内部会 createMaterialCatalog，任何物料定义非法都会抛
    // DesignerConfigurationError。
    expect(() => createDecorationDesigner()).not.toThrow()
  })

  it('registers unique miniapp.* material types', () => {
    const types = DECORATION_MATERIALS.map(material => material.type)

    expect(new Set(types).size).toBe(types.length)
    for (const type of types) {
      expect(type).toMatch(/^miniapp\.[a-z-]+$/)
    }
  })

  it.each(CASES)('%s exposes complete panel metadata', (_type, material) => {
    expect(material.panel?.title).toBeTruthy()
    expect(material.panel?.group).toBeTruthy()
    expect(material.panel?.groupTitle).toBeTruthy()
    expect(material.panel?.icon).toBeTruthy()
  })

  it.each(CASES)('%s is visible in the material panel', (_type, material) => {
    expect(isMaterialPanelVisible(material, null)).toBe(true)
  })

  it.each(CASES)('%s resolves every inspector field component', (_type, material) => {
    const fieldMap = createDecorationFieldComponentMap()
    const fields = inspectorFields(material)

    expect(fields.length).toBeGreaterThan(0)
    for (const field of fields) {
      if (typeof field.component === 'string') {
        expect(fieldMap[field.component]).toBeDefined()
      }
      else {
        // 自定义 items 字段用 FieldRenderFactory（函数）直接渲染，不经过字段映射表
        expect(typeof field.component).toBe('function')
      }
    }
  })

  it.each(CASES)('%s declares json-serializable props and style', (_type, material) => {
    const defaultProps = material.schema?.defaultProps ?? {}
    expect(JSON.parse(JSON.stringify(defaultProps))).toEqual(defaultProps)

    const defaultStyle = material.schema?.defaultStyle
    if (defaultStyle) {
      expect(JSON.parse(JSON.stringify(defaultStyle))).toEqual(defaultStyle)
    }
  })

  it.each(CASES)('%s mounts its preview without throwing', (_type, material) => {
    const { app, host } = mountPreview(material)

    expect(host.innerHTML.length).toBeGreaterThan(0)

    app.unmount()
  })
})

describe('floating button material', () => {
  const floatingButton = findMaterial('miniapp.floating-button')

  it('exposes only its own fields, with no common wrapper sections', () => {
    const titles = (floatingButton.inspector?.formSchema?.sections ?? []).map(
      section => section.title,
    )

    // 与 NavBar 同为 prod 里不走公共 wrapper 的两个例外
    expect(titles).toEqual(['展示设置'])
    expect(inspectorFields(floatingButton).map(field => field.key)).toEqual([
      'image',
      'link',
      'size',
      'borderRadius',
      'position',
      'horizontalOffset',
      'verticalOffset',
    ])
  })

  it('carries the prod default props verbatim', () => {
    expect(floatingButton.schema?.defaultProps).toEqual({
      image: '',
      link: '',
      position: 'right',
      horizontalOffset: 16,
      verticalOffset: 16,
      size: 48,
      borderRadius: 24,
    })
  })

  it('turns the prod upload and link into the local field and a text input', () => {
    const fields = inspectorFields(floatingButton)

    expect(fields.find(field => field.key === 'image')?.component).toBe('ImageSourceField')
    expect(fields.find(field => field.key === 'image')?.componentProps).toEqual({ fileMaxSize: 1 })
    expect(fields.find(field => field.key === 'link')?.component).toBe('Input')
  })

  it('is a singleton, but lets the button move — unlike the pinned nav and tab bars', () => {
    const policy = floatingButton.authoring?.policy

    expect(typeof policy?.create).toBe('function')
    expect(policy?.duplicate).toBe('denied')
    expect(policy?.unwrap).toBe('denied')
    expect(policy?.remove).toBe('allowed')
    expect(policy?.update).toBe('allowed')
    // 它靠 props 里的 position/offset 定位，不靠 frame 钉死，所以 move 有意义
    expect(policy?.move).toBe('allowed')
  })

  it('ships a viewport frame so it can sit outside the content flow', () => {
    const presentation = floatingButton.presentation

    expect(presentation.kind).toBe('visual')
    if (presentation.kind === 'visual') {
      expect(presentation.frame).toBeTruthy()
    }
  })

  it('positions itself from the offset props and clamps the size and radius', () => {
    const preview
      = floatingButton.presentation.kind === 'visual' ? floatingButton.presentation.preview : undefined
    const readStyle = (props: Record<string, unknown>) => {
      const { app, host } = mountComponent(preview as Component, props)
      const style = (host.querySelector('.pg-floating-button')?.getAttribute('style') ?? '').replace(
        /\s+/g,
        '',
      )
      app.unmount()
      return style
    }

    const right = readStyle({ position: 'right' })
    expect(right).toContain('right:16px')
    expect(right).toContain('width:48px')
    expect(right).toContain('border-radius:24px')

    expect(readStyle({ position: 'left' })).toContain('left:16px')
    expect(readStyle({ size: 200 })).toContain('width:120px')
    expect(readStyle({ borderRadius: 999 })).toContain('border-radius:60px')

    /*
     * 这里**故意没有**断言 `bottom`：它的值是
     * `calc(16px + var(--dc-internal-surface-reservation-block-end, 0px))`，而 happy-dom 解析不了
     * `calc()`，整条属性会被丢弃（实测 style 里根本没有 bottom）。所以"悬浮层叠上 TabBar 的
     * 底部占位、不被底栏压住"只能人工验，见票据 Answer 的验收清单。
     */
  })
})

describe('divider material', () => {
  const divider = findMaterial('miniapp.divider')

  it('exposes its own fields plus the common wrapper sections', () => {
    const titles = (divider.inspector?.formSchema?.sections ?? []).map(section => section.title)

    expect(titles).toEqual(['展示设置', '通用布局', '通用样式'])
    expect(inspectorFields(divider).map(field => field.key)).toEqual([
      'text',
      'orientation',
      'dashed',
      'textColor',
      'textFontSize',
      'commonUpwardOffset',
      'commonLayer',
      'commonPadding',
      'commonMargin',
      'commonBorderRadius',
      'commonBoxShadow',
      'commonBackgroundImage',
      'commonBackgroundImageMode',
      'commonBackgroundColor',
    ])
  })

  it('carries the prod default props verbatim', () => {
    expect(divider.schema?.defaultProps).toEqual({
      text: '分割线',
      orientation: 'center',
      dashed: false,
      textColor: '#333333',
      textFontSize: 14,
    })
  })

  it('edits the text colour with the local colour field', () => {
    expect(inspectorFields(divider).find(field => field.key === 'textColor')?.component)
      .toBe('ColorField')
  })

  // prod 靠全局注册的 <a-divider> 并挂 `!m-0` 这个宿主 tailwind 类；这里验替换后两者都成立
  it('renders an ant divider instead of relying on global registration', () => {
    const preview = divider.presentation.kind === 'visual' ? divider.presentation.preview : undefined
    const { app, host } = mountComponent(preview as Component, { text: '分割线' })

    const element = host.querySelector('.ant-divider')
    expect(element).not.toBeNull()
    expect(element!.textContent).toContain('分割线')
    // `!m-0` 的等价内联样式，清掉 ant 自带的 24px 上下外边距
    expect(element!.getAttribute('style')).toContain('margin: 0')

    app.unmount()
  })

  it('drops the inner text node when the text is empty', () => {
    const preview = divider.presentation.kind === 'visual' ? divider.presentation.preview : undefined

    const blank = mountComponent(preview as Component, { text: '' })
    expect(blank.host.querySelector('.ant-divider')).not.toBeNull()
    expect(blank.host.querySelector('.ant-divider-inner-text')).toBeNull()
    expect(blank.host.querySelector('.ant-divider')!.getAttribute('style')).toContain('margin: 0')
    blank.app.unmount()

    const dashed = mountComponent(preview as Component, { text: '', dashed: true })
    expect(dashed.host.querySelector('.ant-divider')!.classList.contains('ant-divider-dashed')).toBe(true)
    dashed.app.unmount()
  })
})

describe('title material', () => {
  const title = findMaterial('miniapp.title')

  it('exposes its own fields plus the common wrapper sections', () => {
    const titles = (title.inspector?.formSchema?.sections ?? []).map(section => section.title)

    expect(titles).toEqual(['标题设置', '更多设置', '通用布局', '通用样式'])
    expect(inspectorFields(title).map(field => field.key)).toEqual([
      'title',
      'titleLink',
      'titleCentered',
      'icon',
      'subtitle',
      'subtitleCentered',
      'sameLine',
      'titleColor',
      'titleTextStyle',
      'titleFontSize',
      'subtitleColor',
      'subtitleTextStyle',
      'subtitleFontSize',
      'showMore',
      'moreText',
      'moreLink',
      'moreColor',
      'moreTextStyle',
      'moreFontSize',
      'commonUpwardOffset',
      'commonLayer',
      'commonPadding',
      'commonMargin',
      'commonBorderRadius',
      'commonBoxShadow',
      'commonBackgroundImage',
      'commonBackgroundImageMode',
      'commonBackgroundColor',
    ])
  })

  it('carries the prod default props verbatim', () => {
    expect(title.schema?.defaultProps).toEqual({
      title: '标题',
      titleLink: '',
      titleCentered: false,
      icon: '',
      subtitle: '',
      subtitleCentered: false,
      sameLine: false,
      titleColor: '#333333',
      titleTextStyle: 'normal',
      titleFontSize: 16,
      subtitleColor: '#999999',
      subtitleTextStyle: 'normal',
      subtitleFontSize: 12,
      showMore: false,
      moreText: '更多',
      moreLink: '',
      moreColor: '#999999',
      moreTextStyle: 'normal',
      moreFontSize: 12,
    })
  })

  it('turns both prod links into plain text inputs and the icon into an image field', () => {
    const fields = inspectorFields(title)

    expect(fields.find(field => field.key === 'titleLink')?.component).toBe('Input')
    expect(fields.find(field => field.key === 'moreLink')?.component).toBe('Input')
    expect(fields.find(field => field.key === 'icon')?.component).toBe('ImageSourceField')
    // 图标类沿用 prod 的 1MB 上限
    expect(fields.find(field => field.key === 'icon')?.componentProps).toEqual({ fileMaxSize: 1 })
  })

  it('hides the whole more group behind showMore', () => {
    const fields = inspectorFields(title)
    const moreFields = fields.filter(field => field.key.startsWith('more'))

    expect(moreFields).toHaveLength(5)
    for (const field of moreFields) {
      // ifShow 可以是布尔或谓词；这里断言的是谓词形态
      const ifShow = field.ifShow
      expect(typeof ifShow).toBe('function')
      if (typeof ifShow !== 'function') {
        continue
      }

      expect(ifShow({ values: { showMore: false } } as never)).toBe(false)
      expect(ifShow({ values: { showMore: true } } as never)).toBe(true)
    }
  })

  it('lays the two titles out inline when sameLine is on', () => {
    const preview = title.presentation.kind === 'visual' ? title.presentation.preview : undefined
    const { app, host } = mountComponent(preview as Component, {
      title: '主标题',
      subtitle: '副标题',
      sameLine: true,
    })

    expect(host.querySelector('.pg-title__texts')?.classList.contains('pg-title__texts--inline')).toBe(true)

    app.unmount()
  })

  it('only renders the more block when showMore is on, defaulting its text', () => {
    const preview = title.presentation.kind === 'visual' ? title.presentation.preview : undefined

    const off = mountComponent(preview as Component, { showMore: false })
    expect(off.host.querySelector('.pg-title__more')).toBeNull()
    off.app.unmount()

    const on = mountComponent(preview as Component, { showMore: true, moreText: '   ' })
    expect(on.host.querySelector('.pg-title__more-text')?.textContent).toBe('更多')
    on.app.unmount()
  })
})

describe('tab bar material', () => {
  const tabBar = findMaterial('miniapp.tab-bar')

  it('exposes its own fields plus the style-only wrapper section', () => {
    const titles = (tabBar.inspector?.formSchema?.sections ?? []).map(section => section.title)

    // mode: 'backgroundOnly' → 只注入"通用样式"，**没有**"通用布局"
    expect(titles).toEqual(['内容设置', '通用样式'])
    expect(inspectorFields(tabBar).map(field => field.key)).toEqual([
      'content',
      'activeIndex',
      'commonPadding',
      'commonMargin',
      'commonBorderRadius',
      'commonBoxShadow',
      'commonBackgroundImage',
      'commonBackgroundImageMode',
      'commonBackgroundColor',
    ])
  })

  // prod 的 defaultProps 只有 content；activeIndex 是 playground 新增的（无页面上下文）
  it('carries the prod default props plus the added activeIndex', () => {
    expect(tabBar.schema?.defaultProps).toEqual({
      content: [
        { name: '首页', icon: '', activeIcon: '', path: '', activeColor: '', inactiveColor: '' },
        { name: '我的', icon: '', activeIcon: '', path: '', activeColor: '', inactiveColor: '' },
      ],
      activeIndex: 0,
    })
  })

  it('drives its content through a render factory rather than the field map', () => {
    const content = inspectorFields(tabBar).find(field => field.key === 'content')

    expect(typeof content?.component).toBe('function')
  })

  it('is a singleton like prod, not freely creatable', () => {
    const policy = tabBar.authoring?.policy

    expect(typeof policy?.create).toBe('function')
    expect(policy?.duplicate).toBe('denied')
    expect(policy?.move).toBe('denied')
    expect(policy?.unwrap).toBe('denied')
    expect(policy?.remove).toBe('allowed')
    expect(policy?.update).toBe('allowed')
  })

  it('renders one item per tab, clamped to the prod min and max', () => {
    const { app, host } = mountComponent(TabBarItemsField, {
      value: TAB_BAR_DEFAULT_PROPS.content,
    })

    expect(host.querySelectorAll('.tab-bar-items-field__card')).toHaveLength(2)

    app.unmount()
  })

  it('keeps an arbitrary free-text path instead of resolving it against a page registry', () => {
    const normalized = normalizeTabBarItems([
      { name: '首页', path: '/pages/custom/index?x=1' },
      { name: '我的', path: 'anything goes' },
    ])

    expect(normalized[0].path).toBe('/pages/custom/index?x=1')
    expect(normalized[1].path).toBe('anything goes')
  })

  it('pads up to the prod minimum of two items and truncates beyond five', () => {
    expect(normalizeTabBarItems([]).map(item => item.name)).toEqual(['首页', '我的'])
    expect(
      normalizeTabBarItems(Array.from({ length: 8 }, (_, index) => ({ name: `项${index}` }))),
    ).toHaveLength(5)
  })

  // prod 用 useDiyV2Context().pagePath 推断激活项；playground 换成显式的 activeIndex
  it('marks the item at activeIndex as active instead of inferring from a page path', () => {
    const preview = tabBar.presentation.kind === 'visual' ? tabBar.presentation.preview : undefined
    const { app, host } = mountComponent(preview as Component, {
      content: TAB_BAR_DEFAULT_PROPS.content,
      activeIndex: 1,
    })

    const items = host.querySelectorAll('.pg-tab-bar__item')
    expect(items).toHaveLength(2)
    expect(items[0].classList.contains('is-active')).toBe(false)
    expect(items[1].classList.contains('is-active')).toBe(true)

    app.unmount()
  })
})

describe('nav bar material', () => {
  const navBar = findMaterial('miniapp.nav-bar')

  it('exposes only its own field, with no common wrapper sections', () => {
    const titles = (navBar.inspector?.formSchema?.sections ?? []).map(section => section.title)

    // NavBar 与 FloatingButton 是 prod 里不走公共 wrapper 的两个例外
    expect(titles).toEqual(['展示设置'])
    expect(inspectorFields(navBar).map(field => field.key)).toEqual(['title'])
  })

  it('carries the prod default props verbatim', () => {
    expect(navBar.schema?.defaultProps).toEqual({ title: '' })
  })

  it('is visible in the panel, unlike prod where it is a hidden system material', () => {
    expect(navBar.panel?.visible).toBe(true)
    expect(navBar.panel?.group).toBe('basic')
    expect(navBar.panel?.icon).toBeTruthy()
  })

  it('is a positional singleton rather than freely creatable', () => {
    const policy = navBar.authoring?.policy

    // create 是谓词：已存在一个 NavBar 时拒绝再建
    expect(typeof policy?.create).toBe('function')
    expect(policy?.duplicate).toBe('denied')
    expect(policy?.move).toBe('denied')
    expect(policy?.unwrap).toBe('denied')
    expect(policy?.remove).toBe('allowed')
    expect(policy?.update).toBe('allowed')
  })

  it('ships a viewport frame so it can reserve top space', () => {
    const presentation = navBar.presentation

    expect(presentation.kind).toBe('visual')
    if (presentation.kind === 'visual') {
      expect(presentation.frame).toBeTruthy()
    }
  })

  it('renders its title in the preview', () => {
    const { app, host } = mountComponent(NavBarPreview, { title: '景区首页' })

    expect(host.querySelector('.pg-nav-bar__title')?.textContent).toBe('景区首页')

    app.unmount()
  })
})

describe('notice material', () => {
  const notice = findMaterial('miniapp.notice')

  it('exposes its own fields plus the common wrapper sections', () => {
    const titles = (notice.inspector?.formSchema?.sections ?? []).map(section => section.title)

    expect(titles).toEqual(['展示设置', '内容设置', '按钮设置', '公告风格', '通用布局', '通用样式'])
    expect(inspectorFields(notice).map(field => field.key)).toEqual([
      'displayStyle',
      'items',
      'content',
      'buttonType',
      'buttonText',
      'buttonFontSize',
      'buttonTextStyle',
      'buttonIcon',
      'buttonLink',
      'showNoticeIcon',
      'noticeIcon',
      'textColor',
      'textFontSize',
      'textStyle',
      'styleOneScrollMode',
      'styleOneInterval',
      'styleTwoShowAll',
      'styleTwoScrolling',
      'styleTwoDuration',
      'commonUpwardOffset',
      'commonLayer',
      'commonPadding',
      'commonMargin',
      'commonBorderRadius',
      'commonBoxShadow',
      'commonBackgroundImage',
      'commonBackgroundImageMode',
      'commonBackgroundColor',
    ])
  })

  it('carries the prod default props verbatim', () => {
    expect(notice.schema?.defaultProps).toEqual({
      displayStyle: 'style1',
      showNoticeIcon: true,
      noticeIcon: '',
      textColor: '#8c5a00',
      textFontSize: 14,
      textStyle: 'normal',
      items: [{ title: '这是一条公告', link: '', enabled: true }],
      content: '',
      buttonType: 'none',
      buttonText: '更多',
      buttonIcon: '',
      buttonLink: '',
      buttonFontSize: 13,
      buttonTextStyle: 'normal',
      styleOneScrollMode: 'vertical',
      styleOneInterval: 3,
      styleTwoShowAll: true,
      styleTwoScrolling: false,
      styleTwoDuration: 10,
    })
  })

  it('writes the prod default style, merged with the injected default background', () => {
    expect(notice.schema?.defaultStyle).toEqual({
      content: {
        padding: '10px 12px',
        background: createDefaultDiyV2BackgroundConfig(),
      },
    })
  })

  it('drives its items through a render factory rather than the field map', () => {
    const items = inspectorFields(notice).find(field => field.key === 'items')

    expect(typeof items?.component).toBe('function')
  })

  it('renders one card per notice item', () => {
    const { app, host } = mountComponent(NoticeItemsField, {
      value: NOTICE_DEFAULT_PROPS.items,
    })

    expect(host.querySelectorAll('.notice-items-field__card')).toHaveLength(1)

    app.unmount()
  })

  it('only counts items explicitly marked as enabled', () => {
    const normalized = normalizeNoticeItems([
      { title: '开', link: '', enabled: true },
      { title: '关', link: '', enabled: false },
      { title: '缺字段' },
    ])

    expect(normalized.map(item => item.enabled)).toEqual([true, false, false])
  })

  // prod 用 vue3-marquee，playground 用纯 CSS 复刻。这条断言钉住"替换真的接上了"。
  it('renders a css marquee carrying the configured duration when style two scrolls', () => {
    const preview = notice.presentation.kind === 'visual' ? notice.presentation.preview : undefined
    const { app, host } = mountComponent(preview as Component, {
      displayStyle: 'style2',
      styleTwoScrolling: true,
      styleTwoDuration: 7,
      content: '滚动公告内容',
    })

    const marquee = host.querySelector('.pg-notice__marquee')
    expect(marquee).not.toBeNull()
    expect(marquee!.getAttribute('style')).toContain('--dc-internal-notice-marquee-duration: 7s')
    expect(host.querySelector('.pg-notice__marquee-text')?.textContent).toBe('滚动公告内容')

    app.unmount()
  })

  it('does not render a marquee when style two scrolling is off', () => {
    const preview = notice.presentation.kind === 'visual' ? notice.presentation.preview : undefined
    const { app, host } = mountComponent(preview as Component, {
      displayStyle: 'style2',
      styleTwoScrolling: false,
      content: '不滚动',
    })

    expect(host.querySelector('.pg-notice__marquee')).toBeNull()

    app.unmount()
  })
})

describe('navigation group material', () => {
  const navigationGroup = findMaterial('miniapp.navigation-group')

  const defaultItem = (title: string) => ({
    icon: '',
    title,
    link: '',
    badge: {
      enabled: false,
      type: 'text' as const,
      text: '',
      image: '',
      offsetTop: 0,
      offsetRight: 0,
      backgroundColor: '#ff4d4f',
      radius: 8,
    },
  })

  it('exposes its own fields plus the common wrapper sections', () => {
    const titles = (navigationGroup.inspector?.formSchema?.sections ?? []).map(
      section => section.title,
    )

    expect(titles).toEqual([
      '展示设置',
      '内容设置',
      '样式设置',
      '轮播设置',
      '指示器设置',
      '通用布局',
      '通用样式',
    ])
    expect(inspectorFields(navigationGroup).map(field => field.key)).toEqual([
      'navigationStyle',
      'columnCount',
      'displayMode',
      'rowCount',
      'content',
      'imageTextGap',
      'imageRadius',
      'imageSize',
      'objectFit',
      'titleColor',
      'titleTextStyle',
      'titleFontSize',
      'autoplay',
      'interval',
      'scrollMode',
      'showIndicator',
      'indicatorPosition',
      'indicatorAlign',
      'indicatorStyle',
      'indicatorActiveColor',
      'indicatorInactiveColor',
      'indicatorSize',
      'indicatorRadius',
      'indicatorMargin',
      'commonUpwardOffset',
      'commonLayer',
      'commonPadding',
      'commonMargin',
      'commonBorderRadius',
      'commonBoxShadow',
      'commonBackgroundImage',
      'commonBackgroundImageMode',
      'commonBackgroundColor',
    ])
  })

  it('carries the prod default props verbatim', () => {
    expect(navigationGroup.schema?.defaultProps).toEqual({
      navigationStyle: 'image-text',
      columnCount: 4,
      displayMode: 'fixed',
      rowCount: 1,
      content: [
        defaultItem('测试标题'),
        defaultItem('测试标题'),
        defaultItem('测试标题'),
        defaultItem('测试标题'),
      ],
      imageTextGap: 6,
      imageRadius: 0,
      imageSize: 48,
      objectFit: 'cover',
      titleColor: '#333333',
      titleTextStyle: 'normal',
      titleFontSize: 14,
      autoplay: true,
      interval: 3,
      scrollMode: 'scrollx',
      showIndicator: true,
      indicatorPosition: 'bottom',
      indicatorAlign: 'center',
      indicatorStyle: 'dot',
      indicatorActiveColor: '#1677ff',
      indicatorInactiveColor: '#d9d9d9',
      indicatorSize: 8,
      indicatorRadius: 8,
      indicatorMargin: 8,
    })
  })

  it('drives its content through a render factory rather than the field map', () => {
    const content = inspectorFields(navigationGroup).find(field => field.key === 'content')

    expect(typeof content?.component).toBe('function')
  })

  it('renders one card per default navigation item', () => {
    const { app, host } = mountComponent(NavigationItemsField, {
      value: NAVIGATION_GROUP_DEFAULT_PROPS.content,
    })

    expect(host.querySelectorAll('.navigation-items-field__card')).toHaveLength(4)

    app.unmount()
  })

  it('fills badge defaults for malformed items instead of throwing', () => {
    const normalized = normalizeNavigationItems([null, { title: '首页' }])

    expect(normalized).toHaveLength(2)
    expect(normalized[0]).toEqual(defaultItem(''))
    expect(normalized[1].title).toBe('首页')
    expect(normalized[1].badge).toEqual(defaultItem('').badge)
  })

  it('clamps navigation titles to 10 characters', () => {
    expect(truncateNavigationTitle('一二三四五六七八九十十一')).toBe('一二三四五六七八九十')
  })
})

describe('carousel material', () => {
  const carousel = findMaterial('miniapp.carousel')

  it('exposes its own fields plus the common wrapper sections', () => {
    const titles = (carousel.inspector?.formSchema?.sections ?? []).map(section => section.title)

    expect(titles).toEqual(['展示设置', '内容设置', '指示器设置', '通用布局', '通用样式'])
    expect(inspectorFields(carousel).map(field => field.key)).toEqual([
      'height',
      'objectFit',
      'autoplay',
      'interval',
      'items',
      'showIndicator',
      'indicatorPosition',
      'indicatorAlign',
      'indicatorStyle',
      'indicatorActiveColor',
      'indicatorInactiveColor',
      'indicatorSize',
      'indicatorRadius',
      'indicatorMargin',
      'commonUpwardOffset',
      'commonLayer',
      'commonPadding',
      'commonMargin',
      'commonBorderRadius',
      'commonBoxShadow',
      'commonBackgroundImage',
      'commonBackgroundImageMode',
      'commonBackgroundColor',
    ])
  })

  it('carries the prod default props verbatim', () => {
    expect(carousel.schema?.defaultProps).toEqual({
      height: 200,
      objectFit: 'cover',
      autoplay: true,
      interval: 3,
      showIndicator: true,
      indicatorPosition: 'bottom',
      indicatorAlign: 'center',
      indicatorStyle: 'dot',
      indicatorActiveColor: '#1677ff',
      indicatorInactiveColor: '#d9d9d9',
      indicatorSize: 8,
      indicatorRadius: 8,
      indicatorMargin: 8,
      items: [{ src: '', link: '' }],
    })
  })

  it('drives its items through a render factory rather than the field map', () => {
    const items = inspectorFields(carousel).find(field => field.key === 'items')

    expect(typeof items?.component).toBe('function')
  })

  it('renders one card for the single default slide', () => {
    const { app, host } = mountComponent(CarouselItemsField, {
      value: [{ src: '', link: '' }],
    })

    expect(host.querySelectorAll('.carousel-items-field__card')).toHaveLength(1)

    app.unmount()
  })

  it('normalizes malformed slide entries instead of throwing', () => {
    const parseValue = inspectorFields(carousel).find(field => field.key === 'items')?.parseValue

    expect(parseValue?.([null, { src: 'a.png', link: '/x' }, 7], {} as never)).toEqual([
      { src: '', link: '' },
      { src: 'a.png', link: '/x' },
      { src: '', link: '' },
    ])
  })
})

describe('image sample material', () => {
  const image = findMaterial('miniapp.image')

  it('exposes its own fields plus the common wrapper sections', () => {
    const titles = (image.inspector?.formSchema?.sections ?? []).map(section => section.title)

    expect(titles).toEqual(['展示设置', '通用布局', '通用样式'])
    expect(inspectorFields(image).map(field => field.key)).toEqual([
      'src',
      'link',
      'height',
      'objectFit',
      'commonUpwardOffset',
      'commonLayer',
      'commonPadding',
      'commonMargin',
      'commonBorderRadius',
      'commonBoxShadow',
      'commonBackgroundImage',
      'commonBackgroundImageMode',
      'commonBackgroundColor',
    ])
  })

  it('carries the prod default props verbatim', () => {
    expect(image.schema?.defaultProps).toEqual({
      src: '',
      link: '',
      height: 200,
      objectFit: 'cover',
    })
  })
})

describe('spacer material', () => {
  const spacer = findMaterial('miniapp.spacer')

  it('exposes its own fields plus the common wrapper sections', () => {
    const titles = (spacer.inspector?.formSchema?.sections ?? []).map(section => section.title)

    expect(titles).toEqual(['展示设置', '通用布局', '通用样式'])
    expect(inspectorFields(spacer).map(field => field.key)).toEqual([
      'height',
      'commonUpwardOffset',
      'commonLayer',
      'commonPadding',
      'commonMargin',
      'commonBorderRadius',
      'commonBoxShadow',
      'commonBackgroundImage',
      'commonBackgroundImageMode',
      'commonBackgroundColor',
    ])
  })

  it('carries the prod default props verbatim', () => {
    expect(spacer.schema?.defaultProps).toEqual({ height: 20 })
  })

  it('sits in the tools group', () => {
    expect(spacer.panel?.group).toBe('tools')
  })

  it('renders an empty spacer element, not a placeholder visual', () => {
    const { app, host } = mountPreview(spacer)

    // prod 的 SpacerPreview 就是一个空 div：canvas 里靠 dragcraft 自己的选中/悬停轮廓
    // 让设计师看见它，而不是靠物料自己画一个占位。
    expect(host.querySelector('div[aria-hidden="true"]')).not.toBeNull()
    expect(host.textContent?.trim()).toBe('')

    app.unmount()
  })
})
