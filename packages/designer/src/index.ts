// ── Components ──────────────────────────
export {
  DcCanvas,
  DcDesigner,
  DcMaterialGroup,
  DcMaterialItem,
  DcMaterialPanel,
  DcPropertyPanel,
  DcToolbar,
} from './components'

// ── Composables ─────────────────────────
export { useDesigner, useDragDrop, usePropertyBinding } from './composables'
export type { UseDragDropReturn, UsePropertyBindingReturn } from './composables'

// ── Context ─────────────────────────────
export { useDesignerContext } from './context'

// ── Factory ─────────────────────────────
export { createDesigner } from './factory'

// ── Types ───────────────────────────────
export type {
  DesignerContext,
  DesignerExtensions,
  DesignerInstance,
  DesignerOptions,
  PropertyTabKey,
  UseDesignerReturn,
} from './types'
export { DESIGNER_CONTEXT_KEY } from './types'

// ── Re-exports: @dragcraft/core ─────────
export {
  CommandType,
  createEngine,
  EventName,
} from '@dragcraft/core'
export type {
  AddNodePayload,
  Command,
  CommandHandler,
  DesignerEngine,
  DesignerSchema,
  DragTarget,
  EngineOptions,
  HistoryEntry,
  MoveNodePayload,
  RemoveNodePayload,
  SchemaNode,
  SchemaStoreInstance,
  SetGlobalConfigPayload,
  UpdatePropsPayload,
  WidgetMeta,
} from '@dragcraft/core'

// ── Re-exports: @dragcraft/form-generator ─
export {
  FormGenerator,
} from '@dragcraft/form-generator'
export type {
  FieldChangePayload,
  FieldSchema,
  FormSchema,
  SectionSchema,
  ValidationRule,
} from '@dragcraft/form-generator'

// ── Re-exports: @dragcraft/renderer ─────
export {
  RootRenderer,
} from '@dragcraft/renderer'
export type {
  ComponentMap,
  RendererExtensions,
  RendererOptions,
} from '@dragcraft/renderer'

// ── Re-exports: @dragcraft/widgets ──────
export {
  getAllWidgetMetas,
  getDefaultComponentMap,
  getWidgetsByGroup,
  registerAllWidgets,
  widgetGroups,
} from '@dragcraft/widgets'
export type {
  WidgetDefinition,
  WidgetGroup,
  WidgetGroupConfig,
  WidgetType,
} from '@dragcraft/widgets'
