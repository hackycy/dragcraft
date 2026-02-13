import type { CommandContext, UpdatePropsPayload } from '../types'
import { findNodeById } from '../helpers'

export function updatePropsHandler(ctx: CommandContext, payload: UpdatePropsPayload): void {
  const { store } = ctx
  const rawSchema = store.getRawSchema()
  const node = findNodeById(rawSchema.root, payload.nodeId)

  if (!node) {
    console.warn(`[dragcraft/core] UPDATE_PROPS: node "${payload.nodeId}" not found`)
    return
  }

  Object.assign(node.props, payload.props)

  if (payload.style) {
    if (!node.style)
      node.style = {}
    Object.assign(node.style, payload.style)
  }
}
