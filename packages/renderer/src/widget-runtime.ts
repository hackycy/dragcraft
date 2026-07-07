import type { NodeStyle, StyleValueMap } from '@dragcraft/core'
import type { InjectionKey, Ref } from 'vue'
import { CommandType } from '@dragcraft/core'
import { computed, inject } from 'vue'
import { useRendererContext } from './context'

export interface WidgetRuntimeContext {
  nodeId: Readonly<Ref<string>>
  nodeType: Readonly<Ref<string>>
  updateProps: (patch: Record<string, unknown>) => void
  updateStyle: (patch: NodeStyle) => void
  updateContainerStyle: (patch: StyleValueMap) => void
  updateContentStyle: (patch: StyleValueMap) => void
}

export const WIDGET_RUNTIME_CONTEXT_KEY: InjectionKey<WidgetRuntimeContext> = Symbol('dc-widget-runtime')

export function createWidgetRuntimeContext(
  getNode: () => { id: string, type: string },
): WidgetRuntimeContext {
  const ctx = useRendererContext()
  const nodeId = computed(() => getNode().id)
  const nodeType = computed(() => getNode().type)

  function updateProps(patch: Record<string, unknown>): void {
    ctx.engine.execute({
      type: CommandType.UPDATE_PROPS,
      payload: {
        nodeId: nodeId.value,
        props: patch,
      },
    })
  }

  function updateStyle(patch: NodeStyle): void {
    ctx.engine.execute({
      type: CommandType.UPDATE_PROPS,
      payload: {
        nodeId: nodeId.value,
        props: {},
        style: patch,
      },
    })
  }

  return {
    nodeId,
    nodeType,
    updateProps,
    updateStyle,
    updateContainerStyle: patch => updateStyle({ container: patch }),
    updateContentStyle: patch => updateStyle({ content: patch }),
  }
}

export function useWidgetRuntime(): WidgetRuntimeContext {
  const ctx = inject(WIDGET_RUNTIME_CONTEXT_KEY)
  if (!ctx) {
    throw new Error(
      '[dragcraft/renderer] WidgetRuntimeContext not found. '
      + 'Ensure this component is rendered by WidgetRenderer.',
    )
  }
  return ctx
}
