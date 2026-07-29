import type { DesignerWidgetMeta, WidgetDefinition, WidgetGroupConfig } from '@dragcraft/designer'
import { buildComponentMap, getWidgetMetas } from '@dragcraft/designer'
import { columnContainerDefinition } from './container'
import { layoutWidgetDefinitions, layoutWidgetGroups } from './layout'

// #region tutorial-widget-registry
export const guideWidgetDefinitions: WidgetDefinition<DesignerWidgetMeta>[] = [
  ...layoutWidgetDefinitions,
  columnContainerDefinition,
]

export const guideWidgetMetas = getWidgetMetas(guideWidgetDefinitions)
export const guideComponentMap = buildComponentMap(guideWidgetDefinitions)
// #endregion tutorial-widget-registry

export const guideWidgetGroups: WidgetGroupConfig[] = [
  ...layoutWidgetGroups,
  { name: 'layout', title: '布局' },
]

export {
  activityComponentMap,
  activityWidgetDefinitions,
  activityWidgetGroups,
  activityWidgetMetas,
} from './activity'
export { columnContainerMeta, ColumnContainerWidget, migrateColumnVariant } from './container'
export {
  layoutComponentMap,
  layoutWidgetDefinitions,
  layoutWidgetGroups,
  layoutWidgetMetas,
} from './layout'
export { NoticeWidget } from './notice'
export { GuidePageHeaderWidget } from './page-header'
