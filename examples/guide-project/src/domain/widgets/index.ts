import type { DesignerWidgetMeta, WidgetDefinition, WidgetGroupConfig } from '@dragcraft/designer'
import { buildComponentMap, getWidgetMetas } from '@dragcraft/designer'
import { columnContainerDefinition } from './container'
import { noticeWidgetDefinition } from './notice'
import { textWidgetDefinition } from './text'

// #region tutorial-widget-registry
export const guideWidgetDefinitions: WidgetDefinition<DesignerWidgetMeta>[] = [
  textWidgetDefinition,
  noticeWidgetDefinition,
  columnContainerDefinition,
]

export const guideWidgetMetas = getWidgetMetas(guideWidgetDefinitions)
export const guideComponentMap = buildComponentMap(guideWidgetDefinitions)
// #endregion tutorial-widget-registry

export const guideWidgetGroups: WidgetGroupConfig[] = [
  { name: 'basic', title: '基础' },
  { name: 'marketing', title: '营销' },
  { name: 'layout', title: '布局' },
]

export { columnContainerMeta, ColumnContainerWidget, migrateColumnVariant } from './container'
export { NoticeWidget } from './notice'
