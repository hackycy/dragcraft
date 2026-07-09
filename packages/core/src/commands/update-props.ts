import type { CommandContext, CommandResult, UpdatePropsPayload } from '../types'
import { findNodeById } from '../helpers'

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeRecord(target: Record<string, unknown>, patch: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(patch)) {
    const current = target[key]
    if (isPlainRecord(current) && isPlainRecord(value)) {
      mergeRecord(current, value)
    }
    else {
      target[key] = value
    }
  }
}

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
