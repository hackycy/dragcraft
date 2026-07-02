import type { AddNodePayload, CommandContext } from '../types'
import { insertNodeIntoTree } from '../helpers'
import { createLayoutPlan, DEFAULT_SORT_SCOPE, getSortableArrayIndexForInsert, getSortScopeEntries, resolveNodeLayout } from '../layout'
import { getLockedIndicesFromEntries, isInsertAllowed } from '../sortable'

export function addNodeHandler(ctx: CommandContext, payload: AddNodePayload): void {
  const { store, registry } = ctx
  const rawSchema = store.getRawSchema()
  const children = rawSchema.root.children ?? []
  const nodeLayout = resolveNodeLayout(payload.node, registry)
  const sortScope = payload.sortScope ?? (nodeLayout.sortScope === false ? undefined : nodeLayout.sortScope)
  const scope = sortScope ?? DEFAULT_SORT_SCOPE
  let arrayIndex = nodeLayout.sortScope === false && !payload.sortScope
    ? undefined
    : payload.index

  // ── Sortable constraint ──
  if (arrayIndex !== undefined) {
    const plan = createLayoutPlan(rawSchema, registry)
    const scopeEntries = getSortScopeEntries(plan, scope)
    const lockedIndices = getLockedIndicesFromEntries(scopeEntries, registry, rawSchema)
    if (lockedIndices.size > 0 && !isInsertAllowed(arrayIndex, lockedIndices)) {
      console.warn(
        `[dragcraft/core] ADD_NODE: blocked by sortable constraint at index ${arrayIndex}`,
      )
      return
    }
    arrayIndex = getSortableArrayIndexForInsert(scopeEntries, children, arrayIndex)
  }

  insertNodeIntoTree(rawSchema.root, payload.node, arrayIndex)
}
