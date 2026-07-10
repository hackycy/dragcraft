import type { PropType } from 'vue'
import type { DeviceFrameContext } from '../types'
import { defineComponent, h } from 'vue'

type Translate = (key: string, fallback?: string) => string

export default defineComponent({
  name: 'DcDevicePicker',

  props: {
    context: {
      type: Object as PropType<DeviceFrameContext>,
      required: true,
    },
    translate: {
      type: Function as PropType<Translate>,
      default: undefined,
    },
  },

  setup(props) {
    return () => h('div', {
      'class': 'dc-device-picker',
      'role': 'group',
      'aria-label': props.translate?.('device.group', '预览设备') ?? 'Preview device',
    }, props.context.presets.map((preset) => {
      const label = preset.labelKey && props.translate
        ? props.translate(preset.labelKey, preset.label)
        : preset.label
      return h('button', {
        'type': 'button',
        'class': {
          'dc-device-picker__btn': true,
          'dc-device-picker__btn--active': props.context.currentDevice.value === preset.type,
        },
        'aria-pressed': props.context.currentDevice.value === preset.type,
        'aria-label': label,
        'title': label,
        'onClick': () => props.context.setDevice(preset.type),
      }, [
        typeof preset.icon === 'string' ? preset.icon : h(preset.icon, { size: 15 }),
        h('span', { class: 'dc-device-picker__label' }, label),
      ])
    }))
  },
})
