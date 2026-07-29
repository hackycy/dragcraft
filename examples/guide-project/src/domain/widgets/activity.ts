import type { DesignerWidgetMeta, WidgetDefinition, WidgetGroupConfig } from '@dragcraft/designer'
import { buildComponentMap, getWidgetMetas } from '@dragcraft/designer'
import { noticeWidgetDefinition } from './notice'
import { textWidgetDefinition } from './text'

export const activityWidgetDefinitions: WidgetDefinition<DesignerWidgetMeta>[] = [
  textWidgetDefinition,
  noticeWidgetDefinition,
]

export const activityWidgetMetas = getWidgetMetas(activityWidgetDefinitions)
export const activityComponentMap = buildComponentMap(activityWidgetDefinitions)

export const activityWidgetGroups: WidgetGroupConfig[] = [
  { name: 'basic', title: '基础' },
  { name: 'marketing', title: '营销' },
]
