import type { SchemaDefinitionSnapshot } from '../../definitions/types'
import type { ResolvedDocument } from '../../resolver/resolved-document'
import type { SchemaEditResult } from '../apply-schema-operation'
import type { InsertBundleOperation } from '../schema-operation'
import {
  cloneStructure,
  commitCandidate,
  destinationOwnerNotFound,
  getOwnerSequence,
  resolveInsertionIndex,
} from './shared'

export function applyInsertBundle(
  document: ResolvedDocument,
  operation: InsertBundleOperation,
  definitions: SchemaDefinitionSnapshot,
): SchemaEditResult {
  const bundleNodeIds = new Set<string>()
  for (const node of operation.bundle.nodes) {
    if (bundleNodeIds.has(node.id)) {
      return {
        status: 'rejected',
        code: 'BUNDLE_INVALID',
        details: { nodeId: node.id, reason: 'duplicate-bundle-node-id' },
      }
    }
    bundleNodeIds.add(node.id)
  }
  if (!bundleNodeIds.has(operation.bundle.entryId)) {
    return {
      status: 'rejected',
      code: 'BUNDLE_INVALID',
      details: { reason: 'entry-not-in-bundle', entryId: operation.bundle.entryId },
    }
  }
  const ownedNodeIds = new Set<string>()
  for (const [containerId, container] of Object.entries(operation.bundle.containers)) {
    if (!bundleNodeIds.has(containerId)) {
      return {
        status: 'rejected',
        code: 'BUNDLE_INVALID',
        details: { nodeId: containerId, reason: 'container-not-in-bundle' },
      }
    }
    for (const children of Object.values(container.regions)) {
      const externalChildId = children.find(nodeId => !bundleNodeIds.has(nodeId))
      if (externalChildId) {
        return {
          status: 'rejected',
          code: 'BUNDLE_INVALID',
          details: { nodeId: externalChildId, reason: 'child-not-in-bundle' },
        }
      }
      for (const childId of children) {
        if (ownedNodeIds.has(childId)) {
          return {
            status: 'rejected',
            code: 'BUNDLE_INVALID',
            details: { nodeId: childId, reason: 'node-multiple-owners' },
          }
        }
        ownedNodeIds.add(childId)
      }
    }
  }
  if (ownedNodeIds.has(operation.bundle.entryId)) {
    return {
      status: 'rejected',
      code: 'BUNDLE_INVALID',
      details: { nodeId: operation.bundle.entryId, reason: 'entry-has-internal-owner' },
    }
  }
  const unownedNode = operation.bundle.nodes
    .find(node => node.id !== operation.bundle.entryId && !ownedNodeIds.has(node.id))
  if (unownedNode) {
    return {
      status: 'rejected',
      code: 'BUNDLE_INVALID',
      details: { nodeId: unownedNode.id, reason: 'node-unowned' },
    }
  }
  const conflictingNode = operation.bundle.nodes.find(node => document.nodesById.has(node.id))
  if (conflictingNode) {
    return {
      status: 'rejected',
      code: 'BUNDLE_INVALID',
      details: { nodeId: conflictingNode.id, reason: 'node-id-conflict' },
    }
  }

  const structure = cloneStructure(document.schema.structure)
  const target = getOwnerSequence(structure, operation.to.owner)
  if (!target)
    return destinationOwnerNotFound(operation.to.owner)
  const insertion = resolveInsertionIndex(target, operation.to.position)
  if (!insertion.ok)
    return insertion.result
  target.splice(insertion.index, 0, operation.bundle.entryId)
  for (const [containerId, container] of Object.entries(operation.bundle.containers)) {
    structure.containers[containerId] = {
      regions: Object.fromEntries(
        Object.entries(container.regions).map(([regionId, children]) => [regionId, [...children]]),
      ),
    }
  }
  return commitCandidate({
    ...document.schema,
    nodes: [...document.schema.nodes, ...operation.bundle.nodes],
    structure,
  }, definitions)
}
