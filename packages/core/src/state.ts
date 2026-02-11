import type { GlobalConfigSchema, State, WidgetSchema } from './types'
import { cloneDeep } from '@dragcraft/utils'
import { reactive, readonly } from '@vue/reactivity'

export function createInitialState(): State {
  return {
    widgets: [],
    globalConfigs: [],
    activeId: null,
    activeType: null,
  }
}

export interface StateStore {
  readonly state: State
  readonly _internal: State

  // Widget operations
  addWidget: (widget: WidgetSchema) => void
  updateWidget: (id: string, props: Partial<Record<string, any>>) => void
  removeWidget: (id: string) => void
  findWidget: (id: string) => WidgetSchema | undefined

  // GlobalConfig operations
  addGlobalConfig: (config: GlobalConfigSchema) => void
  updateGlobalConfig: (id: string, props: Partial<Record<string, any>>) => void
  removeGlobalConfig: (id: string) => void
  findGlobalConfig: (id: string) => GlobalConfigSchema | undefined

  // Active selection
  setActive: (id: string, type: 'widget' | 'config') => void
  clearActive: () => void

  // Snapshot management
  snapshot: () => State
  replace: (snapshot: State) => void
}

export function createStateStore(initialState?: State): StateStore {
  const _internal = reactive<State>(
    initialState ? cloneDeep(initialState) : createInitialState(),
  )

  const state = readonly(_internal)

  return {
    get state() {
      return state as State
    },

    get _internal() {
      return _internal
    },

    // Widget operations

    addWidget(widget: WidgetSchema): void {
      _internal.widgets.push(widget)
    },

    updateWidget(id: string, props: Partial<Record<string, any>>): void {
      const widget = _internal.widgets.find(w => w.id === id)
      if (widget) {
        Object.assign(widget.props, props)
      }
    },

    removeWidget(id: string): void {
      const index = _internal.widgets.findIndex(w => w.id === id)
      if (index !== -1) {
        _internal.widgets.splice(index, 1)
        if (_internal.activeId === id && _internal.activeType === 'widget') {
          _internal.activeId = null
          _internal.activeType = null
        }
      }
    },

    findWidget(id: string): WidgetSchema | undefined {
      return _internal.widgets.find(w => w.id === id)
    },

    // GlobalConfig operations

    addGlobalConfig(config: GlobalConfigSchema): void {
      _internal.globalConfigs.push(config)
    },

    updateGlobalConfig(id: string, props: Partial<Record<string, any>>): void {
      const config = _internal.globalConfigs.find(c => c.id === id)
      if (config) {
        Object.assign(config.props, props)
      }
    },

    removeGlobalConfig(id: string): void {
      const index = _internal.globalConfigs.findIndex(c => c.id === id)
      if (index !== -1) {
        _internal.globalConfigs.splice(index, 1)
        if (_internal.activeId === id && _internal.activeType === 'config') {
          _internal.activeId = null
          _internal.activeType = null
        }
      }
    },

    findGlobalConfig(id: string): GlobalConfigSchema | undefined {
      return _internal.globalConfigs.find(c => c.id === id)
    },

    // Active selection

    setActive(id: string, type: 'widget' | 'config'): void {
      _internal.activeId = id
      _internal.activeType = type
    },

    clearActive(): void {
      _internal.activeId = null
      _internal.activeType = null
    },

    // Snapshot management

    snapshot(): State {
      return cloneDeep<State>({
        widgets: _internal.widgets,
        globalConfigs: _internal.globalConfigs,
        activeId: _internal.activeId,
        activeType: _internal.activeType,
      })
    },

    replace(snapshot: State): void {
      const cloned = cloneDeep(snapshot)

      _internal.widgets.length = 0
      _internal.widgets.push(...cloned.widgets)

      _internal.globalConfigs.length = 0
      _internal.globalConfigs.push(...cloned.globalConfigs)

      _internal.activeId = cloned.activeId
      _internal.activeType = cloned.activeType
    },
  }
}
