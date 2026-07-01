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
  const ctx: CommandContext = { store, registry }
  return { store, ctx }
}

describe('setGlobalConfigHandler', () => {
  it('merges config into globalConfig', () => {
    const { ctx, store } = setup({ theme: 'light' })
    setGlobalConfigHandler(ctx, { config: { fontSize: 14 } })
    expect(store.getRawSchema().globalConfig).toEqual({ theme: 'light', fontSize: 14 })
  })

  it('overwrites existing keys', () => {
    const { ctx, store } = setup({ theme: 'light' })
    setGlobalConfigHandler(ctx, { config: { theme: 'dark' } })
    expect(store.getRawSchema().globalConfig.theme).toBe('dark')
  })

  it('works with empty initial config', () => {
    const { ctx, store } = setup()
    setGlobalConfigHandler(ctx, { config: { lang: 'zh-CN' } })
    expect(store.getRawSchema().globalConfig).toEqual({ lang: 'zh-CN' })
  })
})
