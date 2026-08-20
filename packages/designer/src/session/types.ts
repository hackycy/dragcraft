import type { DeepReadonly as CoreDeepReadonly, DocumentSchema, JsonObject, NodeDefinition } from '@dragcraft/core'
import type { ComputedRef, Ref } from 'vue'
import type { MaterialDefinition } from '../materials/types'
import type {
  ContainerDropDecision,
  CreationBlockReason,
  DeepReadonly,
  DragTarget,
  HistoryState,
  NodeDestination,
  NodeOwner,
  SchemaDiagnostic,
} from '../presentation/semantic'
import type { AuthoringAction, AuthoringDecision, AuthoringResult } from '../presentation/types'

export type DesignerMaterialCapability
  = | 'selectable'
    | 'configurable'
    | 'draggable'
    | 'sortable'
    | 'deletable'

export interface DesignerSessionStructurePosition {
  readonly owner: NodeOwner
  readonly index: number
  readonly siblingCount: number
}

export type DesignerSessionDropRejectionReason = CreationBlockReason & {
  readonly details?: Record<string, unknown>
}

export interface DesignerSessionDragState {
  readonly activeDestination: Ref<NodeDestination | null>
  readonly containerDropDecision: Ref<ContainerDropDecision | null>
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
  isNodeReadOnly: (nodeId: string) => boolean
  getOwner: (nodeId: string) => NodeOwner | null
  getStructurePosition: (nodeId: string) => DesignerSessionStructurePosition | null
  getRegionIds: (containerId: string) => readonly string[]
  getRegionNodes: (containerId: string, regionId: string) => readonly CoreDeepReadonly<NodeDefinition>[]
}

/** Presentation-facing node shape; it is a read-only view, not a persisted tree node. */
export interface DesignerSessionNode {
  readonly id: string
  readonly type: string
  readonly props: JsonObject
  readonly style?: JsonObject
}

export interface DesignerSessionMaterials {
  get: (type: string) => Readonly<MaterialDefinition> | undefined
  getAll: () => readonly Readonly<MaterialDefinition>[]
  resolveCapability: (
    node: DesignerSessionNode,
    capability: DesignerMaterialCapability,
  ) => boolean
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
 * The internal read seam shared by the existing Designer UI and Presentation module.
 * It deliberately exposes document and material facts, never obsolete runtime
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
