export type {
  AuthoringAction,
  AuthoringResult,
  DesignerDocumentState,
  DesignerHistory,
  DesignerSelection,
  SchemaLoadResult,
} from './authoring/types'

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
// ── Factory ─────────────────────────────
export { createDesigner, DOCUMENT_SCHEMA_VERSION } from './factory'

// ── Material protocol helpers ────────────
export {
  materialItemMatchesQuery,
  resolveMaterialItem,
} from './material'
export { DesignerConfigurationError } from './materials/create-material-catalog'
// ── Material protocol ───────────────────
export { defineMaterial } from './materials/define-material'
export type {
  DesignerPresentation,
  InspectorDefinition,
  MaterialAuthoringDefinition,
  MaterialDefinition,
  MaterialPanelDefinition,
  MaterialPresentationAnchor,
  MaterialPresentationEdge,
  MaterialPresentationLayout,
  MaterialPresentationPlacement,
  MaterialSchemaDeclaration,
} from './materials/types'
// ── Messages ────────────────────────────
export { designerMessages } from './messages'

// ── Re-exports: Presentation ────────────
export {
  ActionKey,
  createDefaultActions,
  createNodeActionRegistry,
} from './presentation/action-registry'

export type {
  NodeActionContext,
  NodeActionDefinition,
  NodeActionRegistry,
  ResolvedNodeAction,
} from './presentation/action-registry'
export { createConfirmActionInterceptor } from './presentation/action-runtime'

export type {
  ActionConfirmRequest,
  ActionDecision,
  ActionInterceptor,
  ActionInvocation,
  ActionRisk,
  ConfirmActionInterceptorOptions,
} from './presentation/action-runtime'
export { default as ContainerRegionOutlet } from './presentation/container-region-outlet'

export { useContainerRuntime } from './presentation/container-runtime'
export { default as DefaultEmptyState } from './presentation/default-empty-state'

export { default as DefaultNodeHandle } from './presentation/default-node-handle'

export { default as DefaultNodeMask } from './presentation/default-node-mask'
export { default as DefaultNodeToolbar } from './presentation/default-node-toolbar'

export type { RendererEventHooks } from './presentation/event-hooks'
export type {
  ContainerShell,
  ContainerShellSource,
  EmptyStateProps,
  NodeHandleProps,
  NodeMaskProps,
  NodeToolbarProps,
  RendererExtensions,
  ResolveContainerDropIndexContext,
} from './presentation/types'
export { useNodeActions } from './presentation/use-node-actions'
export { useNodeDrag } from './presentation/use-node-drag'
export { useNodeInteractionGeometry } from './presentation/use-node-interaction-geometry'
export type {
  NodeInteractionGeometry,
  NodeInteractionRect,
  UseNodeInteractionGeometryOptions,
  UseNodeInteractionGeometryReturn,
} from './presentation/use-node-interaction-geometry'
export { useWidgetNode } from './presentation/use-widget-node'
export { useWidgetRuntime } from './presentation/widget-runtime'
export type { WidgetRuntimeContext } from './presentation/widget-runtime'
// ── Types ───────────────────────────────
export type {
  DesignerExtensions,
  DesignerInstance,
  DesignerOptions,
  DesignerRailSlotAPI,
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
export { createDesignerWorkspace } from './workspace'
export type { DocumentSchema, JsonObject, JsonValue, NodeDefinition, NodeId, NodeType, PageDefinition, RegionId } from '@dragcraft/core'
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
export { DcScrollArea } from '@dragcraft/ui'
export type { ScrollAreaProps, ScrollAreaType } from '@dragcraft/ui'
