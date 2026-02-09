import type { EngineEventBus } from '../event-bus'
import type { Dict, WidgetType } from '../types'

export type DndStatus = 'idle' | 'dragging'

export interface DndState {
  status: DndStatus
  dragType?: WidgetType
  dragData?: Dict
  overIndex?: number | null
}

export class DndManager {
  private state: DndState = {
    status: 'idle',
    overIndex: null,
  }

  constructor(private eventBus?: EngineEventBus) {}

  getState(): DndState {
    return { ...this.state }
  }

  startDrag(type: WidgetType, data?: Dict): void {
    this.state = {
      status: 'dragging',
      dragType: type,
      dragData: data,
      overIndex: null,
    }
    this.eventBus?.emit('dnd:changed', this.getState())
  }

  updateOver(index: number | null): void {
    if (this.state.status !== 'dragging') {
      return
    }
    this.state.overIndex = index
    this.eventBus?.emit('dnd:changed', this.getState())
  }

  endDrag(): void {
    this.state = {
      status: 'idle',
      overIndex: null,
    }
    this.eventBus?.emit('dnd:changed', this.getState())
  }
}
