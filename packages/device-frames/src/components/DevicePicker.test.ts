// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createDeviceFrameContext } from '../context'
import DevicePicker from './DevicePicker'

describe('devicePicker', () => {
  it('renders grouped device choices and switches context', async () => {
    const context = createDeviceFrameContext({ initialDevice: 'iphone' })
    const wrapper = mount(DevicePicker, {
      props: {
        context,
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
    expect(wrapper.find('.dc-device-picker__icon').exists()).toBe(true)

    await select.setValue('android-waterdrop')
    expect(context.currentDevice.value).toBe('android-waterdrop')
    expect((select.element as HTMLSelectElement).value).toBe('android-waterdrop')
  })

  it('uses preset labels and group fallbacks without a translator', () => {
    const context = createDeviceFrameContext()
    const wrapper = mount(DevicePicker, { props: { context } })

    expect(wrapper.get('select').attributes('aria-label')).toBe('Preview device')
    expect(wrapper.findAll('optgroup').map(group => group.attributes('label'))).toEqual([
      'iPhone',
      'Android',
      'Other',
    ])
    expect(wrapper.findAll('option').map(option => option.text())).toEqual([
      'iPhone 15 Pro',
      'iPhone X',
      'iPhone 8',
      'Android',
      'Android Waterdrop',
      'Tablet',
      'Desktop',
    ])
  })
})
