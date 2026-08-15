import type { ComputedRef, InjectionKey } from 'vue'
import type { DeepReadonly, PresentationContext, PresentationNode, PresentationRegionDefinition } from './types'
import { computed, inject } from 'vue'

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value))
      deepFreeze(child)
  }
  return value as DeepReadonly<T>
}

export interface ContainerRuntime {
  nodeId: ComputedRef<string>
  regionDefinitions: ComputedRef<DeepReadonly<PresentationRegionDefinition[]>>
  getRegionNodes: (regionId: string) => readonly PresentationNode[]
}

export const CONTAINER_RUNTIME_CONTEXT_KEY: InjectionKey<ContainerRuntime> = Symbol('dc-container-runtime')

export function createContainerRuntime(
  getNode: () => PresentationNode,
  ctx: PresentationContext,
): ContainerRuntime {
  const resolveNode = (): PresentationNode => {
    void ctx.schema.value
    return ctx.session.document.getNode(getNode().id) ?? getNode()
  }
  const plan = computed(() => ctx.session.materials.resolveContainer(resolveNode()))

  return {
    nodeId: computed(() => resolveNode().id),
    regionDefinitions: computed(() => deepFreeze(
      plan.value.ok
        ? plan.value.presentation.regions.map(region => ({ ...region.definition }))
        : [],
    )),
    getRegionNodes: regionId => ctx.session.document.getRegionNodes(resolveNode().id, regionId),
  }
}

export function useContainerRuntime(): ContainerRuntime {
  const runtime = inject(CONTAINER_RUNTIME_CONTEXT_KEY)
  if (!runtime) {
    throw new Error(
      '[dragcraft/designer] ContainerRuntime not found. '
      + 'ContainerRegionOutlet must be rendered inside a resolved container material.',
    )
  }
  return runtime
}
