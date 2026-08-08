import type { EventNameValue } from './constants'
import { EventEmitter } from '@dragcraft/utils'

export type EventListener = (...args: unknown[]) => void

export class EventHub {
  private emitter: EventEmitter

  constructor() {
    this.emitter = new EventEmitter()
  }

  on(event: EventNameValue | (string & {}), listener: EventListener): void {
    this.emitter.on(event, listener)
  }

  off(event: EventNameValue | (string & {}), listener: EventListener): void {
    this.emitter.off(event, listener)
  }

  emit(event: EventNameValue | (string & {}), ...args: unknown[]): void {
    this.emitter.emit(event, ...args)
  }

  once(event: EventNameValue | (string & {}), listener: EventListener): void {
    this.emitter.once(event, listener)
  }

  clear(): void {
    this.emitter.clear()
  }
}

export function createEventHub(): EventHub {
  return new EventHub()
}
