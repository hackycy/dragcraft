import { describe, expect, it } from 'vitest'
import { createDeviceFrameContext } from './context'
import { getDefaultPresets } from './presets'

describe('device presets', () => {
  it('publishes unique built-in devices in display order with accurate viewports', () => {
    const presets = getDefaultPresets()

    expect(presets.map(preset => [preset.type, preset.width, preset.height])).toEqual([
      ['iphone', 393, 852],
      ['iphone-x', 375, 812],
      ['iphone-8', 375, 667],
      ['android', 360, 720],
      ['android-waterdrop', 360, 720],
      ['tablet', 768, 1024],
      ['desktop', 1280, 800],
    ])
    expect(new Set(presets.map(preset => preset.type)).size).toBe(presets.length)
  })

  it.each(['iphone-x', 'iphone-8', 'android-waterdrop'] as const)(
    'switches to the %s frame through the public context',
    (type) => {
      const context = createDeviceFrameContext()

      context.setDevice(type)

      expect(context.currentDevice.value).toBe(type)
      expect(context.getPreset(type)?.frameComponent).toBeDefined()
    },
  )
})
