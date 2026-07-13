// @vitest-environment happy-dom
import type { Component } from 'vue'
import { createEngine } from '@dragcraft/core'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import ContainerRegionOutlet from './ContainerRegionOutlet'
import RootRenderer from './RootRenderer'

const SplitMaterial = defineComponent({
  setup() {
    return () => h('section', { class: 'external-split' }, [
      h(ContainerRegionOutlet, {
        'regionId': 'left',
        'class': 'material-left',
        'style': { minHeight: '24px' },
        'aria-label': 'Custom left region',
      }),
      h(ContainerRegionOutlet, { regionId: 'right', as: 'aside' }),
    ])
  },
})

function mountExternalSplit() {
  const left = { id: 'left-child', type: 'text', props: { text: 'Left' } }
  const right = { id: 'right-child', type: 'text', props: { text: 'Right' } }
  const engine = createEngine({
    initialSchema: {
      version: '1.0.0',
      globalConfig: {},
      root: {
        id: 'root',
        type: 'root',
        props: {},
        children: [{
          id: 'layout',
          type: 'split-layout',
          props: {},
          container: { variant: 'split', regions: { left: [left], right: [right] } },
        }],
      },
    },
  })
  engine.registerWidget({
    type: 'split-layout',
    title: 'Split layout',
    group: 'layout',
    defaultProps: {},
    formSchema: { sections: [] },
    container: {
      defaultVariant: 'split',
      variants: {
        split: {
          title: 'Split',
          regions: [
            { id: 'left', title: 'Left region' },
            { id: 'right', title: 'Right region' },
          ],
        },
      },
    },
  })
  engine.registerWidget({
    type: 'text',
    title: 'Text',
    group: 'content',
    defaultProps: {},
    formSchema: { sections: [] },
    mask: false,
  })

  const TextMaterial = defineComponent({
    props: { text: String },
    setup(props) {
      return () => h('p', { class: 'text-material' }, props.text)
    },
  })
  const componentMap: Record<string, Component> = {
    'split-layout': SplitMaterial,
    'text': TextMaterial,
  }
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent({
    setup() {
      return () => h(RootRenderer, { engine, componentMap })
    },
  }))
  app.mount(host)
  return { app, engine, host }
}

describe('containerRegionOutlet', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders each nested widget exactly once through its owner outlet', async () => {
    const { app, host } = mountExternalSplit()
    try {
      await nextTick()

      expect(host.querySelectorAll('[data-node-id="left-child"]')).toHaveLength(1)
      expect(host.querySelectorAll('[data-node-id="right-child"]')).toHaveLength(1)
      expect(host.querySelector('[data-dc-container-region="left"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-container-region="right"]')?.tagName).toBe('ASIDE')
    }
    finally {
      app.unmount()
    }
  })

  it('forwards material-owned DOM attributes without adding layout styles', () => {
    const { app, host } = mountExternalSplit()
    try {
      const outlet = host.querySelector<HTMLElement>('[data-dc-container-region="left"]')
      expect(outlet?.classList.contains('dc-container-region')).toBe(true)
      expect(outlet?.classList.contains('material-left')).toBe(true)
      expect(outlet?.style.minHeight).toBe('24px')
      expect(outlet?.getAttribute('data-dc-container-id')).toBe('layout')
      expect(outlet?.getAttribute('role')).toBe('group')
      expect(outlet?.getAttribute('aria-label')).toBe('Custom left region')
      expect(outlet?.style.display).toBe('')
      expect(outlet?.style.flexDirection).toBe('')
      expect(outlet?.style.gridTemplateColumns).toBe('')
      expect(outlet?.style.gap).toBe('')
      expect(outlet?.style.width).toBe('')
      expect(outlet?.style.height).toBe('')
    }
    finally {
      app.unmount()
    }
  })
})
