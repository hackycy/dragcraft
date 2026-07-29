import type { ContainerShellSource, DesignerSchema } from '@dragcraft/designer'
import { createDesigner } from '@dragcraft/designer'
import { guideComponentMap, guideWidgetGroups, guideWidgetMetas } from '../domain/widgets'
import { createGuideFieldComponentMap } from '../forms'
import { createGuideActionInterceptors, guideCustomActions } from './actions'
import { createGuideExtensions } from './extensions'
import { guideGlobalConfigSchema } from './global-config'
import { createGuideSchema } from './initial-schema'
import { guideMessages } from './messages'
import { registerGuideSchemaMigrations } from './schema-migrations'

export interface CreatePageDesignerOptions {
  initialSchema?: DesignerSchema
  containerShell?: ContainerShellSource
}

export function createPageDesigner(options: CreatePageDesignerOptions = {}) {
  const initialSchema = options.initialSchema ?? createGuideSchema()
  const designer = createDesigner({
    engineOptions: {
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
    customActions: guideCustomActions,
    actionInterceptors: createGuideActionInterceptors(),
    extensions: createGuideExtensions(options.containerShell),
    messages: guideMessages,
  })

  registerGuideSchemaMigrations(designer.engine)
  const result = designer.engine.importSchema(initialSchema)
  if (!result.ok) {
    designer.dispose()
    throw new Error(`Initial guide schema was rejected: ${result.diagnostics.map(item => item.code).join(', ')}`)
  }

  return designer
}
export { createGuideSchema } from './initial-schema'
