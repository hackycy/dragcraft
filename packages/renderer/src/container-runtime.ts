import type {
  CommandExecutionResult,
  ContainerRegionDefinition,
  ContainerRegionId,
  ContainerVariantId,
  SchemaNode,
} from '@dragcraft/core'
import type { ComputedRef, InjectionKey } from 'vue'
import type { RendererContext } from './types'
import { CommandType, createContainerPlan } from '@dragcraft/core'
import { computed, inject } from 'vue'

export interface ContainerRuntime {
  nodeId: ComputedRef<string>
  variant: ComputedRef<ContainerVariantId>
  regionDefinitions: ComputedRef<readonly ContainerRegionDefinition[]>
  getRegionNodes: (regionId: ContainerRegionId) => readonly SchemaNode[]
  requestVariantChange: (variant: ContainerVariantId) => CommandExecutionResult
}

export const CONTAINER_RUNTIME_CONTEXT_KEY: InjectionKey<ContainerRuntime> = Symbol('dc-container-runtime')

export function createContainerRuntime(
  getNode: () => SchemaNode,
  ctx: RendererContext,
): ContainerRuntime {
  const plan = computed(() => createContainerPlan(getNode(), ctx.engine.registry))

  return {
    nodeId: computed(() => getNode().id),
    variant: computed(() => getNode().container?.variant ?? ''),
    regionDefinitions: computed(() => plan.value.ok ? plan.value.plan.variant.regions : []),
    getRegionNodes: regionId => getNode().container?.regions[regionId] ?? [],
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
