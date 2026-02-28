import type { AddNodePayload, CommandContext } from '../types'
import { insertNodeIntoTree } from '../helpers'
import { getLockedIndices, isInsertAllowed } from '../sortable'

export function addNodeHandler(ctx: CommandContext, payload: AddNodePayload): void {
  const { store, registry } = ctx
  const rawSchema = store.getRawSchema()

  // ── Sortable constraint ──
  if (payload.index !== undefined) {
    const children = rawSchema.root.children ?? []
    const lockedIndices = getLockedIndices(children, registry, rawSchema)
    if (lockedIndices.size > 0 && !isInsertAllowed(payload.index, lockedIndices)) {
      console.warn(
        `[dragcraft/core] ADD_NODE: blocked by sortable constraint at index ${payload.index}`,
      )
      return
    }
  }

  insertNodeIntoTree(rawSchema.root, payload.node, payload.index)
}
