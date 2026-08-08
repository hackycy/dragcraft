import type { DesignerSchema } from '@dragcraft/core'
import type { DesignerInstance, UseDesignerReturn } from '../types'
import { cloneDeep } from '@dragcraft/utils'
import { computed } from 'vue'
import { getDesignerSession } from '../session/get-designer-session'

/**
 * Composable that provides reactive access to designer state and operations.
 * Thin wrapper around the engine's reactive store and API.
 *
 * @example
 * ```ts
 * const designer = createDesigner()
 * const { schema, selectedNodeId, undo, redo } = useDesigner(designer)
 * ```
 */
export function useDesigner(instance: DesignerInstance): UseDesignerReturn {
  const session = getDesignerSession(instance)
  const schema = session.document.schema ?? computed(() => ({
    version: session.document.version.value,
    globalConfig: session.document.globalConfig.value,
    root: session.document.root.value,
  }))

  return {
    schema: schema as UseDesignerReturn['schema'],
    selectedNodeId: session.state.selectedNodeId,
    hoveredNodeId: session.state.hoveredNodeId,
    execute: action => session.execute(action),
    undo: () => session.execute({ type: 'history.undo' }),
    redo: () => session.execute({ type: 'history.redo' }),
    canUndo: () => session.state.history.value.canUndo,
    canRedo: () => session.state.history.value.canRedo,
    importSchema: schema => session.execute({ type: 'schema.import', schema }),
    exportSchema: () => cloneDeep(schema.value) as unknown as DesignerSchema,
  }
}
