import type { CommandContext, MoveNodePayload } from '../types'

export function moveNodeHandler(ctx: CommandContext, payload: MoveNodePayload): void {
  const { store } = ctx
  const rawSchema = store.getRawSchema()
  const children = rawSchema.root.children

  if (!children)
    return

  const currentIndex = children.findIndex(c => c.id === payload.nodeId)
  if (currentIndex === -1) {
    console.warn(`[dragcraft/core] MOVE_NODE: node "${payload.nodeId}" not found`)
    return
  }

  // Remove from current position
  const [node] = children.splice(currentIndex, 1)

  // Insert at target position (adjust for removal)
  const targetIndex = Math.min(payload.index, children.length)
  children.splice(targetIndex, 0, node)
}
