import type { DesignerSchema } from '@dragcraft/designer'
import { createDesigner } from '@dragcraft/designer'
import {
  activityComponentMap,
  activityWidgetGroups,
  activityWidgetMetas,
} from '../domain/widgets/activity'
import { createGuideFieldComponentMap } from '../forms'
import { createActivitySchema } from './create-activity-schema'
import { guideGlobalConfigSchema } from './global-config-schema'

export interface CreateActivityDesignerOptions {
  initialSchema?: DesignerSchema
}

export function createActivityDesigner(options: CreateActivityDesignerOptions = {}) {
  return createDesigner({
    engineOptions: {
      initialSchema: options.initialSchema ?? createActivitySchema(),
      maxHistorySize: 50,
    },
    widgetMetas: activityWidgetMetas,
    componentMap: activityComponentMap,
    fieldComponentMap: createGuideFieldComponentMap(),
    widgetGroups: activityWidgetGroups,
    globalConfigSchema: guideGlobalConfigSchema,
    workspace: {
      compactBreakpoint: 1080,
      keyboardShortcuts: true,
    },
  })
}
