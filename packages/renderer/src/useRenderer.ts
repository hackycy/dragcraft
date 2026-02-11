import type { WidgetSchema } from '@dragcraft/core'
import type { Component, ComputedRef, Ref } from 'vue'
import type { WidgetComponentMap } from './types'
import { computed } from 'vue'

export interface UseRendererOptions {
  widgets: Ref<WidgetSchema[]>
  components: Ref<WidgetComponentMap>
}

export interface UseRendererReturn {
  resolveComponent: (type: string) => Component | undefined
  widgetCount: ComputedRef<number>
}

export function useRenderer(options: UseRendererOptions): UseRendererReturn {
  const resolveComponent = (type: string): Component | undefined => {
    return options.components.value[type]
  }

  const widgetCount = computed(() => options.widgets.value.length)

  return { resolveComponent, widgetCount }
}
