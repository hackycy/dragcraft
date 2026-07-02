import type { DesignerSchema, LayoutNodeEntry, RegistryInstance, SchemaNode } from './types'
import { resolveBehavior } from './behavior'
import { createLayoutPlan, DEFAULT_SORT_SCOPE, getSortScopeEntries } from './layout'

/**
 * Collect the indices of all widgets whose `sortable` behavior resolves to false.
 * These widgets must stay at their current array index (absolute index locking).
 *
 * @param _children - The flat widget list (`root.children`)
 * @param registry - Widget meta registry for resolving behavior predicates
 * @param schema   - Current designer schema (for predicate evaluation context)
 * @param sortScope - Sort scope to evaluate
 */
export function getLockedIndices(
  _children: SchemaNode[],
  registry: RegistryInstance,
  schema: DesignerSchema,
  sortScope = DEFAULT_SORT_SCOPE,
): Set<number> {
  return getLockedIndicesFromEntries(
    getSortScopeEntries(createLayoutPlan(schema, registry), sortScope),
    registry,
    schema,
  )
}

export function getLockedIndicesFromEntries(
  scopeEntries: LayoutNodeEntry[],
  registry: RegistryInstance,
  schema: DesignerSchema,
): Set<number> {
  const locked = new Set<number>()

  for (let i = 0; i < scopeEntries.length; i++) {
    const node = scopeEntries[i].node
    const meta = registry.getWidget(node.type)
    if (!meta)
      continue
    const isSortable = resolveBehavior(
      meta.sortable,
      { node, schema },
    )
    if (!isSortable) {
      locked.add(i)
    }
  }
  return locked
}

/**
 * Can a new node be inserted at `insertIndex` without shifting any locked widget?
 *
 * Inserting at index `i` shifts all widgets at index >= `i` rightward by 1.
 * If any locked widget has index >= `insertIndex`, it would be displaced.
 */
export function isInsertAllowed(
  insertIndex: number,
  lockedIndices: Set<number>,
): boolean {
  for (const L of lockedIndices) {
    if (L >= insertIndex)
      return false
  }
  return true
}

/**
 * Can a node be moved from `srcIdx` to `targetIdx` (post-removal insertion index)
 * without altering any locked widget's absolute position?
 *
 * Mathematical analysis for each locked widget at index L (L !== srcIdx):
 * - srcIdx < L: Removal shifts L to L-1. Insertion must be at targetIdx <= L-1 to restore it.
 * - srcIdx > L: L is unaffected by removal. Insertion must satisfy targetIdx > L to keep it at L.
 */
export function isMoveAllowed(
  srcIdx: number,
  targetIdx: number,
  lockedIndices: Set<number>,
): boolean {
  // Cannot move a locked widget itself
  if (lockedIndices.has(srcIdx))
    return false

  for (const L of lockedIndices) {
    if (L === srcIdx)
      continue
    if (srcIdx < L) {
      if (targetIdx > L - 1)
        return false
    }
    else {
      // srcIdx > L
      if (targetIdx <= L)
        return false
    }
  }
  return true
}

/**
 * Can a node at `removeIndex` be removed without shifting any locked widget?
 *
 * Removing at index `i` shifts all widgets at index > `i` leftward by 1.
 * If any locked widget has index > `removeIndex`, it would be displaced.
 */
export function isRemoveAllowed(
  removeIndex: number,
  lockedIndices: Set<number>,
): boolean {
  for (const L of lockedIndices) {
    if (L > removeIndex)
      return false
  }
  return true
}

/**
 * Compute the set of valid visual drop indices (0..children.length) for a drag operation.
 *
 * For new-widget drops (sourceNodeId === null): checks isInsertAllowed for each position.
 * For existing-widget moves: converts visual gap index to post-removal target index
 * and checks isMoveAllowed.
 *
 * @param children     - The flat widget list
 * @param lockedIndices - Pre-computed locked indices from getLockedIndices()
 * @param sourceNodeId  - ID of the dragged widget (null if dragging from material panel)
 */
export function getValidDropIndices(
  children: SchemaNode[] | LayoutNodeEntry[],
  lockedIndices: Set<number>,
  sourceNodeId: string | null,
): Set<number> {
  const valid = new Set<number>()
  const n = children.length

  // Fast path: no locked widgets → all positions valid
  if (lockedIndices.size === 0) {
    for (let i = 0; i <= n; i++)
      valid.add(i)
    return valid
  }

  if (sourceNodeId === null) {
    // Adding new widget: visual index equals insert index
    for (let i = 0; i <= n; i++) {
      if (isInsertAllowed(i, lockedIndices))
        valid.add(i)
    }
  }
  else {
    const srcIdx = children.findIndex(c =>
      'node' in c ? c.node.id === sourceNodeId : c.id === sourceNodeId,
    )
    if (srcIdx === -1)
      return valid

    for (let visualIdx = 0; visualIdx <= n; visualIdx++) {
      // Convert visual gap index to post-removal target index
      // (same logic as DcCanvas.handleDrop)
      let targetIdx = visualIdx
      if (targetIdx > srcIdx)
        targetIdx = targetIdx - 1

      // Same position is always valid (no-op)
      if (targetIdx === srcIdx) {
        valid.add(visualIdx)
        continue
      }

      if (isMoveAllowed(srcIdx, targetIdx, lockedIndices))
        valid.add(visualIdx)
    }
  }

  return valid
}

/**
 * Given a raw visual index and a set of valid indices, find the nearest valid one.
 * Returns null if no valid index exists.
 */
export function findNearestValidIndex(
  rawIndex: number,
  validIndices: Set<number>,
): number | null {
  if (validIndices.size === 0)
    return null
  if (validIndices.has(rawIndex))
    return rawIndex

  let best: number | null = null
  let bestDist = Infinity
  for (const v of validIndices) {
    const dist = Math.abs(v - rawIndex)
    if (dist < bestDist) {
      bestDist = dist
      best = v
    }
  }
  return best
}
