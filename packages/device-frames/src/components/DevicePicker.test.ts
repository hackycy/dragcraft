// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createDeviceFrameContext } from '../context'
import DevicePicker from './DevicePicker'

describe('devicePicker', () => {
  it('renders host-owned device choices and switches context', async () => {
    const context = createDeviceFrameContext({ initialDevice: 'iphone' })
    const wrapper = mount(DevicePicker, {
      props: {
        context,
        translate: (key: string, fallback?: string) => key === 'device.group' ? 'Devices' : (fallback ?? key),
      },
    })

    expect(wrapper.attributes('aria-label')).toBe('Devices')
    const buttons = wrapper.findAll('.dc-device-picker__btn')
    expect(buttons).toHaveLength(4)

    await buttons[3]!.trigger('click')
    expect(context.currentDevice.value).toBe('desktop')
    expect(buttons[3]!.attributes('aria-pressed')).toBe('true')
  })
})
