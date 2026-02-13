import type { CommandContext, RemoveNodePayload } from '../types'
import { removeNodeFromTree } from '../helpers'

export function removeNodeHandler(ctx: CommandContext, payload: RemoveNodePayload): void {
  const { store } = ctx
  const rawSchema = store.getRawSchema()

  if (payload.nodeId === rawSchema.root.id) {
    console.warn('[dragcraft/core] REMOVE_NODE: cannot remove root node')
    return
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
