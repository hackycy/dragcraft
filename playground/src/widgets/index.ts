import type { WidgetMeta } from '@dragcraft/core'
import type { WidgetGroupConfig } from '@dragcraft/widgets'
import type { Component } from 'vue'
import NavbarTitleField from '../fields/NavbarTitleField'
import NavbarWidget, { navbarWidgetMeta } from './NavbarWidget'
import SwiperWidget, { swiperWidgetMeta } from './SwiperWidget'
import TabBarWidget, { tabBarWidgetMeta } from './TabBarWidget'

// ── Widget metas ────────────────────────────

export const playgroundWidgetMetas: WidgetMeta[] = [
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

// ── Field components ────────────────────────

export const playgroundFieldComponents = {
  'navbar-title': NavbarTitleField,
}

// ── Individual exports ──────────────────────

export { NavbarWidget, navbarWidgetMeta }
export { SwiperWidget, swiperWidgetMeta }
export { TabBarWidget, tabBarWidgetMeta }
export { NavbarTitleField }
