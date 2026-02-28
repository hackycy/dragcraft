import type { DeviceFrameContext } from '../types'
import { computed } from 'vue'
import { useDeviceFrameContext } from '../context'

/**
 * Convenience composable for consuming device frame state in any descendant.
 * Returns the full context plus commonly needed computed values.
 *
 * @example
 * ```ts
 * const { currentDevice, setDevice, presets } = useDeviceFrame()
 * ```
 */
export function useDeviceFrame() {
  const ctx: DeviceFrameContext = useDeviceFrameContext()

  const currentPreset = computed(() =>
    ctx.getPreset(ctx.currentDevice.value),
  )

  const viewportWidth = computed(() => currentPreset.value?.width ?? 375)
  const viewportHeight = computed(() => currentPreset.value?.height ?? 812)

  return {
    /** Reactive current device type */
    currentDevice: ctx.currentDevice,
    /** Reactive current preset object */
    currentPreset,
    /** Reactive viewport width */
    viewportWidth,
    /** Reactive viewport height */
    viewportHeight,
    /** All available presets */
    presets: ctx.presets,
    /** Switch device */
    setDevice: ctx.setDevice,
  }
}
