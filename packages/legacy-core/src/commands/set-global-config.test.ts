import type { CommandContext, DesignerSchema } from '../types'
import { describe, expect, it } from 'vitest'
import { createRegistry } from '../registry'
import { createSchemaStore } from '../schema-store'
import { setGlobalConfigHandler } from './set-global-config'

function makeSchema(globalConfig: Record<string, unknown> = {}): DesignerSchema {
  return { version: '1.0.0', globalConfig, root: { id: 'root', type: 'root', props: {}, children: [] } }
}

function setup(globalConfig?: Record<string, unknown>) {
  const store = createSchemaStore(makeSchema(globalConfig))
  const registry = createRegistry()
  const ctx: CommandContext = { schema: store.getSnapshot(), draft: store.getSchema(), store, registry }
  return { store, ctx }
}

describe('setGlobalConfigHandler', () => {
  it('merges config into globalConfig', () => {
    const { ctx } = setup({ theme: 'light' })
    setGlobalConfigHandler(ctx, { config: { fontSize: 14 } })
    expect(ctx.draft.globalConfig).toEqual({ theme: 'light', fontSize: 14 })
  })

  it('overwrites existing keys', () => {
    const { ctx } = setup({ theme: 'light' })
    setGlobalConfigHandler(ctx, { config: { theme: 'dark' } })
    expect(ctx.draft.globalConfig.theme).toBe('dark')
  })

  it('works with empty initial config', () => {
    const { ctx } = setup()
    setGlobalConfigHandler(ctx, { config: { lang: 'zh-CN' } })
    expect(ctx.draft.globalConfig).toEqual({ lang: 'zh-CN' })
  })

  it('deep merges nested config objects', () => {
    const { ctx } = setup({ theme: { mode: 'light', tokens: { radius: 4 } } })
    setGlobalConfigHandler(ctx, { config: { theme: { tokens: { color: '#1677ff' } } } })
    expect(ctx.draft.globalConfig).toEqual({
      theme: { mode: 'light', tokens: { radius: 4, color: '#1677ff' } },
    })
  })
})
