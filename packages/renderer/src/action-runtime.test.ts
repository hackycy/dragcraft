import type { ActionInvocation } from './action-runtime'
import { describe, expect, it, vi } from 'vitest'
import { createConfirmActionInterceptor, runActionPipeline } from './action-runtime'

function makeInvocation(overrides?: Partial<ActionInvocation>): ActionInvocation {
  return {
    key: 'delete',
    label: 'Delete',
    ctx: {} as ActionInvocation['ctx'],
    event: { stopPropagation: vi.fn(), type: 'click' } as unknown as MouseEvent,
    risk: 'destructive',
    ...overrides,
  }
}

describe('runActionPipeline', () => {
  it('executes the action when no interceptor cancels it', () => {
    const execute = vi.fn()

    runActionPipeline(makeInvocation(), execute)

    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('cancels when an interceptor returns a denied decision', () => {
    const execute = vi.fn()

    runActionPipeline(makeInvocation(), execute, [{
      beforeAction: () => ({ allowed: false, reason: 'blocked' }),
    }])

    expect(execute).not.toHaveBeenCalled()
  })

  it('waits for async interceptors and fires afterAction only after execute', async () => {
    const calls: string[] = []

    await runActionPipeline(makeInvocation(), () => {
      calls.push('execute')
    }, [{
      beforeAction: async () => {
        calls.push('before')
        return true
      },
      afterAction: () => {
        calls.push('after')
      },
    }])

    expect(calls).toEqual(['before', 'execute', 'after'])
  })

  it('keeps the pending guard active while async work is running', async () => {
    let resolveFirst!: (allowed: boolean) => void
    const pending = { value: false }
    const execute = vi.fn()
    const invocation = makeInvocation()
    const interceptors = [{
      beforeAction: () => new Promise<boolean>((resolve) => {
        resolveFirst = resolve
      }),
    }]

    const first = runActionPipeline(invocation, execute, interceptors, pending)
    runActionPipeline(invocation, execute, interceptors, pending)

    resolveFirst(true)
    await first

    expect(execute).toHaveBeenCalledTimes(1)
  })
})

describe('createConfirmActionInterceptor', () => {
  it('confirms destructive actions without using browser confirm internally', async () => {
    const confirm = vi.fn(() => Promise.resolve(false))
    const execute = vi.fn()

    await runActionPipeline(makeInvocation(), execute, [
      createConfirmActionInterceptor({
        confirm,
        title: invocation => `Confirm ${invocation.label}`,
      }),
    ])

    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Confirm Delete',
    }))
    expect(execute).not.toHaveBeenCalled()
  })

  it('skips normal actions by default', () => {
    const confirm = vi.fn(() => false)
    const execute = vi.fn()

    runActionPipeline(makeInvocation({ risk: 'normal' }), execute, [
      createConfirmActionInterceptor({ confirm }),
    ])

    expect(confirm).not.toHaveBeenCalled()
    expect(execute).toHaveBeenCalled()
  })
})
