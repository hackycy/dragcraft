import type { CommandContext, SetGlobalConfigPayload } from '../types'

export function setGlobalConfigHandler(
  ctx: CommandContext,
  payload: SetGlobalConfigPayload,
): void {
  const { store } = ctx
  const rawSchema = store.getRawSchema()

  Object.assign(rawSchema.globalConfig, payload.config)
}
