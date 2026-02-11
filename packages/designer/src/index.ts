// Main component
export { Designer, DESIGNER_INJECTION_KEY } from './components/Designer'

// Sub-components
export { DesignerCanvas } from './components/DesignerCanvas'
export { MaterialItem } from './components/MaterialItem'
export { MaterialPanel } from './components/MaterialPanel'
export { PropertyPanel } from './components/PropertyPanel'
export { Toolbar } from './components/Toolbar'

// Composables
export { useDesigner } from './composables/useDesigner'
export type { UseDesignerReturn } from './composables/useDesigner'
export { useDragDrop } from './composables/useDragDrop'
export type { UseDragDropOptions, UseDragDropReturn } from './composables/useDragDrop'
export { useWidgetRegistry } from './composables/useWidgetRegistry'

// Types
export type {
  DesignerOptions,
  DesignerWidgetDefinition,
  WidgetRegistry,
} from './types'
