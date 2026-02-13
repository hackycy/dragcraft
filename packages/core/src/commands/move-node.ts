import type { CommandContext, MoveNodePayload } from '../types'
import { findNodeById, insertNodeIntoTree, removeNodeFromTree } from '../helpers'

export function moveNodeHandler(ctx: CommandContext, payload: MoveNodePayload): void {
  const { store } = ctx
  const rawSchema = store.getRawSchema()

  const targetParent = findNodeById(rawSchema.root, payload.targetParentId)
  if (!targetParent) {
    console.warn(`[dragcraft/core] MOVE_NODE: target parent "${payload.targetParentId}" not found`)
    return
  }
  if (targetParent.nodeType !== 'container') {
    console.warn(`[dragcraft/core] MOVE_NODE: target parent "${payload.targetParentId}" is not a container`)
    return
  }

  const removed = removeNodeFromTree(rawSchema.root, payload.nodeId)
  if (!removed) {
    console.warn(`[dragcraft/core] MOVE_NODE: node "${payload.nodeId}" not found`)
    return
  }

  insertNodeIntoTree(targetParent, removed, payload.index)
}
