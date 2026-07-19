import type { CommandContext, CommandResult, UpdatePropsPayload } from '../types'
import { findNodeById } from '../helpers'
import { mergeRecord } from '../merge-record'

export function updatePropsHandler(ctx: CommandContext, payload: UpdatePropsPayload): CommandResult {
  const rawSchema = ctx.draft
  const node = findNodeById(rawSchema.root, payload.nodeId)

  if (!node) {
    console.warn(`[dragcraft/core] UPDATE_PROPS: node "${payload.nodeId}" not found`)
    return false
  }

  let changed = mergeRecord(node.props, payload.props)

  if (payload.style) {
    const style = node.style ?? {}
    const styleChanged = mergeRecord(style as Record<string, unknown>, payload.style as Record<string, unknown>)
    if (!node.style && styleChanged)
      node.style = style
    changed = styleChanged || changed
  }
  return { ok: true, changed }
}
