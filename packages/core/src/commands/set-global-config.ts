import type { CommandContext, SetGlobalConfigPayload } from '../types'
import { mergeRecord } from '../merge-record'

export function setGlobalConfigHandler(
  ctx: CommandContext,
  payload: SetGlobalConfigPayload,
): void {
  const { store } = ctx
  const rawSchema = store.getRawSchema()

  mergeRecord(rawSchema.globalConfig, payload.config)
}
