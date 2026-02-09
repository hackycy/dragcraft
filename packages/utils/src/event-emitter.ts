/* eslint-disable ts/no-unsafe-function-type */

export class EventEmitter {
  private events: Map<string, Function[]> = new Map()

  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(listener)
  }

  off(event: string, listener: Function): void {
    const listeners = this.events.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event)
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args)
        }
        catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  once(event: string, listener: Function): void {
    const wrapper = (...args: any[]): void => {
      listener(...args)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }

  clear(): void {
    this.events.clear()
  }
}
