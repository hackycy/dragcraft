import type { SchemaDefinitionSnapshot } from '../definitions/types'
import type {
  DeepReadonly,
  DocumentSchema,
  NodeDefinition,
  NodeId,
  RegionId,
} from '../document/types'

export interface ResolvedNode {
  readonly node: DeepReadonly<NodeDefinition>
  readonly state: 'resolved' | 'unresolved' | 'conflicted'
  readonly readOnly: boolean
}

export type NodeLocation
  = | { readonly kind: 'page-root', readonly index: number }
    | {
      readonly kind: 'container-region'
      readonly containerId: NodeId
      readonly regionId: RegionId
      readonly index: number
    }

export interface ResolvedRegion {
  readonly id: RegionId
  readonly children: readonly ResolvedNode[]
}

export interface ResolvedContainer {
  readonly owner: ResolvedNode
  readonly regions: ReadonlyMap<RegionId, ResolvedRegion>
}

export interface ResolvedDocument {
  readonly schema: DeepReadonly<DocumentSchema>
  readonly nodesById: ReadonlyMap<NodeId, ResolvedNode>
  readonly locationsById: ReadonlyMap<NodeId, NodeLocation>
  readonly root: readonly ResolvedNode[]
  readonly containersById: ReadonlyMap<NodeId, ResolvedContainer>
}

class ImmutableMap<Key, Value> implements ReadonlyMap<Key, Value> {
  readonly #map: Map<Key, Value>

  constructor(entries?: Iterable<readonly [Key, Value]>) {
    this.#map = new Map(entries)
    Object.freeze(this)
  }

  get size(): number {
    return this.#map.size
  }

  [Symbol.iterator](): MapIterator<[Key, Value]> {
    return this.#map[Symbol.iterator]()
  }

  entries(): MapIterator<[Key, Value]> {
    return this.#map.entries()
  }

  forEach(callbackfn: (value: Value, key: Key, map: ReadonlyMap<Key, Value>) => void, thisArg?: unknown): void {
    this.#map.forEach((value, key) => callbackfn.call(thisArg, value, key, this))
  }

  get(key: Key): Value | undefined {
    return this.#map.get(key)
  }

  has(key: Key): boolean {
    return this.#map.has(key)
  }

  keys(): MapIterator<Key> {
    return this.#map.keys()
  }

  values(): MapIterator<Value> {
    return this.#map.values()
  }
}

export function immutableMap<Key, Value>(entries?: Iterable<readonly [Key, Value]>): ReadonlyMap<Key, Value> {
  return new ImmutableMap(entries)
}

export function createResolvedDocument(
  schema: DeepReadonly<DocumentSchema>,
  definitions: SchemaDefinitionSnapshot,
  conflictedNodeIds: ReadonlySet<NodeId> = new Set(),
): ResolvedDocument {
  const mutableNodesById = new Map<NodeId, ResolvedNode>()
  for (const node of schema.nodes) {
    const definition = definitions.types.get(node.type)
    const resolved = definition !== undefined
    const conflicted = conflictedNodeIds.has(node.id)
    mutableNodesById.set(node.id, Object.freeze({
      node,
      state: conflicted ? 'conflicted' : resolved ? 'resolved' : 'unresolved',
      readOnly: !resolved || conflicted,
    }))
  }

  const mutableLocationsById = new Map<NodeId, NodeLocation>()
  const root = schema.structure.root.flatMap((nodeId, index) => {
    const node = mutableNodesById.get(nodeId)
    if (!node)
      return []
    mutableLocationsById.set(nodeId, Object.freeze({ kind: 'page-root', index }))
    return [node]
  })

  const mutableContainersById = new Map<NodeId, ResolvedContainer>()
  for (const [containerId, structure] of Object.entries(schema.structure.containers)) {
    const owner = mutableNodesById.get(containerId)
    if (!owner)
      continue
    const regions: [RegionId, ResolvedRegion][] = []
    const declaredRegionIds = definitions.types.get(owner.node.type)?.container?.regions.map(region => region.id) ?? []
    const declaredRegionIdSet = new Set(declaredRegionIds)
    const regionIds = [
      ...declaredRegionIds.filter(regionId => Object.hasOwn(structure.regions, regionId)),
      ...Object.keys(structure.regions).filter(regionId => !declaredRegionIdSet.has(regionId)),
    ]
    for (const regionId of regionIds) {
      const childIds = structure.regions[regionId]
      const children = childIds.flatMap((nodeId, index) => {
        const child = mutableNodesById.get(nodeId)
        if (!child)
          return []
        mutableLocationsById.set(nodeId, Object.freeze({
          kind: 'container-region',
          containerId,
          regionId,
          index,
        }))
        return [child]
      })
      regions.push([regionId, Object.freeze({ id: regionId, children: Object.freeze(children) })])
    }
    mutableContainersById.set(containerId, Object.freeze({
      owner,
      regions: immutableMap(regions),
    }))
  }

  return Object.freeze({
    schema,
    nodesById: immutableMap(mutableNodesById),
    locationsById: immutableMap(mutableLocationsById),
    root: Object.freeze(root),
    containersById: immutableMap(mutableContainersById),
  })
}
