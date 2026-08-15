import type { InjectionKey, Ref } from 'vue'
import type { NodeStyle, StyleValueMap } from './semantic'
import { computed, inject } from 'vue'
import { usePresentationContext } from './context'

export interface MaterialPreviewContext {
  nodeId: Readonly<Ref<string>>
  nodeType: Readonly<Ref<string>>
  updateProps: (patch: Record<string, unknown>) => void
  updateStyle: (patch: NodeStyle) => void
  updateContainerStyle: (patch: StyleValueMap) => void
  updateContentStyle: (patch: StyleValueMap) => void
}

export const MATERIAL_PREVIEW_CONTEXT_KEY: InjectionKey<MaterialPreviewContext> = Symbol('dc-material-preview-context')

export function createMaterialPreviewContext(
  getNode: () => { id: string, type: string },
): MaterialPreviewContext {
  const ctx = usePresentationContext()
  const nodeId = computed(() => getNode().id)
  const nodeType = computed(() => getNode().type)

  function updateProps(patch: Record<string, unknown>): void {
    ctx.session.execute({
      type: 'node.update',
      nodeId: nodeId.value,
      props: patch,
    })
  }

  function updateStyle(patch: NodeStyle): void {
    ctx.session.execute({
      type: 'node.update',
      nodeId: nodeId.value,
      props: {},
      style: patch,
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

export function useMaterialPreviewContext(): MaterialPreviewContext {
  const ctx = inject(MATERIAL_PREVIEW_CONTEXT_KEY)
  if (!ctx) {
    throw new Error(
      '[dragcraft/designer] MaterialPreviewContext not found. '
      + 'Ensure this component is rendered by NodeHost.',
    )
  }
  return ctx
}
