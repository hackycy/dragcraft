import type {
  CommandExecutionResult,
  ContainerRegionDefinition,
  ContainerRegionId,
  ContainerVariantId,
  SchemaNode,
} from '@dragcraft/core'
import type { ComputedRef, InjectionKey } from 'vue'
import type { DeepReadonly, RendererContext } from './types'
import { CommandType, createContainerPlan } from '@dragcraft/core'
import { cloneDeep } from '@dragcraft/utils'
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
  getRegionNodes: (regionId: ContainerRegionId) => DeepReadonly<SchemaNode[]>
  requestVariantChange: (variant: ContainerVariantId) => CommandExecutionResult
}

export const CONTAINER_RUNTIME_CONTEXT_KEY: InjectionKey<ContainerRuntime> = Symbol('dc-container-runtime')

export function createContainerRuntime(
  getNode: () => SchemaNode,
  ctx: RendererContext,
): ContainerRuntime {
  const resolveNode = (): SchemaNode => {
    void ctx.engine.store.schema.value
    return getNode()
  }
  const plan = computed(() => createContainerPlan(resolveNode(), ctx.engine.registry))

  return {
    nodeId: computed(() => resolveNode().id),
    variant: computed(() => resolveNode().container?.variant ?? ''),
    regionDefinitions: computed(() => deepFreeze(cloneDeep(
      plan.value.ok ? plan.value.plan.variant.regions : [],
    ))),
    getRegionNodes: regionId => deepFreeze(cloneDeep(
      resolveNode().container?.regions[regionId] ?? [],
    )),
    requestVariantChange: variant => ctx.engine.execute({
      type: CommandType.CHANGE_CONTAINER_VARIANT,
      payload: { containerId: getNode().id, variant },
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
