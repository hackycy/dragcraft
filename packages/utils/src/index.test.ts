// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { createI18n, EventEmitter, generateShortId, hideNativeDragImage } from './index'

describe('utils exports', () => {
  it('emits, removes, and clears event listeners', () => {
    const emitter = new EventEmitter()
    const listener = vi.fn()

    emitter.on('change', listener)
    emitter.emit('change', 'a')
    emitter.off('change', listener)
    emitter.emit('change', 'b')

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('a')

    emitter.on('change', listener)
    emitter.clear()
    emitter.emit('change', 'c')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('runs once listeners only once', () => {
    const emitter = new EventEmitter()
    const listener = vi.fn()

    emitter.once('ready', listener)
    emitter.emit('ready')
    emitter.emit('ready')

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('creates i18n instances with nested messages and runtime merges', () => {
    const i18n = createI18n('zh-CN', {
      'zh-CN': { common: { save: '保存' } },
    })

    expect(i18n.t('common.save')).toBe('保存')
    expect(i18n.t('common.cancel', '取消')).toBe('取消')

    i18n.mergeMessages('en', { common: { save: 'Save' } })
    i18n.setLocale('en')

    expect(i18n.locale.value).toBe('en')
    expect(i18n.t('common.save')).toBe('Save')
  })

  it('generates ids with the dragcraft prefix', () => {
    expect(generateShortId()).toMatch(/^dragcraft_[a-z0-9]+$/)
  })

  it('uses a mounted transparent element for native drag images', () => {
    const dataTransfer = { setDragImage: vi.fn() } as unknown as DataTransfer

    hideNativeDragImage(dataTransfer)

    const el = document.querySelector('[data-dc-transparent-drag-image]')
    expect(el).toBeInstanceOf(HTMLElement)
    expect(dataTransfer.setDragImage).toHaveBeenCalledWith(el, 0, 0)
  })
})
