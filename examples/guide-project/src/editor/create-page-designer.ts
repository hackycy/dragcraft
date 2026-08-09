import type { ContainerShellSource, DocumentSchema } from '@dragcraft/designer'
import { createDesigner } from '@dragcraft/designer'
import { guideMaterials } from '../domain/materials'
import { createGuideFieldComponentMap } from '../forms'
import { createGuideActionInterceptors, guideCustomActions } from './actions'
import { createGuideExtensions } from './extensions'
import { guideGlobalConfigSchema } from './global-config'
import { createGuideSchema } from './initial-schema'
import { guideMessages } from './messages'

export interface CreatePageDesignerOptions {
  initialSchema?: DocumentSchema
  containerShell?: ContainerShellSource
}

export function createPageDesigner(options: CreatePageDesignerOptions = {}) {
  const initialSchema = options.initialSchema ?? createGuideSchema()
  return createDesigner({
    schema: initialSchema,
    materials: guideMaterials,
    maxHistoryEntries: 50,
    fieldComponentMap: createGuideFieldComponentMap(),
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
}
export { createGuideSchema } from './initial-schema'
