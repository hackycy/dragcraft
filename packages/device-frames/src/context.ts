import type { DeviceFrameContext, DeviceFrameOptions, DevicePreset, DeviceType } from './types'
import { inject, ref } from 'vue'
import { getDefaultPresets } from './presets'
import { DEVICE_FRAME_CONTEXT_KEY } from './types'

/**
 * Creates a DeviceFrameContext. The caller is responsible for calling
 * `provide(DEVICE_FRAME_CONTEXT_KEY, ctx)` in their setup().
 *
 * @example
 * ```ts
 * const ctx = createDeviceFrameContext({ initialDevice: 'iphone' })
 * provide(DEVICE_FRAME_CONTEXT_KEY, ctx)
 * ```
 */
export function createDeviceFrameContext(
  options: DeviceFrameOptions = {},
): DeviceFrameContext {
  const presets = options.presets ?? getDefaultPresets()
  const currentDevice = ref<DeviceType>(options.initialDevice ?? 'iphone')

  const presetMap = new Map<DeviceType, DevicePreset>(
    presets.map(p => [p.type, p]),
  )

  return {
    currentDevice,
    presets,
    getPreset: (type: DeviceType) => presetMap.get(type),
    setDevice: (type: DeviceType) => {
      if (presetMap.has(type)) {
        currentDevice.value = type
      }
    },
  }
}

/**
 * Injects the DeviceFrameContext from the nearest ancestor provider.
 * Throws if not found.
 */
export function useDeviceFrameContext(): DeviceFrameContext {
  const ctx = inject(DEVICE_FRAME_CONTEXT_KEY)
  if (!ctx) {
    throw new Error(
      '[dragcraft/device-frames] DeviceFrameContext not found. '
      + 'Ensure an ancestor calls provide(DEVICE_FRAME_CONTEXT_KEY, ctx).',
    )
  }
  return ctx
}
