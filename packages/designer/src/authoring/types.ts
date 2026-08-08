import type {
  DeepReadonly,
  DiagnosticReport,
  DocumentSchema,
  JsonObject,
  NodeBundle,
  NodeDefinition,
  NodeType,
  PageDefinition,
  ResolvedDocument,
  StructuralDestination,
} from '@dragcraft/core'
import type { Ref, ShallowRef } from 'vue'

export type DesignerDocumentState
  = | {
    readonly status: 'rejected'
    readonly diagnostics: DiagnosticReport
  }
  | {
    readonly status: 'ready' | 'degraded' | 'conflicted'
    readonly diagnostics: DiagnosticReport
    readonly schema: DeepReadonly<DocumentSchema>
  }

export type SchemaLoadResult = DesignerDocumentState

export interface CreateNodeAction {
  readonly type: 'create-node'
  readonly materialType: NodeType
  readonly to: StructuralDestination
}

export interface MoveNodeAction {
  readonly type: 'move-node'
  readonly nodeId: string
  readonly to: StructuralDestination
}

export interface DuplicateNodeAction {
  readonly type: 'duplicate-node'
  readonly nodeId: string
  readonly to: StructuralDestination
}

export interface RemoveNodeAction {
  readonly type: 'remove-node'
  readonly nodeId: string
}

export interface UnwrapContainerAction {
  readonly type: 'unwrap-container'
  readonly containerId: string
}

export interface UpdateNodeAction {
  readonly type: 'update-node'
  readonly nodeId: string
  readonly node: Omit<NodeDefinition, 'id'>
}

export interface UpdateGlobalConfigAction {
  readonly type: 'update-global-config'
  readonly globalConfig: JsonObject
}

export interface UpdatePageAction {
  readonly type: 'update-page'
  readonly page: PageDefinition
}

export interface InsertBundleAction {
  readonly type: 'insert-bundle'
  readonly bundle: NodeBundle
  readonly to: StructuralDestination
  readonly confirmed?: boolean
}

type UnconfirmedSchemaAuthoringAction
  = | CreateNodeAction
    | DuplicateNodeAction
    | MoveNodeAction
    | RemoveNodeAction
    | UnwrapContainerAction
    | UpdateGlobalConfigAction
    | UpdateNodeAction
    | UpdatePageAction
    | InsertBundleAction

export type SchemaAuthoringAction = UnconfirmedSchemaAuthoringAction & {
  readonly confirmed?: boolean
}

export interface AuthoringBatchAction {
  readonly type: 'batch'
  readonly actions: readonly SchemaAuthoringAction[]
}

export interface UndoAction {
  readonly type: 'undo'
}

export interface RedoAction {
  readonly type: 'redo'
}

export interface SelectNodeAction {
  readonly type: 'select-node'
  readonly nodeId: string | null
}

export interface HoverNodeAction {
  readonly type: 'hover-node'
  readonly nodeId: string | null
}

export type AuthoringAction
  = | AuthoringBatchAction
    | HoverNodeAction
    | RedoAction
    | SelectNodeAction
    | SchemaAuthoringAction
    | UndoAction

export type AuthoringResult
  = | { readonly status: 'committed' }
    | { readonly status: 'confirmation-required', readonly code: 'POLICY_CONFIRMATION_REQUIRED' }
    | { readonly status: 'unchanged' }
    | { readonly status: 'rejected', readonly code: string }

export interface DesignerHistory {
  readonly canRedo: Readonly<Ref<boolean>>
  readonly canUndo: Readonly<Ref<boolean>>
  readonly redoCount: Readonly<Ref<number>>
  readonly undoCount: Readonly<Ref<number>>
}

export interface DesignerSelection {
  readonly hoveredNodeId: Readonly<Ref<string | null>>
  readonly selectedNodeId: Readonly<Ref<string | null>>
}

export interface AuthoringEngine {
  readonly document: ShallowRef<DesignerDocumentState>
  readonly history: Readonly<DesignerHistory>
  readonly resolvedDocument: Readonly<Ref<ResolvedDocument | null>>
  readonly selection: Readonly<DesignerSelection>
  execute: (action: AuthoringAction) => AuthoringResult
  exportSchema: () => DocumentSchema | null
  importSchema: (input: unknown) => SchemaLoadResult
}
