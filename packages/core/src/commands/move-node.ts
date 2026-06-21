import type { CommandContext, MoveNodePayload } from '../types'
import { getLockedIndices, isMoveAllowed } from '../sortable'

export function moveNodeHandler(ctx: CommandContext, payload: MoveNodePayload): void {
  const { store, registry } = ctx
  const rawSchema = store.getRawSchema()
  const children = rawSchema.root.children

  if (!children)
    return

  const currentIndex = children.findIndex(c => c.id === payload.nodeId)
  if (currentIndex === -1) {
    console.warn(`[dragcraft/core] MOVE_NODE: node "${payload.nodeId}" not found`)
    return
  }

  // ── Sortable constraint ──
  // payload.index is a post-removal insertion index.
  // Convert to the index that will actually be used after splice.
  const targetIndex = Math.min(payload.index, children.length - 1)
  const lockedIndices = getLockedIndices(children, registry, rawSchema)
  if (lockedIndices.size > 0 && !isMoveAllowed(currentIndex, targetIndex, lockedIndices)) {
    console.warn(
      `[dragcraft/core] MOVE_NODE: blocked by sortable constraint`
      + ` (src=${currentIndex}, target=${targetIndex})`,
    )
    return
  }

  // Remove from current position, then insert at target
  const [node] = children.splice(currentIndex, 1)
  children.splice(targetIndex, 0, node)
}
