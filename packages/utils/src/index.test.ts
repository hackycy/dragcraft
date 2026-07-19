import { describe, expect, it, vi } from 'vitest'
import { EventEmitter, generateShortId } from './index'

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

  it('notifies later listeners when a once listener removes itself', () => {
    const emitter = new EventEmitter()
    const calls: string[] = []
    emitter.once('ready', () => calls.push('once'))
    emitter.on('ready', () => calls.push('on'))

    emitter.emit('ready')
    emitter.emit('ready')

    expect(calls).toEqual(['once', 'on', 'on'])
  })

  it('removes a once listener before invoking a failing callback', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const emitter = new EventEmitter()
    const listener = vi.fn(() => {
      throw new Error('listener failed')
    })
    emitter.once('ready', listener)

    try {
      emitter.emit('ready')
      emitter.emit('ready')
      expect(listener).toHaveBeenCalledOnce()
    }
    finally {
      error.mockRestore()
    }
  })

  it('generates ids with the dragcraft prefix', () => {
    expect(generateShortId()).toMatch(/^dragcraft_[a-z0-9]+$/)
  })
})
