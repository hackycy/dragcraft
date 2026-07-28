import type { PropType, VNode, VNodeChild } from 'vue'
import type { DeviceFrameDefinition, DeviceFrameGroup, DeviceFrameTranslate } from '../types'
import { defineComponent, h } from 'vue'

function translatedLabel(definition: DeviceFrameDefinition, translate: DeviceFrameTranslate | undefined): string {
  return definition.labelKey && translate
    ? translate(definition.labelKey, definition.label)
    : definition.label
}

function renderOption(definition: DeviceFrameDefinition, translate: DeviceFrameTranslate | undefined): VNode {
  return h('option', {
    key: definition.id,
    value: definition.id,
  }, translatedLabel(definition, translate))
}

function renderOptions(definitions: readonly DeviceFrameDefinition[], translate: DeviceFrameTranslate | undefined): VNodeChild[] {
  const groups = new Map<string, { definition: DeviceFrameGroup, frames: DeviceFrameDefinition[] }>()

  for (const definition of definitions) {
    if (!definition.group)
      continue
    const group = groups.get(definition.group.id)
    if (group)
      group.frames.push(definition)
    else
      groups.set(definition.group.id, { definition: definition.group, frames: [definition] })
  }

  const renderedGroups = new Set<string>()
  return definitions.flatMap((definition) => {
    const group = definition.group
    if (!group)
      return [renderOption(definition, translate)]
    if (renderedGroups.has(group.id))
      return []

    renderedGroups.add(group.id)
    const grouped = groups.get(group.id)!
    return [h('optgroup', {
      key: group.id,
      label: grouped.definition.labelKey && translate
        ? translate(grouped.definition.labelKey, grouped.definition.label)
        : grouped.definition.label,
    }, grouped.frames.map(item => renderOption(item, translate)))]
  })
}

export default defineComponent({
  name: 'DcDevicePicker',

  props: {
    definitions: {
      type: Array as PropType<readonly DeviceFrameDefinition[]>,
      required: true,
    },
    modelValue: {
      type: String,
      required: true,
    },
    translate: {
      type: Function as PropType<DeviceFrameTranslate>,
      default: undefined,
    },
  },

  emits: {
    'update:modelValue': (id: string) => id.length > 0,
  },

  setup(props, { emit }) {
    return () => {
      const selected = props.definitions.find(definition => definition.id === props.modelValue)
      const label = props.translate?.('device.group', 'Preview device') ?? 'Preview device'

      return h('label', { class: 'dc-device-picker' }, [
        h('span', {
          'class': 'dc-device-picker__icon',
          'aria-hidden': 'true',
        }, selected?.icon
          ? [typeof selected.icon === 'string'
              ? selected.icon
              : h(selected.icon, { size: 15 })]
          : []),
        h('select', {
          'class': 'dc-device-picker__select',
          'value': props.modelValue,
          'aria-label': label,
          'title': selected ? translatedLabel(selected, props.translate) : label,
          'onChange': (event: Event) => {
            emit('update:modelValue', (event.target as HTMLSelectElement).value)
          },
        }, renderOptions(props.definitions, props.translate)),
      ])
    }
  },
})
