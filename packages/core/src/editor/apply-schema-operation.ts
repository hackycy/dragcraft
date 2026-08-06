import type { SchemaDefinitionSnapshot } from '../definitions/types'
import type { JsonObject } from '../document/types'
import type { SchemaDiagnostic } from '../resolver/diagnostics'
import type { ResolvedDocument } from '../resolver/resolved-document'
import type { OperationBatch, SchemaOperation } from './schema-operation'
import { applyInsertBundle } from './operations/insert-bundle'
import { applyMove } from './operations/move'
import { applyRemove } from './operations/remove'
import { applyUnwrap } from './operations/unwrap'
import {
  applyUpdateGlobalConfig,
  applyUpdateNode,
  applyUpdatePage,
} from './operations/update'

export type SchemaEditErrorCode
  = | 'BATCH_NESTED'
    | 'BUNDLE_INVALID'
    | 'DESTINATION_ANCHOR_NOT_FOUND'
    | 'DESTINATION_OWNER_NOT_FOUND'
    | 'NODE_NOT_FOUND'
    | 'SCHEMA_INVALID'

export type SchemaEditResult
  = | {
    readonly status: 'rejected'
    readonly code: SchemaEditErrorCode
    readonly diagnostics?: readonly SchemaDiagnostic[]
    readonly details?: JsonObject
  }
  | { readonly status: 'unchanged', readonly document: ResolvedDocument }
  | { readonly status: 'committed', readonly document: ResolvedDocument }

export function applySchemaOperation(
  document: ResolvedDocument,
  request: SchemaOperation | OperationBatch,
  definitions: SchemaDefinitionSnapshot,
): SchemaEditResult {
  if (request.type === 'batch') {
    if (request.operations.some(operation => (operation as { readonly type: string }).type === 'batch'))
      return { status: 'rejected', code: 'BATCH_NESTED' }
    let workingDocument = document
    for (const operation of request.operations) {
      const result = applySchemaOperation(workingDocument, operation, definitions)
      if (result.status === 'rejected')
        return result
      workingDocument = result.document
    }
    return workingDocument === document
      ? { status: 'unchanged', document }
      : { status: 'committed', document: workingDocument }
  }

  switch (request.type) {
    case 'insert-bundle':
      return applyInsertBundle(document, request, definitions)
    case 'move':
      return applyMove(document, request, definitions)
    case 'remove':
      return applyRemove(document, request, definitions)
    case 'unwrap':
      return applyUnwrap(document, request, definitions)
    case 'update-node':
      return applyUpdateNode(document, request, definitions)
    case 'update-page':
      return applyUpdatePage(document, request, definitions)
    case 'update-global-config':
      return applyUpdateGlobalConfig(document, request, definitions)
  }
}
