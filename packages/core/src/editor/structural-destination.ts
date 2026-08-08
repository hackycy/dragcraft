import type { NodeId, RegionId } from '../document/types'

export type OwnerRef
  = | { readonly kind: 'page-root' }
    | { readonly kind: 'container-region', readonly containerId: NodeId, readonly regionId: RegionId }

export type InsertPosition
  = | { readonly kind: 'start' }
    | { readonly kind: 'end' }
    | { readonly kind: 'before', readonly nodeId: NodeId }
    | { readonly kind: 'after', readonly nodeId: NodeId }

export interface StructuralDestination {
  readonly owner: OwnerRef
  readonly position: InsertPosition
}
