import type { DesignerInstance, UseDesignerReturn } from '../types'

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

  return {
    schema: engine.store.schema,
    selectedNodeId: engine.store.selectedNodeId,
    hoveredNodeId: engine.store.hoveredNodeId,
    execute: engine.execute,
    undo: () => engine.history.undo(),
    redo: () => engine.history.redo(),
    canUndo: () => engine.history.canUndo(),
    canRedo: () => engine.history.canRedo(),
    importSchema: schema => engine.importSchema(schema),
    exportSchema: () => engine.exportSchema(),
    on: engine.eventHub.on.bind(engine.eventHub),
    off: engine.eventHub.off.bind(engine.eventHub),
  }
}
