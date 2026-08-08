import type {
  DocumentSchema,
  JsonObject,
  NodeBundle,
  NodeDefinition,
  OperationBatch,
  ResolvedDocument,
  SchemaOperation,
} from '@dragcraft/core'
import type { MaterialCatalog } from '../materials/create-material-catalog'
import type {
  AuthoringEngine,
  AuthoringResult,
  DesignerDocumentState,
  SchemaAuthoringAction,
  SchemaLoadResult,
} from './types'
import { applySchemaOperation, cloneJsonValue, resolveSchema } from '@dragcraft/core'
import { readonly, ref, shallowRef } from 'vue'
import { createSnapshotHistory } from './history'
import { evaluateAuthoringPolicy } from './policy'

export interface CreateAuthoringEngineOptions {
  readonly catalog: MaterialCatalog
  readonly createNodeId: () => string
  readonly maxDiagnostics?: number
  readonly maxHistoryEntries?: number
  readonly schema: unknown
}

function toDocumentState(
  resolution: ReturnType<typeof resolveSchema>,
): DesignerDocumentState {
  if (resolution.status === 'rejected') {
    return Object.freeze({
      status: 'rejected',
      diagnostics: resolution.diagnostics,
    })
  }
  return Object.freeze({
    status: resolution.status,
    diagnostics: resolution.diagnostics,
    schema: resolution.document.schema,
  })
}

function duplicateNodeBundle(
  document: ResolvedDocument,
  nodeId: string,
  createNodeId: () => string,
): NodeBundle | undefined {
  const entry = document.nodesById.get(nodeId)?.node
  if (!entry)
    return undefined
  const sourceStructure = document.schema.structure.containers[nodeId]
  const sourceIds = [
    nodeId,
    ...Object.values(sourceStructure?.regions ?? {}).flat(),
  ]
  const remappedIds = new Map(sourceIds.map(sourceId => [sourceId, createNodeId()]))
  const nodes = sourceIds.flatMap((sourceId): NodeDefinition[] => {
    const source = document.nodesById.get(sourceId)?.node
    const id = remappedIds.get(sourceId)
    if (!source || !id)
      return []
    return [{
      id,
      type: source.type,
      props: cloneJsonValue(source.props as unknown as JsonObject) as unknown as JsonObject,
      ...(source.style
        ? { style: cloneJsonValue(source.style as unknown as JsonObject) as unknown as JsonObject }
        : {}),
    }]
  })
  const entryId = remappedIds.get(nodeId)!

  return {
    entryId,
    nodes,
    containers: sourceStructure
      ? {
          [entryId]: {
            regions: Object.fromEntries(Object.entries(sourceStructure.regions).map(([regionId, childIds]) => {
              return [regionId, childIds.map(childId => remappedIds.get(childId)!)]
            })),
          },
        }
      : {},
  }
}

export function createAuthoringEngine(options: CreateAuthoringEngineOptions): AuthoringEngine {
  const resolverOptions = { maxDiagnostics: options.maxDiagnostics }
  const initial = resolveSchema(options.schema, options.catalog.schemaDefinitions, resolverOptions)
  let currentDocument: ResolvedDocument | null = initial.status === 'rejected'
    ? null
    : initial.document
  const document = shallowRef<DesignerDocumentState>(toDocumentState(initial))
  const snapshotHistory = createSnapshotHistory(
    currentDocument?.schema,
    options.maxHistoryEntries,
  )
  const selectedNodeId = ref<string | null>(null)
  const hoveredNodeId = ref<string | null>(null)

  function installResolution(
    resolution: Exclude<ReturnType<typeof resolveSchema>, { readonly status: 'rejected' }>,
  ): void {
    currentDocument = resolution.document
    if (selectedNodeId.value && !currentDocument.nodesById.has(selectedNodeId.value))
      selectedNodeId.value = null
    if (hoveredNodeId.value && !currentDocument.nodesById.has(hoveredNodeId.value))
      hoveredNodeId.value = null
    document.value = toDocumentState(resolution)
  }

  function installSchema(schema: unknown): void {
    const resolution = resolveSchema(schema, options.catalog.schemaDefinitions, resolverOptions)
    if (resolution.status === 'rejected')
      throw new TypeError('History contains an unresolvable document snapshot')
    installResolution(resolution)
  }

  function importSchema(input: unknown): SchemaLoadResult {
    const resolution = resolveSchema(input, options.catalog.schemaDefinitions, resolverOptions)
    const state = toDocumentState(resolution)
    if (resolution.status === 'rejected')
      return state
    installResolution(resolution)
    snapshotHistory.reset(resolution.document.schema)
    return state
  }

  function exportSchema(): DocumentSchema | null {
    if (!currentDocument)
      return null
    return JSON.parse(JSON.stringify(currentDocument.schema)) as DocumentSchema
  }

  function compileAction(action: SchemaAuthoringAction): SchemaOperation | AuthoringResult {
    if (!currentDocument)
      return { status: 'rejected', code: 'NO_DOCUMENT' }
    switch (action.type) {
      case 'create-node': {
        const bundle = options.catalog.createBundle(action.materialType, options.createNodeId)
        if (!bundle)
          return { status: 'rejected', code: 'MATERIAL_NOT_FOUND' }
        return { type: 'insert-bundle', bundle, to: action.to }
      }
      case 'move-node':
        return { type: 'move', nodeId: action.nodeId, to: action.to }
      case 'duplicate-node': {
        const bundle = duplicateNodeBundle(currentDocument, action.nodeId, options.createNodeId)
        if (!bundle)
          return { status: 'rejected', code: 'NODE_NOT_FOUND' }
        return { type: 'insert-bundle', bundle, to: action.to }
      }
      case 'remove-node':
        return { type: 'remove', nodeId: action.nodeId }
      case 'unwrap-container':
        return { type: 'unwrap', containerId: action.containerId }
      case 'update-node':
        return { type: 'update-node', nodeId: action.nodeId, node: action.node }
      case 'update-global-config':
        return { type: 'update-global-config', globalConfig: action.globalConfig }
      case 'update-page':
        return { type: 'update-page', page: action.page }
    }
  }

  function execute(action: Parameters<AuthoringEngine['execute']>[0]): AuthoringResult {
    if (action.type === 'select-node' || action.type === 'hover-node') {
      if (action.nodeId !== null && !currentDocument?.nodesById.has(action.nodeId))
        return { status: 'rejected', code: 'NODE_NOT_FOUND' }
      const target = action.type === 'select-node' ? selectedNodeId : hoveredNodeId
      if (target.value === action.nodeId)
        return { status: 'unchanged' }
      target.value = action.nodeId
      return { status: 'committed' }
    }

    if (action.type === 'undo' || action.type === 'redo') {
      const schema = action.type === 'undo'
        ? snapshotHistory.undo()
        : snapshotHistory.redo()
      if (!schema)
        return { status: 'unchanged' }
      installSchema(schema)
      return { status: 'committed' }
    }

    if (!currentDocument)
      return { status: 'rejected', code: 'NO_DOCUMENT' }

    let operation: OperationBatch | SchemaOperation
    if (action.type === 'batch') {
      const operations: SchemaOperation[] = []
      for (const childAction of action.actions) {
        const policy = evaluateAuthoringPolicy(options.catalog, currentDocument, childAction)
        if (policy.decision === 'confirmation-required' && childAction.confirmed !== true)
          return { status: 'confirmation-required', code: policy.code }
        if (policy.decision === 'denied')
          return { status: 'rejected', code: policy.code }
        const compiled = compileAction(childAction)
        if ('status' in compiled)
          return compiled
        operations.push(compiled)
      }
      operation = { type: 'batch', operations }
    }
    else {
      const policy = evaluateAuthoringPolicy(options.catalog, currentDocument, action)
      if (policy.decision === 'confirmation-required' && action.confirmed !== true)
        return { status: 'confirmation-required', code: policy.code }
      if (policy.decision === 'denied')
        return { status: 'rejected', code: policy.code }
      const compiled = compileAction(action)
      if ('status' in compiled)
        return compiled
      operation = compiled
    }
    const result = applySchemaOperation(
      currentDocument,
      operation,
      options.catalog.schemaDefinitions,
    )
    if (result.status === 'rejected')
      return { status: 'rejected', code: result.code }
    if (result.status === 'unchanged')
      return { status: 'unchanged' }

    currentDocument = result.document
    snapshotHistory.commit(currentDocument.schema)
    installSchema(currentDocument.schema)
    return { status: 'committed' }
  }

  return Object.freeze({
    document,
    exportSchema,
    history: snapshotHistory.state,
    importSchema,
    selection: Object.freeze({
      hoveredNodeId: readonly(hoveredNodeId),
      selectedNodeId: readonly(selectedNodeId),
    }),
    execute,
  })
}
