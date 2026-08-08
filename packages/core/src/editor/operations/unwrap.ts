import type { SchemaDefinitionSnapshot } from '../../definitions/types'
import type { ResolvedDocument } from '../../resolver/resolved-document'
import type { SchemaEditResult } from '../apply-schema-operation'
import type { UnwrapOperation } from '../schema-operation'
import { cloneStructure, commitCandidate, nodeNotFound } from './shared'

export function applyUnwrap(
  document: ResolvedDocument,
  operation: UnwrapOperation,
  definitions: SchemaDefinitionSnapshot,
): SchemaEditResult {
  const owner = document.nodesById.get(operation.containerId)
  const location = document.locationsById.get(operation.containerId)
  const structure = cloneStructure(document.schema.structure)
  const container = structure.containers[operation.containerId]
  if (!owner || !location || location.kind !== 'page-root' || !container)
    return nodeNotFound(operation.containerId)
  const declaration = definitions.types.get(owner.node.type)?.container
  if (!declaration)
    return { status: 'rejected', code: 'SCHEMA_INVALID' }

  const promotedNodeIds = declaration.regions.flatMap(region => container.regions[region.id] ?? [])
  structure.root.splice(location.index, 1, ...promotedNodeIds)
  delete structure.containers[operation.containerId]
  return commitCandidate({
    ...document.schema,
    nodes: document.schema.nodes.filter(node => node.id !== operation.containerId),
    structure,
  }, definitions)
}
