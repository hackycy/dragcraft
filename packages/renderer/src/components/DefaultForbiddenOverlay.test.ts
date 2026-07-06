// @vitest-environment happy-dom
import { createI18n, I18N_KEY } from '@dragcraft/utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, provide } from 'vue'
import { rendererMessages } from '../messages'
import DefaultForbiddenOverlay from './DefaultForbiddenOverlay'

function mountOverlay(reason?: { messageKey?: string, message?: string }) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const i18n = createI18n('zh-CN', rendererMessages)
  i18n.mergeMessages('zh-CN', {
    forbidden: {
      customReason: '页面只能配置一个导航栏',
    },
  })

  const app = createApp(defineComponent({
    setup() {
      provide(I18N_KEY, i18n)
      return () => h(DefaultForbiddenOverlay, {
        widgetType: 'navbar',
        reason: reason ?? null,
      })
    },
  }))
  app.mount(host)
  return { app, host }
}

describe('defaultForbiddenOverlay', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders default forbidden reason when none is provided', () => {
    const { app, host } = mountOverlay()

    try {
      expect(host.querySelector('.dc-forbidden-overlay__text')?.textContent).toBe('当前物料不满足创建条件，无法添加到画布')
    }
    finally {
      app.unmount()
    }
  })

  it('renders localized reason from messageKey with message fallback', () => {
    const { app, host } = mountOverlay({
      messageKey: 'forbidden.customReason',
      message: 'Only one navigation bar is allowed',
    })

    try {
      expect(host.querySelector('.dc-forbidden-overlay__text')?.textContent).toBe('页面只能配置一个导航栏')
    }
    finally {
      app.unmount()
    }
  })
})
