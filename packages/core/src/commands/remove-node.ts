import type { CommandContext, RemoveNodePayload } from '../types'
import { removeNodeFromTree } from '../helpers'
import { createLayoutPlan, getSortScopeEntries, resolveNodeLayout } from '../layout'
import { getLockedIndices, isRemoveAllowed } from '../sortable'

export function removeNodeHandler(ctx: CommandContext, payload: RemoveNodePayload): void {
  const { store, registry } = ctx
  const rawSchema = store.getRawSchema()

  if (payload.nodeId === rawSchema.root.id) {
    console.warn('[dragcraft/core] REMOVE_NODE: cannot remove root node')
    return
  }

  // ── Sortable constraint ──
  const children = rawSchema.root.children
  if (children) {
    const node = children.find(c => c.id === payload.nodeId)
    const layout = node ? resolveNodeLayout(node, registry) : null
    if (node && layout && layout.sortScope !== false) {
      const scopeEntries = getSortScopeEntries(createLayoutPlan(rawSchema, registry), layout.sortScope)
      const removeIndex = scopeEntries.findIndex(entry => entry.node.id === payload.nodeId)
      if (removeIndex !== -1) {
        const lockedIndices = getLockedIndices(children, registry, rawSchema, layout.sortScope)
        if (lockedIndices.size > 0 && !isRemoveAllowed(removeIndex, lockedIndices)) {
          console.warn(
            `[dragcraft/core] REMOVE_NODE: blocked by sortable constraint`
            + ` (removing index ${removeIndex} would shift locked widgets)`,
          )
          return
        }
      }
    }
  }

  const removed = removeNodeFromTree(rawSchema.root, payload.nodeId)

  if (!removed) {
    console.warn(`[dragcraft/core] REMOVE_NODE: node "${payload.nodeId}" not found`)
    return
  }

  if (store.selectedNodeId.value === payload.nodeId) {
    store.selectNode(null)
  }
}
