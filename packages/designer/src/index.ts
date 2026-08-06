import type { DiagnosticReport as CoreDiagnosticReport } from '@dragcraft/core'

export type {
  AuthoringAction,
  AuthoringBatchAction,
  AuthoringResult,
  CreateNodeAction,
  DesignerDocumentState,
  DesignerHistory,
  DesignerSelection,
  DuplicateNodeAction,
  HoverNodeAction,
  MoveNodeAction,
  RedoAction,
  RemoveNodeAction,
  SchemaAuthoringAction,
  SchemaLoadResult,
  SelectNodeAction,
  UndoAction,
  UnwrapContainerAction,
  UpdateGlobalConfigAction,
  UpdateNodeAction,
  UpdatePageAction,
} from './authoring/types'
export { default as DcDesigner } from './components/DcDesigner'
export { useDesigner } from './composables/useDesigner'
export { defineMaterial } from './materials/define-material'
export type {
  DesignerPresentation,
  InspectorDefinition,
  MaterialAuthoringDefinition,
  MaterialAuthoringPolicy,
  MaterialAuthoringPolicyAction,
  MaterialAuthoringPolicyContext,
  MaterialAuthoringPolicyDecision,
  MaterialAuthoringPolicyRule,
  MaterialBundleFactory,
  MaterialBundleFactoryContext,
  MaterialDefinition,
  MaterialPanelDefinition,
  MaterialSchemaDeclaration,
} from './materials/types'
export { default as DesignerRegionOutlet } from './presentation/designer-region-outlet'
export type { RegionDropAnchorResolver, RegionDropGeometryContext } from './presentation/designer-region-outlet'

export { default as DesignerViewportPortal } from './presentation/designer-viewport-portal'

export type SchemaDiagnostic = CoreDiagnosticReport['items'][number]

export type {
  MaterialPresentationContext,
  MaterialPresentationNode,
  MaterialPreviewContext,
  MaterialSelfPatch,
} from './presentation/material-preview-context'

export type { PresentationOwner } from './presentation/node-host'

export { useSurfaceReservation } from './presentation/surface-reservation'
export type {
  SurfaceReservation,
  SurfaceReservationEdge,
  SurfaceReservationOptions,
} from './presentation/surface-reservation'
export {
  createDesigner,
  DOCUMENT_SCHEMA_VERSION,
} from './session/create-designer'
export type {
  CreateDesignerOptions,
  DesignerInstance,
} from './session/create-designer'

export type {
  ContainerShell,
  ContainerShellSource,
  DesignerExtensions,
  DesignerRailSlotAPI,
  DesignerWorkbenchOptions,
  DesignerWorkspaceOptions,
  MaterialItemRenderProps,
  UseDesignerReturn,
} from './types'
export type {
  DocumentContainerStructure as ContainerStructure,
  DiagnosticReport,
  DocumentDeepReadonly,
  DocumentSchema,
  DocumentStructure,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  NodeDefinition,
  NodeId,
  NodeType,
  PageDefinition,
  RegionId,
  StructuralDestination,
} from '@dragcraft/core'

export type {
  FieldBindingScope,
  FieldBindingTarget,
  FieldChangePayload,
  FieldComponentDefinition,
  FieldComponentMap,
  FieldComponentProps,
  FieldComponentTransformContext,
  FieldDependencies,
  FieldRenderContext,
  FieldRenderFactory,
  FieldSchema,
  FormContext,
  FormGeneratorContext,
  FormGeneratorProps,
  FormSchema,
  SectionSchema,
  SectionTogglePayload,
  TypedFieldSchema,
  TypedFormSchema,
  TypedSectionSchema,
  ValidationError,
  ValidationRule,
} from '@dragcraft/form-generator'
