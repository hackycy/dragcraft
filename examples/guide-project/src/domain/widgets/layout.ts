import type { DesignerWidgetMeta, WidgetDefinition, WidgetGroupConfig } from '@dragcraft/designer'
import { buildComponentMap, getWidgetMetas } from '@dragcraft/designer'
import {
  activityWidgetDefinitions,
  activityWidgetGroups,
} from './activity'
import { pageHeaderWidgetDefinition } from './page-header'

export const layoutWidgetDefinitions: WidgetDefinition<DesignerWidgetMeta>[] = [
  pageHeaderWidgetDefinition,
  ...activityWidgetDefinitions,
]

export const layoutWidgetMetas = getWidgetMetas(layoutWidgetDefinitions)
export const layoutComponentMap = buildComponentMap(layoutWidgetDefinitions)

export const layoutWidgetGroups: WidgetGroupConfig[] = [
  { name: 'chrome', title: '页面框架' },
  ...activityWidgetGroups,
]
