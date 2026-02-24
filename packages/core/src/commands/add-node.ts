import type { AddNodePayload, CommandContext } from '../types'
import { insertNodeIntoTree } from '../helpers'

export function addNodeHandler(ctx: CommandContext, payload: AddNodePayload): void {
  const { store } = ctx
  const rawSchema = store.getRawSchema()

  insertNodeIntoTree(rawSchema.root, payload.node, payload.index)
}
