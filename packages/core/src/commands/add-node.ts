import type { AddNodePayload, CommandContext } from '../types'
import { findNodeById, insertNodeIntoTree } from '../helpers'

export function addNodeHandler(ctx: CommandContext, payload: AddNodePayload): void {
  const { store } = ctx
  const rawSchema = store.getRawSchema()
  const parent = findNodeById(rawSchema.root, payload.parentId)

  if (!parent) {
    console.warn(`[dragcraft/core] ADD_NODE: parent "${payload.parentId}" not found`)
    return
  }

  if (parent.nodeType !== 'container') {
    console.warn(`[dragcraft/core] ADD_NODE: parent "${payload.parentId}" is not a container`)
    return
  }

  insertNodeIntoTree(parent, payload.node, payload.index)
}
