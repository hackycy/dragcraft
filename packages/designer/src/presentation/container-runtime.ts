import type { ComputedRef, InjectionKey } from 'vue'
import type {
  ContainerRegionDefinition,
  ContainerRegionId,
  ContainerVariantId,
} from './semantic'
import type { AuthoringResult, DeepReadonly, RendererContext, RendererNode } from './types'
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
  variant: ComputedRef<ContainerVariantId>
  regionDefinitions: ComputedRef<DeepReadonly<ContainerRegionDefinition[]>>
  getRegionNodes: (regionId: ContainerRegionId) => readonly RendererNode[]
  requestVariantChange: (variant: ContainerVariantId) => AuthoringResult
}

export const CONTAINER_RUNTIME_CONTEXT_KEY: InjectionKey<ContainerRuntime> = Symbol('dc-container-runtime')

export function createContainerRuntime(
  getNode: () => RendererNode,
  ctx: RendererContext,
): ContainerRuntime {
  const resolveNode = (): RendererNode => {
    void ctx.schema.value
    return ctx.session.document.getNode(getNode().id) ?? getNode()
  }
  const plan = computed(() => ctx.session.materials.resolveContainer(resolveNode()))

  return {
    nodeId: computed(() => resolveNode().id),
    variant: computed(() => plan.value.ok ? plan.value.plan.variant.title : ''),
    regionDefinitions: computed(() => deepFreeze(
      plan.value.ok
        ? plan.value.plan.variant.regions.map(region => ({
            ...region,
            constraints: region.constraints
              ? {
                  ...region.constraints,
                  includeTypes: region.constraints.includeTypes ? [...region.constraints.includeTypes] : undefined,
                  excludeTypes: region.constraints.excludeTypes ? [...region.constraints.excludeTypes] : undefined,
                }
              : undefined,
          }))
        : [],
    )),
    getRegionNodes: regionId => ctx.session.document.getRegionNodes(resolveNode().id, regionId),
    requestVariantChange: variant => ctx.session.execute({
      type: 'container.change-variant',
      containerId: getNode().id,
      variant,
    }),
  }
}

export function useContainerRuntime(): ContainerRuntime {
  const runtime = inject(CONTAINER_RUNTIME_CONTEXT_KEY)
  if (!runtime) {
    throw new Error(
      '[dragcraft/renderer] ContainerRuntime not found. '
      + 'ContainerRegionOutlet must be rendered inside a resolved container material.',
    )
  }
  return runtime
}
