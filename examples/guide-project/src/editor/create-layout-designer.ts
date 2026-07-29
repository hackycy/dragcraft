import type { DesignerSchema } from '@dragcraft/designer'
import { createDesigner } from '@dragcraft/designer'
import {
  layoutComponentMap,
  layoutWidgetGroups,
  layoutWidgetMetas,
} from '../domain/widgets/layout'
import { createGuideFieldComponentMap } from '../forms'
import { createGuideSchema } from './create-guide-schema'
import { guideGlobalConfigSchema } from './global-config-schema'

export interface CreateLayoutDesignerOptions {
  initialSchema?: DesignerSchema
}

export function createLayoutDesigner(options: CreateLayoutDesignerOptions = {}) {
  return createDesigner({
    engineOptions: {
      initialSchema: options.initialSchema ?? createGuideSchema(),
      maxHistorySize: 50,
    },
    widgetMetas: layoutWidgetMetas,
    componentMap: layoutComponentMap,
    fieldComponentMap: createGuideFieldComponentMap(),
    widgetGroups: layoutWidgetGroups,
    globalConfigSchema: guideGlobalConfigSchema,
    workspace: {
      compactBreakpoint: 1080,
      keyboardShortcuts: true,
    },
  })
}
