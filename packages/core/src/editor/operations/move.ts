import type { SchemaDefinitionSnapshot } from '../../definitions/types'
import type { ResolvedDocument } from '../../resolver/resolved-document'
import type { SchemaEditResult } from '../apply-schema-operation'
import type { MoveOperation } from '../schema-operation'
import {
  cloneStructure,
  commitCandidate,
  destinationOwnerNotFound,
  getOwnerSequence,
  jsonValuesEqual,
  nodeNotFound,
  ownerForNode,
  ownerRefsEqual,
  resolveInsertionIndex,
} from './shared'

export function applyMove(
  document: ResolvedDocument,
  operation: MoveOperation,
  definitions: SchemaDefinitionSnapshot,
): SchemaEditResult {
  const sourceOwner = ownerForNode(document, operation.nodeId)
  if (!sourceOwner)
    return nodeNotFound(operation.nodeId)
  if ((operation.to.position.kind === 'before' || operation.to.position.kind === 'after')
    && operation.to.position.nodeId === operation.nodeId
    && ownerRefsEqual(sourceOwner, operation.to.owner)) {
    return { status: 'unchanged', document }
  }

  const structure = cloneStructure(document.schema.structure)
  const source = getOwnerSequence(structure, sourceOwner)
  if (!source)
    return { status: 'rejected', code: 'SCHEMA_INVALID' }
  const sourceIndex = source.indexOf(operation.nodeId)
  if (sourceIndex < 0)
    return nodeNotFound(operation.nodeId)
  source.splice(sourceIndex, 1)

  const target = getOwnerSequence(structure, operation.to.owner)
  if (!target)
    return destinationOwnerNotFound(operation.to.owner)
  const insertion = resolveInsertionIndex(target, operation.to.position)
  if (!insertion.ok)
    return insertion.result
  target.splice(insertion.index, 0, operation.nodeId)
  if (jsonValuesEqual(structure, document.schema.structure))
    return { status: 'unchanged', document }
  return commitCandidate({ ...document.schema, structure }, definitions)
}
