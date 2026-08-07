// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import App from './App.vue'

describe('playground app', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('switches the mounted workbench locale without recreating the designer session', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    try {
      app.mount(host)
      await nextTick()
      const designerRoot = host.querySelector<HTMLElement>('[data-dc-component="designer"]')!
      const devicePicker = host.querySelector<HTMLSelectElement>('.dc-device-picker__select')!
      const localeButton = Array.from(host.querySelectorAll<HTMLButtonElement>('.playground-header__btn'))
        .find(button => button.textContent?.trim() === 'English')!

      expect(devicePicker.getAttribute('aria-label')).toBe('预览设备')

      localeButton.click()
      await nextTick()

      expect(host.querySelector('[data-dc-component="designer"]')).toBe(designerRoot)
      expect(devicePicker.getAttribute('aria-label')).toBe('Preview device')
      expect(host.querySelector('.dc-material-panel__heading')?.textContent).toBe('Materials')
      expect(Array.from(host.querySelectorAll('.dc-material-group__title'), title => title.textContent))
        .toEqual(['Basic', 'Form', 'Navigation', 'Action', 'Layout'])
      expect(Array.from(host.querySelectorAll('.pg-material-card__title'), title => title.textContent))
        .toEqual([
          'Text',
          'Button',
          'Image',
          'Link',
          'Divider',
          'Carousel',
          'Input',
          'Textarea',
          'Select',
          'Checkbox',
          'Radio Group',
          'Navigation Bar',
          'Tab Bar',
          'Floating Button',
          'Purchase Bar',
          'Dialog',
          'Analytics',
          'Flex Container',
          'Split Container',
        ])

      host.querySelector<HTMLElement>('[data-dc-node-id="shop-title"]')!.click()
      await nextTick()

      expect(host.querySelector('.dc-form-section__title')?.textContent).toBe('Content')
      expect(host.querySelector('.dc-form-field__label')?.textContent).toBe('Text content')
    }
    finally {
      app.unmount()
    }
  })

  it('preserves the tab bar array and color inspector controls', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    try {
      app.mount(host)
      await nextTick()

      host.querySelector<HTMLElement>('[data-dc-node-id="tabbar-main"]')!.click()
      await nextTick()

      expect(host.querySelectorAll('.playground-array-field__item')).toHaveLength(4)
      expect(host.querySelectorAll('.playground-color-field')).toHaveLength(3)

      host.querySelector<HTMLButtonElement>('.playground-array-field__add-button')!.click()
      await nextTick()

      expect(host.querySelectorAll('.playground-array-field__item')).toHaveLength(5)
      expect(host.querySelectorAll('.pg-widget-tabbar__item')).toHaveLength(5)
    }
    finally {
      app.unmount()
    }
  })

  it('preserves spacing controls and writes node style through the inspector', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    try {
      app.mount(host)
      await nextTick()

      const node = host.querySelector<HTMLElement>('[data-dc-node-id="shop-title"]')!
      node.click()
      await nextTick()

      const spacingFields = host.querySelectorAll('.playground-spacing-field')
      expect(spacingFields).toHaveLength(2)

      const marginTop = spacingFields[0]!.querySelector<HTMLInputElement>('input')!
      marginTop.focus()
      marginTop.value = '1'
      marginTop.dispatchEvent(new InputEvent('input', { bubbles: true, data: '1', inputType: 'insertText' }))
      await nextTick()

      expect(marginTop.value).toBe('1')
      const updatedNode = host.querySelector<HTMLElement>('[data-dc-node-id="shop-title"]')!
      expect(updatedNode.style.marginTop).toBe('1px')
      expect(updatedNode.style.marginRight).toBe('1px')
    }
    finally {
      app.unmount()
    }
  })
})
