import type { DesignerInstance, UseDesignerReturn } from '../types'
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
  const { engine } = instance
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
    execute: engine.execute,
    undo: () => engine.history.undo(),
    redo: () => engine.history.redo(),
    canUndo: () => session.state.history.value.canUndo,
    canRedo: () => session.state.history.value.canRedo,
    importSchema: schema => engine.importSchema(schema),
    exportSchema: () => engine.exportSchema(),
    on: engine.eventHub.on.bind(engine.eventHub),
    off: engine.eventHub.off.bind(engine.eventHub),
  }
}
