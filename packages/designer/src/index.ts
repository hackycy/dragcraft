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
  DcDesigner,
} from './components'

// ── Composables ─────────────────────────
export { useDesigner, usePropertyBinding } from './composables'
export type { UsePropertyBindingReturn } from './composables'
// ── Context ─────────────────────────────
// ── Factory ─────────────────────────────
export { createDesigner, DOCUMENT_SCHEMA_VERSION } from './factory'

// ── Material protocol helpers ────────────
export {
  isMaterialPanelVisible,
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
  MaterialPanelVisibility,
  MaterialPanelVisibilityContext,
  MaterialSchemaDeclaration,
  PresentationFrame,
} from './materials/types'
// ── Messages ────────────────────────────
export { designerMessages } from './messages'

// ── Re-exports: Presentation ────────────
export type {
  NodeActionDefinition,
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
export { default as DesignerRegionOutlet } from './presentation/container-region-outlet'
export { useContainerRuntime } from './presentation/container-runtime'
export { DesignerViewportPortal, useSurfaceReservation } from './presentation/surface-geometry'
// ── Types ───────────────────────────────
export type {
  DesignerDeviceFrame,
  DesignerExtensions,
  DesignerInstance,
  DesignerOptions,
  DesignerRailSlotAPI,
  DesignerWorkspaceController,
  DesignerWorkspaceMode,
  DesignerWorkspaceOptions,
  LeftPanelTabKey,
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
