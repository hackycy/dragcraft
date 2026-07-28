// @vitest-environment happy-dom
import type { DeviceFrameDefinition } from '../types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { BUILT_IN_DEVICE_FRAMES } from '../definitions'
import DevicePicker from './DevicePicker'

describe('devicePicker', () => {
  it('renders definition metadata and emits a request without owning selection state', async () => {
    const wrapper = mount(DevicePicker, {
      props: {
        definitions: BUILT_IN_DEVICE_FRAMES,
        modelValue: 'iphone',
        translate: (key: string, fallback?: string) => ({
          'device.group': 'Devices',
          'device.groups.iphone': 'Apple phones',
          'device.groups.android': 'Android phones',
          'device.groups.other': 'Other devices',
        })[key] ?? fallback ?? key,
      },
    })

    const select = wrapper.get('select')
    expect(select.attributes('aria-label')).toBe('Devices')
    expect(wrapper.findAll('optgroup').map(group => group.attributes('label'))).toEqual([
      'Apple phones',
      'Android phones',
      'Other devices',
    ])
    expect(wrapper.findAll('option')).toHaveLength(7)
    expect((select.element as HTMLSelectElement).value).toBe('iphone')

    await select.setValue('android-waterdrop')

    expect(wrapper.props('modelValue')).toBe('iphone')
    expect(wrapper.emitted('update:modelValue')).toEqual([['android-waterdrop']])
  })

  it('supports arbitrary custom IDs and ungrouped definitions', async () => {
    const CustomShell = defineComponent({
      setup(_, { slots }) {
        return () => h('div', slots.default?.())
      },
    })
    const customDefinition: DeviceFrameDefinition = Object.freeze({
      id: 'acme.preview-wide',
      label: 'Acme Wide Preview',
      viewport: Object.freeze({ width: 1440, height: 900 }),
      containerShell: CustomShell,
    })
    const definitions = Object.freeze([customDefinition, ...BUILT_IN_DEVICE_FRAMES])
    const wrapper = mount(DevicePicker, {
      props: {
        definitions,
        modelValue: customDefinition.id,
      },
    })

    expect(wrapper.findAll('option').at(0)?.attributes('value')).toBe(customDefinition.id)
    expect(wrapper.findAll('option').at(0)?.text()).toBe(customDefinition.label)
    expect(wrapper.get('select').attributes('title')).toBe(customDefinition.label)

    await wrapper.get('select').setValue('iphone-x')
    expect(wrapper.emitted('update:modelValue')).toEqual([['iphone-x']])
  })
})
