export {
  createBindingAction,
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
  DesignerEngineOptions,
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
} from './types'
export { DESIGNER_CONTEXT_KEY } from './types'

export { createDesignerWorkspace } from './workspace'
// ── Re-exports: @dragcraft/core ─────────
export {
  CommandType,
  createContainerPlan,
  createEngine,
  EventName,
  isSchemaManagedWidget,
  isWidgetVisibleInMaterialPanel,
  resolveAuthoringPolicy,
  resolveBehavior,
  resolveCreatable,
  resolveWidgetCreation,
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
  EngineStore,
  HistoryEntry,
  HistoryState,
  InstanceBehaviorContext,
  MoveNodePayload,
  RemoveNodePayload,
  ResolvedAuthoringPolicy,
  SchemaNode,
  SetGlobalConfigPayload,
  TypeBehaviorContext,
  UpdatePropsPayload,
  WidgetActionConfig,
  WidgetMeta,
} from '@dragcraft/core'
// ── Re-exports: @dragcraft/form-generator ─
export {
  findFieldSchema,
  FormGenerator,
  resolveFieldComponentProps,
  useFieldDependencies,
  useFieldState,
  useFormGeneratorContext,
  useFormValidation,
} from '@dragcraft/form-generator'

export type {
  FieldBindingScope,
  FieldBindingTarget,
  FieldChangePayload,
  FieldComponentDefinition,
  FieldComponentMap,
  FieldComponentProps,
  FieldComponentTransformContext,
  FieldDependencies,
  FieldDependenciesResult,
  FieldRenderContext,
  FieldRenderFactory,
  FieldSchema,
  FieldState,
  FormContext,
  FormGeneratorContext,
  FormGeneratorProps,
  FormSchema,
  FormValidation,
  SectionSchema,
  SectionTogglePayload,
  TypedFieldSchema,
  TypedFormSchema,
  TypedSectionSchema,
  ValidationError,
  ValidationRule,
} from '@dragcraft/form-generator'

// ── Re-exports: @dragcraft/i18n ─────────
export { createI18n, I18N_KEY, useI18n } from '@dragcraft/i18n'
export type { FlatMessages, I18nInstance, LocaleMessages, MessageTree } from '@dragcraft/i18n'

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
  useNodeInteractionGeometry,
  useWidgetNode,
  useWidgetRuntime,
} from '@dragcraft/renderer'
export type {
  ActionConfirmRequest,
  ActionDecision,
  ActionInterceptor,
  ActionInvocation,
  ActionRisk,
  ComponentMap,
  ConfirmActionInterceptorOptions,
  ContainerShell,
  ContainerShellSource,
  DeepReadonly,
  EmptyStateProps,
  NodeActionContext,
  NodeActionDefinition,
  NodeActionRegistry,
  NodeHandleProps,
  NodeInteractionGeometry,
  NodeInteractionGeometryMode,
  NodeInteractionPresentation,
  NodeInteractionRect,
  NodeMaskProps,
  NodeToolbarOrientation,
  NodeToolbarPlacement,
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
  UseNodeInteractionGeometryOptions,
  UseNodeInteractionGeometryReturn,
  WidgetFallbackProps,
  WidgetRuntimeContext,
} from '@dragcraft/renderer'

export { DcScrollArea } from '@dragcraft/ui'
export type { ScrollAreaProps, ScrollAreaType } from '@dragcraft/ui'

// ── Re-exports: @dragcraft/widgets ───────
export {
  buildComponentMap,
  defineContainerWidget,
  filterByGroup,
  getWidgetMetas,
  registerWidgets,
} from '@dragcraft/widgets'
export type {
  WidgetDefinition,
  WidgetGroup,
  WidgetGroupConfig,
} from '@dragcraft/widgets'
