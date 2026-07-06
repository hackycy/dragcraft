import type { Command } from '@dragcraft/core'
import type { NodeActionContext } from './action-registry'
import type { MaybePromise, PendingGuard } from './event-hooks'

export type ActionRisk = 'normal' | 'destructive'

export interface ActionDecision {
  allowed: boolean
  reason?: string
}

export interface ActionInvocation {
  key: string
  label: string
  ctx: NodeActionContext
  event: MouseEvent
  risk: ActionRisk
  command?: Command
  metadata?: Record<string, unknown>
}

export interface ActionInterceptor {
  beforeAction?: (invocation: ActionInvocation) => MaybePromise<boolean | ActionDecision | void>
  afterAction?: (invocation: ActionInvocation) => MaybePromise<void>
  onActionError?: (invocation: ActionInvocation, error: unknown) => void
}

export interface ActionConfirmRequest {
  invocation: ActionInvocation
  title?: string
  message?: string
}

export interface ConfirmActionInterceptorOptions {
  confirm: (request: ActionConfirmRequest) => MaybePromise<boolean>
  shouldConfirm?: (invocation: ActionInvocation) => boolean
  title?: string | ((invocation: ActionInvocation) => string)
  message?: string | ((invocation: ActionInvocation) => string)
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return value !== null && typeof value === 'object' && typeof (value as Promise<unknown>).then === 'function'
}

function resolveActionDecision(result: boolean | ActionDecision | void): ActionDecision {
  if (result === false)
    return { allowed: false }

  if (result && typeof result === 'object' && 'allowed' in result)
    return result

  return { allowed: true }
}

function resolveText(
  value: string | ((invocation: ActionInvocation) => string) | undefined,
  invocation: ActionInvocation,
): string | undefined {
  return typeof value === 'function' ? value(invocation) : value
}

function reportActionError(
  interceptors: ActionInterceptor[],
  invocation: ActionInvocation,
  error: unknown,
): void {
  console.error(`[dragcraft] Action "${invocation.key}" error (action cancelled):`, error)
  for (const interceptor of interceptors) {
    try {
      interceptor.onActionError?.(invocation, error)
    }
    catch (err) {
      console.error('[dragcraft] Action error handler failed:', err)
    }
  }
}

function fireAfterAction(
  interceptors: ActionInterceptor[],
  invocation: ActionInvocation,
): void {
  for (const interceptor of interceptors) {
    if (!interceptor.afterAction)
      continue

    try {
      const result = interceptor.afterAction(invocation)
      if (isPromiseLike(result)) {
        result.catch((err) => {
          console.error('[dragcraft] Async after-action error:', err)
        })
      }
    }
    catch (err) {
      console.error('[dragcraft] After-action error:', err)
    }
  }
}

export function runActionPipeline(
  invocation: ActionInvocation,
  execute: () => MaybePromise<void>,
  interceptors: ActionInterceptor[] = [],
  pendingGuard?: PendingGuard,
): void | Promise<void> {
  if (pendingGuard?.value)
    return

  const runExecute = (): void | Promise<void> => {
    const result = execute()
    if (isPromiseLike(result)) {
      return result.then(() => {
        fireAfterAction(interceptors, invocation)
      })
    }

    fireAfterAction(interceptors, invocation)
  }

  const runBeforeFrom = (startIndex: number): void | Promise<void> => {
    for (let index = startIndex; index < interceptors.length; index++) {
      const beforeAction = interceptors[index].beforeAction
      if (!beforeAction)
        continue

      const result = beforeAction(invocation)
      if (isPromiseLike(result)) {
        return result.then((resolved) => {
          const decision = resolveActionDecision(resolved)
          if (!decision.allowed)
            return
          return runBeforeFrom(index + 1)
        })
      }

      const decision = resolveActionDecision(result)
      if (!decision.allowed)
        return
    }

    return runExecute()
  }

  try {
    const result = runBeforeFrom(0)
    if (!isPromiseLike(result))
      return result

    if (pendingGuard)
      pendingGuard.value = true

    return result
      .catch((err) => {
        reportActionError(interceptors, invocation, err)
      })
      .finally(() => {
        if (pendingGuard)
          pendingGuard.value = false
      })
  }
  catch (err) {
    reportActionError(interceptors, invocation, err)
  }
}

export function createConfirmActionInterceptor(
  options: ConfirmActionInterceptorOptions,
): ActionInterceptor {
  const shouldConfirm = options.shouldConfirm ?? (invocation => invocation.risk === 'destructive')

  return {
    beforeAction(invocation) {
      if (!shouldConfirm(invocation))
        return

      return options.confirm({
        invocation,
        title: resolveText(options.title, invocation),
        message: resolveText(options.message, invocation),
      })
    },
  }
}
