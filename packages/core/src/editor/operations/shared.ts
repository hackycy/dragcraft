import type { SchemaDefinitionSnapshot } from '../../definitions/types'
import type {
  DeepReadonly,
  DocumentStructure,
  NodeId,
} from '../../document/types'
import type { ResolvedDocument } from '../../resolver/resolved-document'
import type { SchemaEditResult } from '../apply-schema-operation'
import type { InsertPosition, OwnerRef } from '../structural-destination'
import { resolveSchema } from '../../resolver/resolve-schema'

export function commitCandidate(
  input: unknown,
  definitions: SchemaDefinitionSnapshot,
): SchemaEditResult {
  const resolution = resolveSchema(input, definitions)
  if (resolution.status === 'rejected' || resolution.status === 'conflicted') {
    return {
      status: 'rejected',
      code: 'SCHEMA_INVALID',
      diagnostics: resolution.diagnostics.items,
    }
  }
  return { status: 'committed', document: resolution.document }
}

export function jsonValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right))
    return true
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((item, index) => jsonValuesEqual(item, right[index]))
  }
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object')
    return false
  const leftRecord = left as Record<string, unknown>
  const rightRecord = right as Record<string, unknown>
  const leftKeys = Object.keys(leftRecord)
  return leftKeys.length === Object.keys(rightRecord).length
    && leftKeys.every(key => Object.hasOwn(rightRecord, key) && jsonValuesEqual(leftRecord[key], rightRecord[key]))
}

export function cloneStructure(structure: DeepReadonly<DocumentStructure>): DocumentStructure {
  const containers: DocumentStructure['containers'] = {}
  for (const [containerId, container] of Object.entries(structure.containers)) {
    const regions: Record<string, NodeId[]> = {}
    for (const [regionId, children] of Object.entries(container.regions))
      regions[regionId] = [...children]
    containers[containerId] = { regions }
  }
  return { root: [...structure.root], containers }
}

export function getOwnerSequence(structure: DocumentStructure, owner: OwnerRef): NodeId[] | undefined {
  return owner.kind === 'page-root'
    ? structure.root
    : structure.containers[owner.containerId]?.regions[owner.regionId]
}

export function ownerForNode(document: ResolvedDocument, nodeId: NodeId): OwnerRef | undefined {
  const location = document.locationsById.get(nodeId)
  if (!location)
    return undefined
  return location.kind === 'page-root'
    ? { kind: 'page-root' }
    : {
        kind: 'container-region',
        containerId: location.containerId,
        regionId: location.regionId,
      }
}

export function ownerRefsEqual(left: OwnerRef, right: OwnerRef): boolean {
  return left.kind === 'page-root'
    ? right.kind === 'page-root'
    : right.kind === 'container-region'
      && left.containerId === right.containerId
      && left.regionId === right.regionId
}

type InsertionIndexResult
  = | { readonly ok: true, readonly index: number }
    | { readonly ok: false, readonly result: SchemaEditResult }

export function resolveInsertionIndex(
  sequence: readonly NodeId[],
  position: InsertPosition,
): InsertionIndexResult {
  if (position.kind === 'start')
    return { ok: true, index: 0 }
  if (position.kind === 'end')
    return { ok: true, index: sequence.length }
  const anchorIndex = sequence.indexOf(position.nodeId)
  if (anchorIndex < 0) {
    return {
      ok: false,
      result: {
        status: 'rejected',
        code: 'DESTINATION_ANCHOR_NOT_FOUND',
        details: { nodeId: position.nodeId },
      },
    }
  }
  return {
    ok: true,
    index: position.kind === 'before' ? anchorIndex : anchorIndex + 1,
  }
}

export function destinationOwnerNotFound(owner: OwnerRef): SchemaEditResult {
  return owner.kind === 'container-region'
    ? {
        status: 'rejected',
        code: 'DESTINATION_OWNER_NOT_FOUND',
        details: { containerId: owner.containerId, regionId: owner.regionId },
      }
    : { status: 'rejected', code: 'SCHEMA_INVALID' }
}

export function nodeNotFound(nodeId: NodeId): SchemaEditResult {
  return {
    status: 'rejected',
    code: 'NODE_NOT_FOUND',
    details: { nodeId },
  }
}
