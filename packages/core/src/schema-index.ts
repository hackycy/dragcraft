import type {
  DesignerSchema,
  IndexedNodeLocation,
  SchemaDiagnostic,
  SchemaIndexResult,
  SchemaNode,
} from './types'

export function buildSchemaIndex(schema: DesignerSchema): SchemaIndexResult {
  const index = new Map<string, IndexedNodeLocation>()
  const diagnostics: SchemaDiagnostic[] = []

  const add = (node: SchemaNode, location: Omit<IndexedNodeLocation, 'node'>) => {
    if (index.has(node.id)) {
      diagnostics.push({
        code: 'SCHEMA_NODE_ID_DUPLICATE',
        severity: 'error',
        nodeId: node.id,
      })
    }
    else {
      index.set(node.id, { node, ...location })
    }
  }

  for (const [rootIndex, node] of (schema.root.children ?? []).entries()) {
    add(node, { owner: 'root', index: rootIndex, depth: 1 })
    for (const [regionId, children] of Object.entries(node.container?.regions ?? {})) {
      for (const [childIndex, child] of children.entries()) {
        add(child, {
          owner: node.id,
          regionId,
          index: childIndex,
          depth: 2,
        })
        if (child.container) {
          diagnostics.push({
            code: 'SCHEMA_CONTAINER_NESTED',
            severity: 'error',
            nodeId: child.id,
            ownerId: node.id,
            regionId,
          })
        }
      }
    }
  }

  return { index, diagnostics }
}

export function findIndexedNode(
  result: SchemaIndexResult,
  nodeId: string,
): IndexedNodeLocation | undefined {
  return result.index.get(nodeId)
}
