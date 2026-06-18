import type { SchemaNode } from './types'

/**
 * Find a node by ID in the flat structure.
 * Only searches root and root.children (one level deep).
 */
export function findNodeById(
  root: SchemaNode,
  id: string,
): SchemaNode | null {
  if (root.id === id)
    return root
  if (root.children) {
    for (const child of root.children) {
      if (child.id === id)
        return child
    }
  }
  return null
}

/**
 * Find the parent node of a given node ID.
 * In the flat model, the parent is always root.
 * Returns { parent, index } or null if node is root or not found.
 */
export function findParentNode(
  root: SchemaNode,
  targetId: string,
): { parent: SchemaNode, index: number } | null {
  if (root.children) {
    const index = root.children.findIndex(c => c.id === targetId)
    if (index >= 0)
      return { parent: root, index }
  }
  return null
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
  if (!result)
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
 * Walk the flat widget list, calling visitor for each node.
 * If visitor returns false, stop traversal.
 */
export function walkTree(
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
