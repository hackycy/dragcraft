import type {
  ContainerPlanResult,
  CreationBlockReason,
  DeepReadonly,
  DesignerSchema,
  DragTarget,
  HistoryState,
  NodeDestination,
  NodeOwner,
  OwnerResolutionResult,
  PlacementDecision,
  ResolvedNodeDestination,
  ResolvedNodeLayout,
  SchemaDiagnostic,
  SchemaNode,
} from '@dragcraft/legacy-core'
import type { AuthoringAction, AuthoringDecision, AuthoringResult, RendererWidgetMeta } from '@dragcraft/renderer'
import type { ComputedRef, Ref } from 'vue'

export type DesignerMaterialCapability
  = | 'selectable'
    | 'configurable'
    | 'draggable'
    | 'sortable'
    | 'deletable'
    | 'variantChangeable'

export interface DesignerSessionStructurePosition {
  readonly owner: NodeOwner
  readonly index: number
  readonly siblingCount: number
  readonly sortScope: string | false
  readonly lockedIndices: ReadonlySet<number>
}

export type DesignerSessionDropRejectionReason = CreationBlockReason & {
  readonly details?: Record<string, unknown>
}

export interface DesignerSessionDragState {
  readonly activeDestination: Ref<NodeDestination | null>
  readonly containerDropDecision: Ref<PlacementDecision | null>
  readonly isForbidden: Ref<boolean>
  readonly forbiddenReason: Ref<DesignerSessionDropRejectionReason | null>
}

export interface DesignerSessionDocument {
  readonly schema?: ComputedRef<DeepReadonly<DesignerSchema>>
  readonly version: ComputedRef<string>
  readonly root: ComputedRef<DeepReadonly<SchemaNode>>
  readonly rootNodes: ComputedRef<readonly DeepReadonly<SchemaNode>[]>
  readonly globalConfig: ComputedRef<DeepReadonly<Record<string, unknown>>>
  readonly diagnostics: ComputedRef<readonly SchemaDiagnostic[]>
  getNode: (nodeId: string) => DeepReadonly<SchemaNode> | null
  getOwner: (nodeId: string) => NodeOwner | null
  getStructurePosition: (nodeId: string) => DesignerSessionStructurePosition | null
  getRegionNodes: (containerId: string, regionId: string) => readonly DeepReadonly<SchemaNode>[]
  resolveDestination?: (
    destination: NodeDestination,
  ) => OwnerResolutionResult<ResolvedNodeDestination>
}

export interface DesignerSessionMaterials {
  get: (type: string) => RendererWidgetMeta | undefined
  getAll: () => readonly RendererWidgetMeta[]
  resolveCapability: (
    node: DeepReadonly<SchemaNode>,
    capability: DesignerMaterialCapability,
  ) => boolean
  resolveLayout: (node: DeepReadonly<SchemaNode>) => ResolvedNodeLayout
  resolveContainer: (node: DeepReadonly<SchemaNode>) => ContainerPlanResult
  getLockedIndices: (nodes: readonly DeepReadonly<SchemaNode>[]) => Set<number>
  canCreateSubtree: (node: DeepReadonly<SchemaNode>) => boolean
  canDeleteSubtree: (node: DeepReadonly<SchemaNode>) => boolean
}

export interface DesignerSessionState {
  readonly selectedNodeId: Readonly<Ref<string | null>>
  readonly hoveredNodeId: Readonly<Ref<string | null>>
  readonly dragTarget: Readonly<Ref<DragTarget | null>>
  readonly drag: DesignerSessionDragState
  readonly history: Readonly<Ref<HistoryState>>
}

/**
 * The internal read seam shared by the existing Designer UI and Renderer.
 * It deliberately exposes document and material facts, never legacy runtime
 * collaborators such as an Engine, Store, Registry, or LayoutPlan.
 */
export interface DesignerSession {
  readonly document: DesignerSessionDocument
  readonly materials: DesignerSessionMaterials
  readonly state: DesignerSessionState
  evaluate: (action: AuthoringAction) => AuthoringDecision
  execute: (action: AuthoringAction) => AuthoringResult
}

export type { AuthoringAction, AuthoringDecision, AuthoringResult } from '@dragcraft/renderer'
