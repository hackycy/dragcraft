import type { ContainerStructure, NodeDefinition, NodeId } from '../document/types'

export interface NodeBundle {
  readonly entryId: NodeId
  readonly nodes: readonly NodeDefinition[]
  readonly containers: Readonly<Record<NodeId, ContainerStructure>>
}
