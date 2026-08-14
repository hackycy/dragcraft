import type { DeepReadonly as CoreDeepReadonly, DocumentSchema, NodeDefinition } from '@dragcraft/core'
import type { ComputedRef, Ref } from 'vue'
import type {
  ContainerPlanResult,
  CreationBlockReason,
  DeepReadonly,
  DragTarget,
  HistoryState,
  NodeDestination,
  NodeOwner,
  OwnerResolutionResult,
  PlacementDecision,
  ResolvedNodeLayout,
  SchemaDiagnostic,
} from '../presentation/semantic'
import type { AuthoringAction, AuthoringDecision, AuthoringResult, RendererWidgetMeta } from '../presentation/types'

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
  readonly schema: ComputedRef<CoreDeepReadonly<DocumentSchema> | null>
  readonly version: ComputedRef<string>
  readonly rootNodes: ComputedRef<readonly CoreDeepReadonly<NodeDefinition>[]>
  readonly globalConfig: ComputedRef<DeepReadonly<Record<string, unknown>>>
  readonly diagnostics: ComputedRef<readonly SchemaDiagnostic[]>
  getNode: (nodeId: string) => CoreDeepReadonly<NodeDefinition> | null
  getOwner: (nodeId: string) => NodeOwner | null
  getStructurePosition: (nodeId: string) => DesignerSessionStructurePosition | null
  getRegionNodes: (containerId: string, regionId: string) => readonly CoreDeepReadonly<NodeDefinition>[]
  resolveDestination?: (
    destination: NodeDestination,
  ) => OwnerResolutionResult<DesignerSessionDestination>
}

/** Presentation-facing node shape; it is a read-only view, not a persisted tree node. */
export interface DesignerSessionNode {
  readonly id: string
  readonly type: string
  readonly props: Record<string, unknown>
  readonly style?: Record<string, unknown>
}

export interface DesignerSessionDestination {
  readonly children: readonly CoreDeepReadonly<NodeDefinition>[]
  readonly destination: NodeDestination
  readonly container?: CoreDeepReadonly<NodeDefinition>
  readonly definition?: DesignerSessionContainerDefinition
  readonly variant?: DesignerSessionContainerVariant
  readonly region?: DesignerSessionContainerRegion
}

export interface DesignerSessionContainerRegion {
  readonly id: string
  readonly title: string
  readonly titleKey?: string
  readonly constraints?: {
    readonly includeTypes?: readonly string[]
    readonly excludeTypes?: readonly string[]
    readonly minItems?: number
    readonly maxItems?: number
  }
}

export interface DesignerSessionContainerVariant {
  readonly title: string
  readonly titleKey?: string
  readonly regions: readonly DesignerSessionContainerRegion[]
}

export interface DesignerSessionContainerDefinition {
  readonly defaultVariant: string
  readonly variants: Readonly<Record<string, DesignerSessionContainerVariant>>
  readonly canPlace?: (context: Record<string, unknown>) => PlacementDecision
}

export interface DesignerSessionMaterials {
  get: (type: string) => RendererWidgetMeta | undefined
  getAll: () => readonly RendererWidgetMeta[]
  resolveCapability: (
    node: DesignerSessionNode,
    capability: DesignerMaterialCapability,
  ) => boolean
  resolveLayout: (node: DesignerSessionNode) => ResolvedNodeLayout
  resolveContainer: (node: DesignerSessionNode) => ContainerPlanResult
  getLockedIndices: (nodes: readonly DesignerSessionNode[]) => Set<number>
  canCreateSubtree: (node: DesignerSessionNode) => boolean
  canDeleteSubtree: (node: DesignerSessionNode) => boolean
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
 * collaborators such as a backend store or registry.
 */
export interface DesignerSession {
  readonly document: DesignerSessionDocument
  readonly materials: DesignerSessionMaterials
  readonly state: DesignerSessionState
  evaluate: (action: AuthoringAction) => AuthoringDecision
  execute: (action: AuthoringAction) => AuthoringResult
}

export type { AuthoringAction, AuthoringDecision, AuthoringResult } from '../presentation/types'
