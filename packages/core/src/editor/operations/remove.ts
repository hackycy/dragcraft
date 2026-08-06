import type { SchemaDefinitionSnapshot } from '../../definitions/types'
import type { ResolvedDocument } from '../../resolver/resolved-document'
import type { SchemaEditResult } from '../apply-schema-operation'
import type { RemoveOperation } from '../schema-operation'
import { cloneStructure, commitCandidate, getOwnerSequence, nodeNotFound, ownerForNode } from './shared'

export function applyRemove(
  document: ResolvedDocument,
  operation: RemoveOperation,
  definitions: SchemaDefinitionSnapshot,
): SchemaEditResult {
  const sourceOwner = ownerForNode(document, operation.nodeId)
  if (!sourceOwner)
    return nodeNotFound(operation.nodeId)
  const structure = cloneStructure(document.schema.structure)
  const ownedContainer = structure.containers[operation.nodeId]
  const removedNodeIds = ownedContainer
    ? new Set([operation.nodeId, ...Object.values(ownedContainer.regions).flat()])
    : new Set([operation.nodeId])

  const source = getOwnerSequence(structure, sourceOwner)
  if (!source)
    return { status: 'rejected', code: 'SCHEMA_INVALID' }
  const sourceIndex = source.indexOf(operation.nodeId)
  if (sourceIndex < 0)
    return nodeNotFound(operation.nodeId)
  source.splice(sourceIndex, 1)
  if (ownedContainer)
    delete structure.containers[operation.nodeId]

  return commitCandidate({
    ...document.schema,
    nodes: document.schema.nodes.filter(node => !removedNodeIds.has(node.id)),
    structure,
  }, definitions)
}
