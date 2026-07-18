export class EventEmitter {
  private events: Map<string, ((...args: unknown[]) => void)[]> = new Map()

  on(event: string, listener: (...args: unknown[]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(listener)
  }

  off(event: string, listener: (...args: unknown[]) => void): void {
    const listeners = this.events.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const listeners = this.events.get(event)
    if (listeners) {
      listeners.slice().forEach((listener) => {
        try {
          listener(...args)
        }
        catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  once(event: string, listener: (...args: unknown[]) => void): void {
    const wrapper = (...args: unknown[]): void => {
      this.off(event, wrapper)
      listener(...args)
    }
    this.on(event, wrapper)
  }

  clear(): void {
    this.events.clear()
  }
}
