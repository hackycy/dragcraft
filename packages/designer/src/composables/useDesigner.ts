import type { DesignerInstance, UseDesignerReturn } from '../types'
import { computed } from 'vue'

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
  const schema = computed(() => instance.exportSchema())

  return {
    schema,
    selectedNodeId: instance.selection.selectedNodeId,
    hoveredNodeId: instance.selection.hoveredNodeId,
    execute: instance.execute,
    undo: () => { instance.execute({ type: 'undo' }) },
    redo: () => { instance.execute({ type: 'redo' }) },
    canUndo: () => instance.history.canUndo.value,
    canRedo: () => instance.history.canRedo.value,
    importSchema: instance.importSchema,
    exportSchema: instance.exportSchema,
  }
}
