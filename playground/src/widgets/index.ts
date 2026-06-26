import type { WidgetGroupConfig } from '@dragcraft/widgets'
import type { Component } from 'vue'
import type { PlaygroundWidgetMeta } from './types'
import NavbarWidget, { navbarWidgetMeta } from './NavbarWidget'
import SwiperWidget, { swiperWidgetMeta } from './SwiperWidget'
import TabBarWidget, { tabBarWidgetMeta } from './TabBarWidget'

export type { PlaygroundWidgetMeta } from './types'

// ── Widget metas ────────────────────────────

export const playgroundWidgetMetas: PlaygroundWidgetMeta[] = [
  navbarWidgetMeta,
  tabBarWidgetMeta,
  swiperWidgetMeta,
]

// ── Component map ───────────────────────────

export const playgroundComponentMap: Record<string, Component> = {
  'navbar': NavbarWidget,
  'tab-bar': TabBarWidget,
  'swiper': SwiperWidget,
}

// ── Widget groups ───────────────────────────

export const playgroundWidgetGroups: WidgetGroupConfig[] = [
  { name: 'navigation', title: '导航容器' },
]

// ── Individual exports ──────────────────────

export { NavbarWidget, navbarWidgetMeta }
export { SwiperWidget, swiperWidgetMeta }
export { TabBarWidget, tabBarWidgetMeta }
