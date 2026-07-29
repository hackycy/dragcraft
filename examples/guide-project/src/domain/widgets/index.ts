import type { DesignerWidgetMeta, WidgetDefinition, WidgetGroupConfig } from '@dragcraft/designer'
import { buildComponentMap, getWidgetMetas } from '@dragcraft/designer'
import { columnContainerDefinition } from './container'
import { floatingActionWidgetDefinition } from './floating-action'
import { noticeWidgetDefinition } from './notice'
import { pageHeaderWidgetDefinition } from './page-header'
import { textWidgetDefinition } from './text'

export const guideWidgetDefinitions: WidgetDefinition<DesignerWidgetMeta>[] = [
  pageHeaderWidgetDefinition,
  textWidgetDefinition,
  noticeWidgetDefinition,
  columnContainerDefinition,
  floatingActionWidgetDefinition,
]

export const guideWidgetMetas = getWidgetMetas(guideWidgetDefinitions)
export const guideComponentMap = buildComponentMap(guideWidgetDefinitions)
export const guideWidgetGroups: WidgetGroupConfig[] = [
  { name: 'chrome', title: '页面框架' },
  { name: 'basic', title: '基础' },
  { name: 'marketing', title: '营销' },
  { name: 'layout', title: '布局' },
]

export { columnContainerMeta, ColumnContainerWidget, migrateColumnVariant } from './container'
export { FloatingActionWidget } from './floating-action'
export { NoticeWidget } from './notice'
export { GuidePageHeaderWidget } from './page-header'
