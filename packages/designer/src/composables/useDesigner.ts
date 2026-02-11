import type { Engine, WidgetSchema } from '@dragcraft/core'
import type { FormSchema } from '@dragcraft/form-generator'
import type { WidgetComponentMap } from '@dragcraft/renderer'
import type { ComputedRef } from 'vue'
import type { DesignerOptions, DesignerWidgetDefinition, WidgetRegistry } from '../types'
import type { UseDragDropReturn } from './useDragDrop'
import { createEngine } from '@dragcraft/core'
import { computed } from '@vue/reactivity'
import { onUnmounted } from 'vue'
import { useDragDrop } from './useDragDrop'
import { useWidgetRegistry } from './useWidgetRegistry'

export interface UseDesignerReturn {
  engine: Engine
  registry: WidgetRegistry

  widgets: ComputedRef<WidgetSchema[]>
  sortedWidgets: ComputedRef<WidgetSchema[]>
  activeId: ComputedRef<string | null>
  activeType: ComputedRef<'widget' | 'config' | null>
  activeWidget: ComputedRef<WidgetSchema | null>
  activeDefinition: ComputedRef<DesignerWidgetDefinition | null>
  activeFormSchema: ComputedRef<FormSchema>
  componentMap: ComputedRef<WidgetComponentMap>
  canUndo: ComputedRef<boolean>
  canRedo: ComputedRef<boolean>

  dragDrop: UseDragDropReturn

  selectWidget: (id: string) => void
  clearSelection: () => void
  removeActiveWidget: () => void
  updateActiveWidgetProps: (props: Record<string, any>) => void
  undo: () => void
  redo: () => void
  dispose: () => void
}

export function useDesigner(options: DesignerOptions = {}): UseDesignerReturn {
  const engine = options.engine ?? createEngine()
  const registry = useWidgetRegistry(options.widgets)
  const dragDrop = useDragDrop({ engine, registry })

  const widgets = computed(() => {
    const w = engine.state.widgets
    console.log('[useDesigner] widgets computed, count:', w.length)
    return w
  })
  const sortedWidgets = computed(() => {
    const sorted = [...engine.state.widgets].sort(
      (a, b) => (a.props.__order ?? 0) - (b.props.__order ?? 0),
    )
    console.log('[useDesigner] sortedWidgets computed, count:', sorted.length)
    return sorted
  })
  const activeId = computed(() => engine.state.activeId)
  const activeType = computed(() => engine.state.activeType)

  const activeWidget = computed(() => {
    if (activeId.value && activeType.value === 'widget') {
      return widgets.value.find(w => w.id === activeId.value) ?? null
    }
    return null
  })

  const activeDefinition = computed(() => {
    if (activeWidget.value) {
      return registry.get(activeWidget.value.type) ?? null
    }
    return null
  })

  const activeFormSchema = computed<FormSchema>(() => {
    return activeDefinition.value?.formSchema ?? []
  })

  const componentMap = computed(() => registry.getComponentMap())

  const canUndo = computed(() => engine.canUndo())
  const canRedo = computed(() => engine.canRedo())

  function selectWidget(id: string): void {
    engine.setActive(id, 'widget')
  }

  function clearSelection(): void {
    engine.clearActive()
  }

  function removeActiveWidget(): void {
    if (activeId.value && activeType.value === 'widget') {
      engine.removeWidget(activeId.value)
    }
  }

  function updateActiveWidgetProps(props: Record<string, any>): void {
    if (activeId.value && activeType.value === 'widget') {
      engine.updateWidget(activeId.value, props)
    }
  }

  function dispose(): void {
    engine.dispose()
  }

  onUnmounted(() => {
    dispose()
  })

  return {
    engine,
    registry,
    widgets,
    sortedWidgets,
    activeId,
    activeType,
    activeWidget,
    activeDefinition,
    activeFormSchema,
    componentMap,
    canUndo,
    canRedo,
    dragDrop,
    selectWidget,
    clearSelection,
    removeActiveWidget,
    updateActiveWidgetProps,
    undo: () => engine.undo(),
    redo: () => engine.redo(),
    dispose,
  }
}
