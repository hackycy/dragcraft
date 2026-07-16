import type { Ref } from 'vue'
import type {
  NodeSelectionPlane,
  NodeSelectionProjection,
  NodeSelectionProjectionKind,
} from '../selection-presentation'
import { autoUpdate } from '@floating-ui/dom'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useNodeSelectionPresentation } from '../selection-presentation'

export interface UseNodeSelectionProjectionOptions {
  kind: NodeSelectionProjectionKind
  plane: Ref<NodeSelectionPlane>
  selfTargetSelector?: string
}

export interface UseNodeSelectionProjectionReturn {
  projection: Ref<NodeSelectionProjection | null>
  target: Readonly<Ref<HTMLElement | null>>
  update: () => void
}

function resolveTargetElement(host: HTMLElement, selfTargetSelector: string | undefined): HTMLElement {
  if (host.dataset.dcLayerMode !== 'self' || !selfTargetSelector)
    return host

  const candidate = host.querySelector<HTMLElement>(selfTargetSelector)
  if (!candidate)
    return host

  const rect = candidate.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 ? candidate : host
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

    const targetElement = resolveTargetElement(host, options.selfTargetSelector)
    const targetRect = targetElement.getBoundingClientRect()
    const planeRect = plane.getBoundingClientRect()
    if (targetRect.width <= 0 || targetRect.height <= 0 || planeRect.width <= 0) {
      projection.value = null
      return
    }

    const rect = {
      top: targetRect.top - planeRect.top,
      left: targetRect.left - planeRect.left,
      width: targetRect.width,
      height: targetRect.height,
    }

    projection.value = {
      kind: options.kind,
      plane: options.plane.value,
      rect,
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

    cleanupAutoUpdate = autoUpdate(resolveTargetElement(host, options.selfTargetSelector), plane, update, {
      ancestorScroll: false,
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

  onBeforeUnmount(stopAutoUpdate)

  return { projection, target, update }
}
