import type { CoreEventName, CoreEvents } from './types'
import { EventEmitter } from '@dragcraft/utils'

export interface TypedEventBus {
  on: <E extends CoreEventName>(event: E, listener: (payload: CoreEvents[E]) => void) => void
  off: <E extends CoreEventName>(event: E, listener: (payload: CoreEvents[E]) => void) => void
  emit: <E extends CoreEventName>(event: E, payload: CoreEvents[E]) => void
  once: <E extends CoreEventName>(event: E, listener: (payload: CoreEvents[E]) => void) => void
  clear: () => void
}

export function createEventBus(): TypedEventBus {
  const emitter = new EventEmitter()

  return {
    on<E extends CoreEventName>(
      event: E,
      listener: (payload: CoreEvents[E]) => void,
    ): void {
      emitter.on(event, listener as (...args: any[]) => void)
    },

    off<E extends CoreEventName>(
      event: E,
      listener: (payload: CoreEvents[E]) => void,
    ): void {
      emitter.off(event, listener as (...args: any[]) => void)
    },

    emit<E extends CoreEventName>(
      event: E,
      payload: CoreEvents[E],
    ): void {
      emitter.emit(event, payload)
    },

    once<E extends CoreEventName>(
      event: E,
      listener: (payload: CoreEvents[E]) => void,
    ): void {
      emitter.once(event, listener as (...args: any[]) => void)
    },

    clear(): void {
      emitter.clear()
    },
  }
}
