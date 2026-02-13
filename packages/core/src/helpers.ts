import type { SchemaNode } from './types'

/**
 * Depth-first search to find a node by ID.
 */
export function findNodeById(
  root: SchemaNode,
  id: string,
): SchemaNode | null {
  if (root.id === id)
    return root
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id)
      if (found)
        return found
    }
  }
  return null
}

/**
 * Find the parent node of a given node ID.
 * Returns { parent, index } or null if node is root or not found.
 */
export function findParentNode(
  root: SchemaNode,
  targetId: string,
): { parent: SchemaNode, index: number } | null {
  if (root.children) {
    for (let i = 0; i < root.children.length; i++) {
      if (root.children[i].id === targetId) {
        return { parent: root, index: i }
      }
      const found = findParentNode(root.children[i], targetId)
      if (found)
        return found
    }
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
 * Walk the entire tree, calling visitor for each node.
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
      walkTree(child, visitor)
    }
  }
}
