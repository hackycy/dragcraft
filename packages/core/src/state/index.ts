import type { EngineState } from '../types'
import { cloneDeep } from '@dragcraft/utils'
import { reactive, readonly, toRaw } from '@vue/reactivity'

export class EngineStore {
  private state: EngineState

  constructor(initialState: EngineState) {
    this.state = reactive(initialState) as EngineState
  }

  getState(): Readonly<EngineState> {
    return readonly(this.state) as Readonly<EngineState>
  }

  apply(mutator: (state: EngineState) => void): void {
    mutator(this.state)
  }

  replace(nextState: EngineState): void {
    this.state.page = nextState.page
    this.state.widgets = nextState.widgets
    this.state.globalConfigs = nextState.globalConfigs
    this.state.activeId = nextState.activeId
  }

  snapshot(): EngineState {
    return cloneDeep(toRaw(this.state)) as EngineState
  }
}
