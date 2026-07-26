import type { PropType, VNode } from 'vue'
import type { DeviceFrameContext, DevicePreset, DeviceType } from '../types'
import { defineComponent, h } from 'vue'

type Translate = (key: string, fallback?: string) => string
type PresetGroup = 'iphone' | 'android' | 'other'

const GROUPS: Array<{
  id: PresetGroup
  labelKey: string
  fallback: string
  types: readonly DeviceType[]
}> = [
  {
    id: 'iphone',
    labelKey: 'device.groups.iphone',
    fallback: 'iPhone',
    types: ['iphone', 'iphone-x', 'iphone-8'],
  },
  {
    id: 'android',
    labelKey: 'device.groups.android',
    fallback: 'Android',
    types: ['android', 'android-waterdrop'],
  },
  {
    id: 'other',
    labelKey: 'device.groups.other',
    fallback: 'Other',
    types: ['tablet', 'desktop'],
  },
]

function translatePreset(preset: DevicePreset, translate: Translate | undefined): string {
  return preset.labelKey && translate
    ? translate(preset.labelKey, preset.label)
    : preset.label
}

function renderGroup(
  group: typeof GROUPS[number],
  presets: readonly DevicePreset[],
  translate: Translate | undefined,
): VNode | null {
  const groupPresets = presets.filter(preset => group.types.includes(preset.type))
  if (groupPresets.length === 0)
    return null

  return h('optgroup', {
    key: group.id,
    label: translate?.(group.labelKey, group.fallback) ?? group.fallback,
  }, groupPresets.map(preset => h('option', {
    key: preset.type,
    value: preset.type,
  }, translatePreset(preset, translate))))
}

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
    return () => {
      const selected = props.context.getPreset(props.context.currentDevice.value)
        ?? props.context.presets[0]
      const label = props.translate?.('device.group', 'Preview device') ?? 'Preview device'

      return h('label', { class: 'dc-device-picker' }, [
        selected && h('span', {
          'class': 'dc-device-picker__icon',
          'aria-hidden': 'true',
        }, [
          typeof selected.icon === 'string'
            ? selected.icon
            : h(selected.icon, { size: 15 }),
        ]),
        h('select', {
          'class': 'dc-device-picker__select',
          'value': props.context.currentDevice.value,
          'aria-label': label,
          'title': selected ? translatePreset(selected, props.translate) : label,
          'onChange': (event: Event) => {
            props.context.setDevice((event.target as HTMLSelectElement).value as DeviceType)
          },
        }, GROUPS.map(group => renderGroup(group, props.context.presets, props.translate))),
      ])
    }
  },
})
