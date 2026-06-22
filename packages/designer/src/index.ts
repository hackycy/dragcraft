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

// ── Messages ────────────────────────────
export { designerMessages } from './messages'
// ── Types ───────────────────────────────
export type {
  DesignerContext,
  DesignerExtensions,
  DesignerInstance,
  DesignerOptions,
  PropertyTabKey,
  ToolbarSlotAPI,
  UseDesignerReturn,
  WidgetGroupConfig,
} from './types'

export { DESIGNER_CONTEXT_KEY } from './types'
// ── Re-exports: @dragcraft/core ─────────
export {
  CommandType,
  createEngine,
  EventName,
  resolveBehavior,
} from '@dragcraft/core'

export type {
  AddNodePayload,
  BehaviorPredicate,
  Command,
  CommandHandler,
  DesignerEngine,
  DesignerSchema,
  DragTarget,
  EngineOptions,
  HistoryEntry,
  InstanceBehaviorContext,
  MoveNodePayload,
  RemoveNodePayload,
  SchemaNode,
  SchemaStoreInstance,
  SetGlobalConfigPayload,
  TypeBehaviorContext,
  UpdatePropsPayload,
  WidgetActionConfig,
  WidgetMeta,
} from '@dragcraft/core'
// ── Re-exports: @dragcraft/form-generator ─
export {
  FormGenerator,
} from '@dragcraft/form-generator'

export type {
  FieldChangePayload,
  FieldComponentMap,
  FieldSchema,
  FormSchema,
  SectionSchema,
  ValidationRule,
} from '@dragcraft/form-generator'

// ── Re-exports: @dragcraft/renderer ─────
export {
  ActionKey,
  createDefaultActions,
  createNodeActionRegistry,
  DefaultEmptyState,
  DefaultNodeHandle,
  DefaultNodeMask,
  DefaultNodeToolbar,
  RootRenderer,
  useNodeActions,
  useNodeDrag,
  useWidgetNode,
} from '@dragcraft/renderer'
export type {
  ComponentMap,
  EmptyStateProps,
  NodeActionContext,
  NodeActionDefinition,
  NodeActionRegistry,
  NodeHandleProps,
  NodeMaskProps,
  NodeToolbarProps,
  NodeWrapperProps,
  RendererEventHooks,
  RendererExtensions,
  RendererOptions,
  ResolvedNodeAction,
  WidgetFallbackProps,
} from '@dragcraft/renderer'

// ── Re-exports: @dragcraft/utils ────────
export { createI18n, I18N_KEY, useI18n } from '@dragcraft/utils'
export type { FlatMessages, I18nInstance, LocaleMessages, MessageTree } from '@dragcraft/utils'
