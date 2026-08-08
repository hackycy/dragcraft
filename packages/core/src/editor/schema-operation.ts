import type { JsonObject, NodeDefinition, NodeId, PageDefinition } from '../document/types'
import type { NodeBundle } from './node-bundle'
import type { StructuralDestination } from './structural-destination'

export interface UpdateGlobalConfigOperation {
  readonly type: 'update-global-config'
  readonly globalConfig: JsonObject
}

export interface UpdatePageOperation {
  readonly type: 'update-page'
  readonly page: PageDefinition
}

export interface UpdateNodeOperation {
  readonly type: 'update-node'
  readonly nodeId: NodeId
  readonly node: Omit<NodeDefinition, 'id'>
}

export interface InsertBundleOperation {
  readonly type: 'insert-bundle'
  readonly bundle: NodeBundle
  readonly to: StructuralDestination
}

export interface MoveOperation {
  readonly type: 'move'
  readonly nodeId: NodeId
  readonly to: StructuralDestination
}

export interface RemoveOperation {
  readonly type: 'remove'
  readonly nodeId: NodeId
}

export interface UnwrapOperation {
  readonly type: 'unwrap'
  readonly containerId: NodeId
}

export type SchemaOperation
  = UpdateGlobalConfigOperation
    | UpdateNodeOperation
    | UpdatePageOperation
    | InsertBundleOperation
    | MoveOperation
    | RemoveOperation
    | UnwrapOperation

export interface OperationBatch {
  readonly type: 'batch'
  readonly operations: readonly SchemaOperation[]
}
