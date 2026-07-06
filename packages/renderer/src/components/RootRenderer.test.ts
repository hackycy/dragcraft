// @vitest-environment happy-dom
import type { Component, PropType, VNode } from 'vue'
import { createEngine } from '@dragcraft/core'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'
import RootRenderer from './RootRenderer'

function mountRootRenderer(containerShell: Component) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const engine = createEngine()
  engine.store.setDragTarget({ sourceNodeId: null, widgetType: 'navbar' })

  const app = createApp(defineComponent({
    setup() {
      return () => h(RootRenderer, {
        engine,
        componentMap: {},
        extensions: { containerShell },
        dragOverNodeId: ref('root'),
        isForbidden: ref(true),
        forbiddenReason: ref({ message: '页面只能配置一个导航栏' }),
      })
    },
  }))
  app.mount(host)
  return { app, host }
}

describe('rootRenderer forbidden overlay', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders fallback overlay when a custom container shell ignores forbiddenOverlayVNode', () => {
    const LegacyShell = defineComponent({
      setup(_, { slots }) {
        return () => h('div', { class: 'legacy-shell' }, slots.default?.())
      },
    })

    const { app, host } = mountRootRenderer(LegacyShell)

    try {
      expect(host.querySelectorAll('.dc-forbidden-overlay')).toHaveLength(1)
      expect(host.querySelector('.dc-root-renderer > .dc-forbidden-overlay')).not.toBeNull()
      expect(host.querySelector('.legacy-shell .dc-forbidden-overlay')).toBeNull()
    }
    finally {
      app.unmount()
    }
  })

  it('does not render fallback overlay when a custom container shell handles forbiddenOverlayVNode', () => {
    const MarkedShell = defineComponent({
      props: {
        forbiddenOverlayVNode: {
          type: Object as PropType<VNode | null>,
          default: null,
        },
      },
      setup(props, { slots }) {
        return () => h('div', { class: 'marked-shell' }, [
          ...(slots.default?.() ?? []),
          props.forbiddenOverlayVNode,
        ])
      },
    }) as Component & { __dcHandlesForbiddenOverlay?: boolean }
    MarkedShell.__dcHandlesForbiddenOverlay = true

    const { app, host } = mountRootRenderer(MarkedShell)

    try {
      expect(host.querySelectorAll('.dc-forbidden-overlay')).toHaveLength(1)
      expect(host.querySelector('.marked-shell .dc-forbidden-overlay')).not.toBeNull()
      expect(host.querySelector('.dc-root-renderer > .dc-forbidden-overlay')).toBeNull()
    }
    finally {
      app.unmount()
    }
  })
})
