import type { CommandContext, CommandResult, UpdatePropsPayload } from '../types'
import { findNodeById } from '../helpers'
import { mergeRecord } from '../merge-record'

export function updatePropsHandler(ctx: CommandContext, payload: UpdatePropsPayload): CommandResult {
  const { store } = ctx
  const rawSchema = store.getRawSchema()
  const node = findNodeById(rawSchema.root, payload.nodeId)

  if (!node) {
    console.warn(`[dragcraft/core] UPDATE_PROPS: node "${payload.nodeId}" not found`)
    return false
  }

  mergeRecord(node.props, payload.props)

  if (payload.style) {
    if (!node.style)
      node.style = {}
    mergeRecord(node.style as Record<string, unknown>, payload.style as Record<string, unknown>)
  }
}
