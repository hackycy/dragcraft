import type { CommandContext, CommandResult, MoveNodePayload } from '../types'
import { createLayoutPlan, getSortableArrayIndexForInsert, getSortScopeEntries, resolveNodeLayout } from '../layout'
import { getLockedIndicesFromEntries, isMoveAllowed } from '../sortable'

export function moveNodeHandler(ctx: CommandContext, payload: MoveNodePayload): CommandResult {
  const { store, registry } = ctx
  const rawSchema = store.getRawSchema()
  const children = rawSchema.root.children

  if (!children)
    return false

  const currentIndex = children.findIndex(c => c.id === payload.nodeId)
  if (currentIndex === -1) {
    console.warn(`[dragcraft/core] MOVE_NODE: node "${payload.nodeId}" not found`)
    return false
  }

  // ── Sortable constraint ──
  const sourceLayout = resolveNodeLayout(children[currentIndex], registry)
  if (sourceLayout.sortScope === false) {
    console.warn(`[dragcraft/core] MOVE_NODE: node "${payload.nodeId}" is outside sortable scopes`)
    return false
  }

  const sortScope = payload.sortScope ?? sourceLayout.sortScope
  const plan = createLayoutPlan(rawSchema, registry)
  const scopeEntries = getSortScopeEntries(plan, sortScope)
  const sourceScopeIndex = scopeEntries.findIndex(entry => entry.node.id === payload.nodeId)
  if (sourceScopeIndex === -1) {
    console.warn(`[dragcraft/core] MOVE_NODE: node "${payload.nodeId}" not found in sort scope "${sortScope}"`)
    return false
  }

  const targetScopeIndex = Math.min(payload.index, scopeEntries.length - 1)
  if (targetScopeIndex === sourceScopeIndex)
    return false

  const lockedIndices = getLockedIndicesFromEntries(scopeEntries, registry, rawSchema)
  if (lockedIndices.size > 0 && !isMoveAllowed(sourceScopeIndex, targetScopeIndex, lockedIndices)) {
    console.warn(
      `[dragcraft/core] MOVE_NODE: blocked by sortable constraint`
      + ` (src=${sourceScopeIndex}, target=${targetScopeIndex})`,
    )
    return false
  }

  // Remove from current position, then insert at target
  const [node] = children.splice(currentIndex, 1)
  const schemaAfterRemoval = rawSchema
  const planAfterRemoval = createLayoutPlan(schemaAfterRemoval, registry)
  const scopeEntriesAfterRemoval = getSortScopeEntries(planAfterRemoval, sortScope)
  const arrayIndex = getSortableArrayIndexForInsert(scopeEntriesAfterRemoval, children, payload.index)
  children.splice(arrayIndex, 0, node)
}
