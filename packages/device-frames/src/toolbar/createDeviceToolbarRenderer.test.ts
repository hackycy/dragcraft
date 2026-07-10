// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { createDeviceFrameContext } from '../context'
import { createDeviceToolbarRenderer } from './createDeviceToolbarRenderer'

describe('createDeviceToolbarRenderer', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders only localized device controls', () => {
    const context = createDeviceFrameContext()
    const renderer = createDeviceToolbarRenderer(context)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(defineComponent({
      setup() {
        return () => renderer({ t: (key, fallback) => key === 'device.tablet' ? '平板' : (fallback ?? key) })
      },
    }))

    try {
      app.mount(host)
      const buttons = host.querySelectorAll('.dc-device-picker__btn')
      expect(buttons).toHaveLength(4)
      expect(host.textContent).toContain('平板')
      expect(host.querySelector('[title="Undo"]')).toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })
})
