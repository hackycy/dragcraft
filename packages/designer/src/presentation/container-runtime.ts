import type { ComputedRef, InjectionKey } from 'vue'
import type { DeepReadonly, PresentationContext, PresentationNode, PresentationRegionDefinition } from './types'
import { computed, inject, reactive, ref } from 'vue'
import { resolveContainerRegions } from './material-presentation'

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
  registerOutlet: (regionId: string) => { id: number, unregister: () => void }
  isPrimaryOutlet: (regionId: string, outletId: number) => boolean
  getOutletState: (regionId: string, outletId: number) => 'valid' | 'duplicate' | 'unknown'
  finalizeOutlets: () => void
  recoveryRegionIds: ComputedRef<readonly string[]>
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
  const regionDefinitions = computed(() => resolveContainerRegions(ctx.session, resolveNode()))
  const outletIds = reactive(new Map<string, number[]>())
  const finalized = ref(false)
  let nextOutletId = 0

  const declaredRegionIds = computed(() => regionDefinitions.value.map(region => region.id))
  const registerOutlet = (regionId: string) => {
    const id = nextOutletId++
    const ids = outletIds.get(regionId) ?? []
    ids.push(id)
    outletIds.set(regionId, ids)
    let active = true
    return {
      id,
      unregister: () => {
        if (!active)
          return
        active = false
        const current = outletIds.get(regionId) ?? []
        const next = current.filter(item => item !== id)
        if (next.length)
          outletIds.set(regionId, next)
        else
          outletIds.delete(regionId)
      },
    }
  }

  const getOutletState = (regionId: string, outletId: number) => {
    if (!declaredRegionIds.value.includes(regionId))
      return 'unknown' as const
    const ids = outletIds.get(regionId) ?? []
    return ids.length > 1 ? 'duplicate' as const : ids.includes(outletId) ? 'valid' as const : 'unknown' as const
  }

  return {
    nodeId: computed(() => resolveNode().id),
    regionDefinitions: computed(() => deepFreeze(
      regionDefinitions.value.map(region => ({ ...region })),
    )),
    getRegionNodes: regionId => ctx.session.document.getRegionNodes(resolveNode().id, regionId),
    registerOutlet,
    isPrimaryOutlet: (regionId, outletId) => outletIds.get(regionId)?.[0] === outletId,
    getOutletState,
    finalizeOutlets: () => {
      finalized.value = true
    },
    recoveryRegionIds: computed(() => finalized.value
      ? declaredRegionIds.value.filter(regionId => (outletIds.get(regionId)?.length ?? 0) === 0)
      : []),
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
