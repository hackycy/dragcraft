export {
  createBindingCommand,
  readBindingValue,
  resolveFieldBinding,
} from './bindings/field-binding'

export type { FieldBinding, ResolvedFieldBinding } from './bindings/field-binding'
// ── Components ──────────────────────────
export {
  DcCanvas,
  DcCanvasControls,
  DcDesigner,
  DcLeftSidebar,
  DcMaterialGroup,
  DcMaterialItem,
  DcMaterialPanel,
  DcPropertyPanel,
  DcRightSidebar,
  DcStructurePanel,
} from './components'

// ── Composables ─────────────────────────
export { useDesigner, useDragDrop, usePropertyBinding } from './composables'

export type { UseDragDropReturn, UsePropertyBindingReturn } from './composables'
// ── Context ─────────────────────────────
export { useDesignerContext } from './context'
// ── Factory ─────────────────────────────
export { createDesigner } from './factory'
// ── Material protocol helpers ────────────
export {
  materialItemMatchesQuery,
  resolveMaterialItem,
} from './material'

// ── Messages ────────────────────────────
export { designerMessages } from './messages'

// ── Types ───────────────────────────────
export type {
  DesignerContext,
  DesignerExtensions,
  DesignerInstance,
  DesignerOptions,
  DesignerRailSlotAPI,
  DesignerWidgetMeta,
  DesignerWorkspaceController,
  DesignerWorkspaceMode,
  DesignerWorkspaceOptions,
  LeftPanelTabKey,
  MaterialDisplayMeta,
  MaterialItemIcon,
  MaterialItemRenderProps,
  PropertyTabKey,
  ResolvedMaterialItem,
  UseDesignerReturn,
  WidgetGroupConfig,
} from './types'
export { DESIGNER_CONTEXT_KEY } from './types'

export { createDesignerWorkspace } from './workspace'
// ── Re-exports: @dragcraft/core ─────────
export {
  CommandType,
  createEngine,
  EventName,
  resolveBehavior,
  resolveCreatable,
} from '@dragcraft/core'

export type {
  AddNodePayload,
  BehaviorPredicate,
  Command,
  CommandHandler,
  ContainerDefinition,
  ContainerVariantMigrationContext,
  ContainerVariantMigrationResult,
  CreatableBehaviorPredicate,
  CreatableBehaviorResult,
  CreatableDecision,
  CreationBlockReason,
  DesignerEngine,
  DesignerSchema,
  DragTarget,
  EngineOptions,
  HistoryEntry,
  HistoryState,
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
  ContainerRegionOutlet,
  createConfirmActionInterceptor,
  createDefaultActions,
  createNodeActionRegistry,
  DefaultEmptyState,
  DefaultNodeHandle,
  DefaultNodeMask,
  DefaultNodeToolbar,
  RootRenderer,
  useContainerRuntime,
  useNodeActions,
  useNodeDrag,
  useWidgetNode,
} from '@dragcraft/renderer'
export type {
  ActionConfirmRequest,
  ActionDecision,
  ActionInterceptor,
  ActionInvocation,
  ActionRisk,
  ComponentMap,
  ConfirmActionInterceptorOptions,
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
  WidgetActionConfig as RendererWidgetActionConfig,
  RendererWidgetActionExtra,
  RendererWidgetMeta,
  ResolveContainerDropIndexContext,
  ResolvedNodeAction,
  WidgetFallbackProps,
} from '@dragcraft/renderer'

// ── Re-exports: @dragcraft/utils ────────
export { createI18n, I18N_KEY, useI18n } from '@dragcraft/utils'
export type { FlatMessages, I18nInstance, LocaleMessages, MessageTree } from '@dragcraft/utils'
