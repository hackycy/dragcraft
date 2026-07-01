import type { WidgetMeta } from './types'
import { describe, expect, it, vi } from 'vitest'
import { createRegistry } from './registry'

function makeMeta(type: string, overrides?: Partial<WidgetMeta>): WidgetMeta {
  return {
    type,
    title: type,
    group: 'basic',
    defaultProps: {},
    formSchema: { sections: [] },
    ...overrides,
  } as WidgetMeta
}

describe('createRegistry', () => {
  it('registers and retrieves a widget', () => {
    const reg = createRegistry()
    const meta = makeMeta('button')
    reg.registerWidget(meta)
    expect(reg.getWidget('button')).toBe(meta)
  })

  it('returns undefined for unregistered type', () => {
    const reg = createRegistry()
    expect(reg.getWidget('missing')).toBeUndefined()
  })

  it('warns on duplicate registration', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const reg = createRegistry()
    reg.registerWidget(makeMeta('button'))
    reg.registerWidget(makeMeta('button'))
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('already registered'),
    )
    warn.mockRestore()
  })

  it('getAllWidgets returns all registered', () => {
    const reg = createRegistry()
    reg.registerWidget(makeMeta('a'))
    reg.registerWidget(makeMeta('b'))
    const all = reg.getAllWidgets()
    expect(all).toHaveLength(2)
    expect(all.map(w => w.type)).toEqual(expect.arrayContaining(['a', 'b']))
  })

  it('registers and retrieves global config schema', () => {
    const reg = createRegistry()
    expect(reg.getGlobalConfigSchema()).toBeUndefined()
    const schema = { sections: [] }
    reg.registerGlobalConfigSchema(schema)
    expect(reg.getGlobalConfigSchema()).toBe(schema)
  })
})
