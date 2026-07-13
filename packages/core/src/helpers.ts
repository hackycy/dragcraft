import type { DesignerSchema, SchemaNode } from './types'
import { buildSchemaIndex } from './schema-index'

/**
 * Find a node by ID in the shallow ownership structure.
 */
export function findNodeById(
  root: SchemaNode,
  id: string,
): SchemaNode | null {
  if (root.id === id)
    return root
  const schema: DesignerSchema = { version: '', globalConfig: {}, root }
  return buildSchemaIndex(schema).index.get(id)?.node ?? null
}

/**
 * Find the parent node of a given node ID.
 * Returns the owning root or container location, or null if not found.
 */
export function findParentNode(
  root: SchemaNode,
  targetId: string,
): { parent: SchemaNode, regionId?: string, index: number } | null {
  const schema: DesignerSchema = { version: '', globalConfig: {}, root }
  const indexed = buildSchemaIndex(schema)
  const location = indexed.index.get(targetId)
  if (!location)
    return null
  if (location.owner === 'root')
    return { parent: root, index: location.index }
  const parent = indexed.index.get(location.owner)?.node
  return parent && location.regionId
    ? { parent, regionId: location.regionId, index: location.index }
    : null
}

/**
 * Remove a node from the tree by ID.
 * Returns the removed node or null if not found.
 */
export function removeNodeFromTree(
  root: SchemaNode,
  nodeId: string,
): SchemaNode | null {
  const result = findParentNode(root, nodeId)
  if (!result || result.regionId)
    return null
  const { parent, index } = result
  return parent.children!.splice(index, 1)[0]
}

/**
 * Insert a node into a parent's children array at a given index.
 * If index is undefined, appends to the end.
 */
export function insertNodeIntoTree(
  parent: SchemaNode,
  node: SchemaNode,
  index?: number,
): void {
  if (!parent.children) {
    parent.children = []
  }
  if (index !== undefined && index >= 0 && index <= parent.children.length) {
    parent.children.splice(index, 0, node)
  }
  else {
    parent.children.push(node)
  }
}

/**
 * Walk root and its direct children (one level), calling visitor for each node.
 * If visitor returns false, stop traversal.
 *
 * Note: This does NOT recurse into grandchildren — the schema is a flat
 * two-level structure (root → widgets).
 */
export function walkFlatChildren(
  root: SchemaNode,
  visitor: (node: SchemaNode) => boolean | void,
): void {
  if (visitor(root) === false)
    return
  if (root.children) {
    for (const child of root.children) {
      if (visitor(child) === false)
        return
    }
  }
}
