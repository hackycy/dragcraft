import type { NodeType, RegionId } from '../document/types'

export interface RegionDeclaration {
  readonly id: RegionId
  readonly accepts?: {
    readonly types?: readonly NodeType[]
  }
  readonly cardinality?: {
    readonly min?: number
    readonly max?: number
  }
}

export interface ContainerDeclaration {
  readonly regions: readonly RegionDeclaration[]
}

export interface SchemaTypeDeclaration {
  readonly container?: ContainerDeclaration
}

export interface SchemaDefinitionSnapshot {
  readonly revision: number
  readonly types: ReadonlyMap<NodeType, SchemaTypeDeclaration>
}
