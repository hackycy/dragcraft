import type { DesignerSchema } from '@dragcraft/designer'
import { createDesigner } from '@dragcraft/designer'
import { guideComponentMap, guideWidgetGroups, guideWidgetMetas } from '../domain/widgets'
import { createGuideFieldComponentMap } from '../forms'
import { createGuideSchema } from './create-guide-schema'
import { guideGlobalConfigSchema } from './global-config-schema'

export interface CreateContainerDesignerOptions {
  initialSchema?: DesignerSchema
}

export function createContainerDesigner(options: CreateContainerDesignerOptions = {}) {
  return createDesigner({
    engineOptions: {
      initialSchema: options.initialSchema ?? createGuideSchema(),
      maxHistorySize: 50,
    },
    widgetMetas: guideWidgetMetas,
    componentMap: guideComponentMap,
    fieldComponentMap: createGuideFieldComponentMap(),
    widgetGroups: guideWidgetGroups,
    globalConfigSchema: guideGlobalConfigSchema,
    workspace: {
      compactBreakpoint: 1080,
      keyboardShortcuts: true,
    },
  })
}
