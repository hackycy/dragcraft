import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { templateRegistry } from '../../config/templates'
// @vitest-environment happy-dom
import { isMaterialVisible } from './contract'
import { playgroundWidgetFixtures } from './index'
import { NavbarWidget } from './mini-program'

describe('schema-managed navbar example', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps the navbar out of materials with title-only configuration', () => {
    const navbar = playgroundWidgetFixtures.find(definition => definition.meta.type === 'navbar')!
    const tabBar = playgroundWidgetFixtures.find(definition => definition.meta.type === 'tab-bar')!

    expect(navbar.meta.authoring).toBe('schema-managed')
    expect(isMaterialVisible(navbar.meta)).toBe(false)
    expect(navbar.meta.defaultProps).toEqual({ title: '页面标题' })
    expect(navbar.meta.creatable).toBeUndefined()
    expect(navbar.meta.draggable).toBeUndefined()
    expect(navbar.meta.sortable).toBeUndefined()
    expect(navbar.meta.formSchema.sections).toHaveLength(1)
    expect(navbar.meta.formSchema.sections[0].fields.map((field: any) => field.key)).toEqual(['title'])
    expect(tabBar.meta.formSchema.sections.at(-1)?.titleKey).toBe('field.spacing.sectionTitle')
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
