import type { VNodeChild } from 'vue'
import type { DeviceFrameContext } from '../types'
import { h } from 'vue'

interface MinimalToolbarAPI {
  t?: (key: string, fallback?: string) => string
}

/** Creates an optional device selector for the designer canvas extension surface. */
export function createDeviceToolbarRenderer(
  ctx: DeviceFrameContext,
): (api: MinimalToolbarAPI) => VNodeChild {
  return (api: MinimalToolbarAPI): VNodeChild => h(
    'div',
    {
      'class': 'dc-device-picker',
      'role': 'group',
      'aria-label': api.t?.('device.group', '预览设备') ?? 'Preview device',
    },
    ctx.presets.map((preset) => {
      const label = preset.labelKey && api.t
        ? api.t(preset.labelKey, preset.label)
        : preset.label
      return h('button', {
        'type': 'button',
        'class': {
          'dc-device-picker__btn': true,
          'dc-device-picker__btn--active': ctx.currentDevice.value === preset.type,
        },
        'aria-pressed': ctx.currentDevice.value === preset.type,
        'aria-label': label,
        'title': label,
        'onClick': () => ctx.setDevice(preset.type),
      }, [
        typeof preset.icon === 'string' ? preset.icon : h(preset.icon, { size: 15 }),
        h('span', { class: 'dc-device-picker__label' }, label),
      ])
    }),
  )
}
