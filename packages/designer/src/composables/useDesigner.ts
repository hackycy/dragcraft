import type { DesignerInstance } from '../session/create-designer'
import type { UseDesignerReturn } from '../types'

export function useDesigner(instance: DesignerInstance): UseDesignerReturn {
  return Object.freeze({
    document: instance.document,
    selection: instance.selection,
    history: instance.history,
    execute: instance.execute,
    importSchema: instance.importSchema,
    exportSchema: instance.exportSchema,
  })
}
