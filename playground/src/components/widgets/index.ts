import type { DesignerWidgetMeta, WidgetGroupConfig } from '@dragcraft/designer'
import type { WidgetDefinition } from '@dragcraft/widgets'
import { buildComponentMap, getWidgetMetas } from '@dragcraft/widgets'
import { basicWidgetDefinitions } from './basic'
import { formWidgetDefinitions } from './form'
import { playgroundWidgetMessages } from './messages'
import { miniProgramWidgetDefinitions } from './mini-program'

export const playgroundWidgetDefinitions: WidgetDefinition<DesignerWidgetMeta>[] = [
  ...basicWidgetDefinitions,
  ...formWidgetDefinitions,
  ...miniProgramWidgetDefinitions,
]

export const playgroundWidgetGroups: WidgetGroupConfig[] = [
  { name: 'basic', title: '基础展示', titleKey: 'group.basic' },
  { name: 'form', title: '表单交互', titleKey: 'group.form' },
  { name: 'navigation', title: '导航容器', titleKey: 'group.navigation' },
  { name: 'action', title: '操作组件', titleKey: 'group.action' },
]

export const playgroundWidgetMetas = getWidgetMetas(playgroundWidgetDefinitions)
export const playgroundComponentMap = buildComponentMap(playgroundWidgetDefinitions)

export { playgroundWidgetMessages }
