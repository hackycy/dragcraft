import type { CommandContext, CommandResult, SetGlobalConfigPayload } from '../types'
import { mergeRecord } from '../merge-record'

export function setGlobalConfigHandler(
  ctx: CommandContext,
  payload: SetGlobalConfigPayload,
): CommandResult {
  const changed = mergeRecord(ctx.draft.globalConfig, payload.config)
  return { ok: true, changed }
}
