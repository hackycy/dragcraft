import { describe, expect, it, vi } from 'vitest'
import { EventHub } from './event-hub'

describe('eventHub', () => {
  it('emits to registered listeners', () => {
    const hub = new EventHub()
    const listener = vi.fn()
    hub.on('test:event', listener)
    hub.emit('test:event', 'arg1', 'arg2')
    expect(listener).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('removes listener with off', () => {
    const hub = new EventHub()
    const listener = vi.fn()
    hub.on('test:event', listener)
    hub.off('test:event', listener)
    hub.emit('test:event')
    expect(listener).not.toHaveBeenCalled()
  })

  it('fires once listener only once', () => {
    const hub = new EventHub()
    const listener = vi.fn()
    hub.once('test:event', listener)
    hub.emit('test:event')
    hub.emit('test:event')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('clear removes all listeners', () => {
    const hub = new EventHub()
    const listener = vi.fn()
    hub.on('a', listener)
    hub.on('b', listener)
    hub.clear()
    hub.emit('a')
    hub.emit('b')
    expect(listener).not.toHaveBeenCalled()
  })

  it('supports multiple listeners on same event', () => {
    const hub = new EventHub()
    const a = vi.fn()
    const b = vi.fn()
    hub.on('evt', a)
    hub.on('evt', b)
    hub.emit('evt')
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
  })
})
