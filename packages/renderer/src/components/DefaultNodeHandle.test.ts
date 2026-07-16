// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'
import DefaultNodeHandle from './DefaultNodeHandle'

describe('defaultNodeHandle', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a semantic selection button with the component focus icon', () => {
    const onSelect = vi.fn()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(DefaultNodeHandle, {
        nodeId: 'layout',
        nodeType: 'split-layout',
        owner: { kind: 'root' },
        onSelect,
      }),
    })

    try {
      app.mount(host)
      const button = host.querySelector<HTMLButtonElement>('.dc-node__handle')
      expect(button?.tagName).toBe('BUTTON')
      expect(button?.type).toBe('button')
      expect(button?.getAttribute('aria-label')).toBe('选中组件')
      expect(button?.title).toBe('选中组件')
      expect(button?.querySelector('.dc-node__handle-surface')).not.toBeNull()
      expect(button?.querySelector('.dc-node__handle-icon svg')?.getAttribute('width')).toBe('12')

      button?.click()
      expect(onSelect).toHaveBeenCalledOnce()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })
})
