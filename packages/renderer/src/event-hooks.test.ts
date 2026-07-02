import { describe, expect, it, vi } from 'vitest'
import { createDefaultEventHooks, fireAfterHook, resolveBeforeHook, runBeforeAfterHook } from './event-hooks'

describe('createDefaultEventHooks', () => {
  it('returns an empty object', () => {
    expect(createDefaultEventHooks()).toEqual({})
  })
})

describe('resolveBeforeHook', () => {
  it('returns true when resolved value is undefined', async () => {
    await expect(resolveBeforeHook(Promise.resolve(undefined))).resolves.toBe(true)
  })

  it('returns true when resolved value is true', async () => {
    await expect(resolveBeforeHook(Promise.resolve(true))).resolves.toBe(true)
  })

  it('returns false when resolved value is false', async () => {
    await expect(resolveBeforeHook(Promise.resolve(false))).resolves.toBe(false)
  })

  it('returns false and logs when promise rejects', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('hook failed')

    await expect(resolveBeforeHook(Promise.reject(err))).resolves.toBe(false)
    expect(spy).toHaveBeenCalledWith(
      '[dragcraft] Before-hook error (action cancelled):',
      err,
    )

    spy.mockRestore()
  })
})

describe('runBeforeAfterHook', () => {
  it('executes immediately when no before hook is provided', () => {
    const execute = vi.fn()
    const afterHook = vi.fn()

    runBeforeAfterHook(undefined, { nodeId: '1' }, execute, afterHook)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(afterHook).toHaveBeenCalledWith({ nodeId: '1' })
  })

  it('cancels execution when sync before hook returns false', () => {
    const execute = vi.fn()
    const afterHook = vi.fn()

    runBeforeAfterHook(() => false, { nodeId: '1' }, execute, afterHook)

    expect(execute).not.toHaveBeenCalled()
    expect(afterHook).not.toHaveBeenCalled()
  })

  it('sets and clears pending guard for async before hooks', async () => {
    const pending = { value: false }
    const execute = vi.fn()
    const result = runBeforeAfterHook(
      () => Promise.resolve(true),
      { nodeId: '1' },
      execute,
      undefined,
      pending,
    )

    expect(pending.value).toBe(true)
    await result

    expect(execute).toHaveBeenCalledTimes(1)
    expect(pending.value).toBe(false)
  })

  it('logs and cancels when sync before hook throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('sync before boom')
    const execute = vi.fn()

    runBeforeAfterHook(() => {
      throw err
    }, { nodeId: '1' }, execute)

    expect(execute).not.toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith(
      '[dragcraft] Before-hook error (action cancelled):',
      err,
    )

    spy.mockRestore()
  })
})

describe('fireAfterHook', () => {
  it('does nothing when hook is undefined', () => {
    expect(() => fireAfterHook(undefined, { nodeId: '1' })).not.toThrow()
  })

  it('calls sync hook with payload', () => {
    const hook = vi.fn()
    fireAfterHook(hook, { nodeId: '1' })
    expect(hook).toHaveBeenCalledWith({ nodeId: '1' })
  })

  it('catches sync hook errors and logs them', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('sync boom')
    const hook = vi.fn(() => {
      throw err
    })

    fireAfterHook(hook, { nodeId: '1' })

    expect(spy).toHaveBeenCalledWith('[dragcraft] After-hook error:', err)
    spy.mockRestore()
  })

  it('catches async hook rejections and logs them', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('async boom')
    const hook = vi.fn(() => Promise.reject(err))

    fireAfterHook(hook, { nodeId: '1' })

    // Let the microtask settle
    await new Promise(r => setTimeout(r, 0))

    expect(spy).toHaveBeenCalledWith('[dragcraft] Async after-hook error:', err)
    spy.mockRestore()
  })
})
