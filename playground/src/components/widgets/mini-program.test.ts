import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { playgroundNextMaterials } from '../../config/next-fixtures'
import { templateRegistry } from '../../config/templates'
import { NavbarWidget } from './mini-program'
// @vitest-environment happy-dom

describe('navbar material', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('declares title-only schema data and a Frame presentation', () => {
    const navbar = playgroundNextMaterials.find(material => material.type === 'navbar')!
    const tabBar = playgroundNextMaterials.find(material => material.type === 'tab-bar')!

    expect(navbar.schema?.defaultProps).toEqual({ title: '页面标题' })
    expect(navbar.authoring?.policy?.duplicate).toBe('denied')
    expect(navbar.presentation).toMatchObject({ kind: 'visual', frame: expect.anything() })
    expect(navbar.inspector?.formSchema?.sections[0].fields.map(field => field.key)).toEqual(['title'])
    expect(tabBar.authoring?.policy?.duplicate).toBe('denied')
    expect(tabBar.inspector?.formSchema?.sections.at(-1)?.title).toBe('内容样式')
  })

  it('supplies title-only navbar nodes through every built-in template', () => {
    for (const template of templateRegistry) {
      const navbar = template.schema.nodes.find(node => node.type === 'navbar')

      expect(navbar, template.id).toBeDefined()
      expect(Object.keys(navbar!.props), template.id).toEqual(['title'])
      expect(navbar!.style, template.id).toBeUndefined()
    }
  })

  it('renders a centered title and the static mini-program capsule', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(defineComponent({
      setup: () => () => h(NavbarWidget, { title: '测试标题' }),
    }))

    try {
      app.mount(host)
      await nextTick()

      expect(host.querySelector('.pg-widget-navbar__title')?.textContent).toBe('测试标题')
      expect(host.querySelector('.pg-widget-navbar__capsule')?.getAttribute('aria-hidden')).toBe('true')
      expect(host.querySelector('.pg-widget-navbar__capsule-more')).not.toBeNull()
      expect(host.querySelector('.pg-widget-navbar__capsule-divider')).not.toBeNull()
      expect(host.querySelector('.pg-widget-navbar__capsule-circle')).not.toBeNull()
      expect(host.querySelector('.pg-widget-navbar__back')).toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })
})
