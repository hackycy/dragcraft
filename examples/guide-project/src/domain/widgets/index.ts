import type { MaterialGroupDefinition, WidgetFixtureDefinition } from './contract'
import { columnContainerDefinition } from './container'
import { createFixtureComponentMap, readFixtureMetas } from './contract'
import { floatingActionWidgetDefinition } from './floating-action'
import { noticeWidgetDefinition } from './notice'
import { pageHeaderWidgetDefinition } from './page-header'
import { textWidgetDefinition } from './text'

export const guideWidgetFixtures: WidgetFixtureDefinition[] = [
  pageHeaderWidgetDefinition,
  textWidgetDefinition,
  noticeWidgetDefinition,
  columnContainerDefinition,
  floatingActionWidgetDefinition,
]

export const guideFixtureMetas = readFixtureMetas(guideWidgetFixtures)
export const guideFixtureComponentMap = createFixtureComponentMap(guideWidgetFixtures)
export const guideMaterialGroups: MaterialGroupDefinition[] = [
  { name: 'chrome', title: '页面框架' },
  { name: 'basic', title: '基础' },
  { name: 'marketing', title: '营销' },
  { name: 'layout', title: '布局' },
]

export { columnContainerMeta, ColumnContainerWidget, migrateColumnVariant } from './container'
export { FloatingActionWidget } from './floating-action'
export { NoticeWidget } from './notice'
export { GuidePageHeaderWidget } from './page-header'
