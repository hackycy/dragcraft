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

  it('warns and skips when type is empty', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const reg = createRegistry()
    reg.registerWidget(makeMeta(''))
    expect(reg.getWidget('')).toBeUndefined()
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('must have a non-empty "type"'),
    )
    warn.mockRestore()
  })

  it('warns and skips when title is empty', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const reg = createRegistry()
    reg.registerWidget(makeMeta('button', { title: '' }))
    expect(reg.getWidget('button')).toBeUndefined()
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('must have a non-empty "title"'),
    )
    warn.mockRestore()
  })

  it('warns and skips null widget metadata without throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const reg = createRegistry()

    expect(() => reg.registerWidget(null as unknown as WidgetMeta)).not.toThrow()
    expect(reg.getAllWidgets()).toEqual([])
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it('warns once and skips an invalid container definition', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const reg = createRegistry()
    reg.registerWidget(makeMeta('container', {
      container: {
        defaultVariant: 'missing',
        variants: {
          single: {
            title: 'Single',
            regions: [{ id: '__proto__', title: 'Bad' }],
          },
        },
      },
    }))

    expect(reg.getWidget('container')).toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('container'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('CONTAINER_DEFAULT_VARIANT_MISSING'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('CONTAINER_REGION_ID_RESERVED'))
    warn.mockRestore()
  })

  it.each([
    ['null variants', { defaultVariant: 'single', variants: null }],
    ['null region definitions', {
      defaultVariant: 'single',
      variants: { single: { title: 'Single', regions: [null] } },
    }],
    ['non-array constraint type lists', {
      defaultVariant: 'single',
      variants: {
        single: {
          title: 'Single',
          regions: [{ id: 'content', title: 'Content', constraints: { includeTypes: null } }],
        },
      },
    }],
    ['non-record constraints', {
      defaultVariant: 'single',
      variants: {
        single: {
          title: 'Single',
          regions: [{ id: 'content', title: 'Content', constraints: new Date() }],
        },
      },
    }],
  ])('warns once and skips malformed runtime container metadata: %s', (_label, container) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const reg = createRegistry()

    expect(() => reg.registerWidget(makeMeta('container', {
      container: container as unknown as WidgetMeta['container'],
    }))).not.toThrow()
    expect(reg.getWidget('container')).toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)
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

  it('registers and retrieves global config form schema', () => {
    const reg = createRegistry()
    expect(reg.getGlobalConfigSchema()).toBeUndefined()
    const formSchema = { sections: [{ title: 'General', fields: [] }] }
    reg.registerGlobalConfigFormSchema(formSchema)
    expect(reg.getGlobalConfigSchema()).toBe(formSchema)
  })
})
