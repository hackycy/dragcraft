import type { Ref } from 'vue'
import type {
  NodeSelectionPlane,
  NodeSelectionProjection,
  NodeSelectionProjectionKind,
} from './selection-presentation'
import { autoUpdate } from '@floating-ui/dom'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useNodeSelectionPresentation } from './selection-presentation'

export interface UseNodeSelectionProjectionOptions {
  kind: NodeSelectionProjectionKind
  plane: Ref<NodeSelectionPlane>
  viewScale?: Ref<number>
}

export interface UseNodeSelectionProjectionReturn {
  projection: Ref<NodeSelectionProjection | null>
  target: Readonly<Ref<HTMLElement | null>>
  update: () => void
}

function resolveViewScale(viewScale: Ref<number> | undefined): number {
  const value = viewScale?.value ?? 1
  return Number.isFinite(value) && value > 0 ? value : 1
}

export function useNodeSelectionProjection(
  elRef: Ref<HTMLElement | null>,
  isSelected: Ref<boolean>,
  options: UseNodeSelectionProjectionOptions,
): UseNodeSelectionProjectionReturn {
  const presentation = useNodeSelectionPresentation()
  const projection = ref<NodeSelectionProjection | null>(null)
  const target = computed(() => presentation.getPlane(options.plane.value).value)
  let cleanupAutoUpdate: (() => void) | null = null

  function update(): void {
    const host = elRef.value
    const plane = target.value
    if (!host || !plane || !isSelected.value) {
      projection.value = null
      return
    }

    const hostRect = host.getBoundingClientRect()
    const planeRect = plane.getBoundingClientRect()
    if (hostRect.width <= 0 || hostRect.height <= 0 || planeRect.width <= 0) {
      projection.value = null
      return
    }

    const viewScale = resolveViewScale(options.viewScale)
    const nodeBounds = {
      top: (hostRect.top - planeRect.top) / viewScale,
      left: (hostRect.left - planeRect.left) / viewScale,
      width: hostRect.width / viewScale,
      height: hostRect.height / viewScale,
    }
    const bounds = options.kind === 'root-segment'
      ? {
          top: nodeBounds.top,
          left: 0,
          width: planeRect.width / viewScale,
          height: nodeBounds.height,
        }
      : { ...nodeBounds }
    projection.value = {
      kind: options.kind,
      plane: options.plane.value,
      nodeBounds,
      bounds,
    }
  }

  function stopAutoUpdate(): void {
    cleanupAutoUpdate?.()
    cleanupAutoUpdate = null
  }

  function startAutoUpdate(): void {
    stopAutoUpdate()
    const host = elRef.value
    const plane = target.value
    if (!host || !plane || !isSelected.value) {
      projection.value = null
      return
    }

    cleanupAutoUpdate = autoUpdate(host, plane, update, {
      ancestorScroll: options.plane.value === 'root',
      ancestorResize: true,
      elementResize: true,
      layoutShift: true,
      animationFrame: false,
    })
  }

  watch([elRef, isSelected, target] as const, () => {
    if (!isSelected.value) {
      stopAutoUpdate()
      projection.value = null
      return
    }
    void nextTick(startAutoUpdate)
  }, { immediate: true, flush: 'post' })

  watch(() => options.viewScale?.value, () => {
    if (isSelected.value)
      void nextTick(update)
  }, { flush: 'post' })

  onBeforeUnmount(stopAutoUpdate)

  return { projection, target, update }
}
