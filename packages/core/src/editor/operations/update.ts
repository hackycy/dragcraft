import type { SchemaDefinitionSnapshot } from '../../definitions/types'
import type { ResolvedDocument } from '../../resolver/resolved-document'
import type { SchemaEditResult } from '../apply-schema-operation'
import type {
  UpdateGlobalConfigOperation,
  UpdateNodeOperation,
  UpdatePageOperation,
} from '../schema-operation'
import { commitCandidate, jsonValuesEqual, nodeNotFound } from './shared'

export function applyUpdateNode(
  document: ResolvedDocument,
  operation: UpdateNodeOperation,
  definitions: SchemaDefinitionSnapshot,
): SchemaEditResult {
  const currentNode = document.nodesById.get(operation.nodeId)?.node
  if (!currentNode)
    return nodeNotFound(operation.nodeId)
  if (jsonValuesEqual(currentNode, { id: operation.nodeId, ...operation.node }))
    return { status: 'unchanged', document }
  return commitCandidate({
    ...document.schema,
    nodes: document.schema.nodes.map(node => node.id === operation.nodeId
      ? { id: operation.nodeId, ...operation.node }
      : node),
  }, definitions)
}

export function applyUpdatePage(
  document: ResolvedDocument,
  operation: UpdatePageOperation,
  definitions: SchemaDefinitionSnapshot,
): SchemaEditResult {
  if (jsonValuesEqual(document.schema.page, operation.page))
    return { status: 'unchanged', document }
  return commitCandidate({ ...document.schema, page: operation.page }, definitions)
}

export function applyUpdateGlobalConfig(
  document: ResolvedDocument,
  operation: UpdateGlobalConfigOperation,
  definitions: SchemaDefinitionSnapshot,
): SchemaEditResult {
  if (jsonValuesEqual(document.schema.globalConfig, operation.globalConfig))
    return { status: 'unchanged', document }
  return commitCandidate({ ...document.schema, globalConfig: operation.globalConfig }, definitions)
}
