// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, shallowRef } from 'vue'
import App from './App.vue'

const testState = vi.hoisted(() => ({
  dispose: vi.fn(),
  importSchema: vi.fn(),
}))

vi.mock('@dragcraft/designer', () => ({
  DcDesigner: defineComponent(() => () => h('div')),
}))

vi.mock('@dragcraft/device-frames', () => ({
  BUILT_IN_DEVICE_FRAMES: [{ id: 'phone', containerShell: defineComponent(() => () => h('div')) }],
  DevicePicker: defineComponent(() => () => h('div')),
  IPHONE_DEVICE_FRAME: { id: 'phone', containerShell: defineComponent(() => () => h('div')) },
}))

vi.mock('./editor/create-page-designer', () => ({
  createPageDesigner: () => {
    const document = shallowRef({ status: 'ready', schema: { revision: 0 } })
    testState.importSchema.mockImplementation((schema) => {
      document.value = { status: 'ready', schema }
      return { status: 'ready' }
    })
    return {
      dispose: testState.dispose,
      document,
      execute: vi.fn(),
      exportSchema: () => document.value.schema,
      history: {
        canRedo: shallowRef(false),
        canUndo: shallowRef(false),
      },
      importSchema: testState.importSchema,
    }
  },
}))

vi.mock('./host/page-repository', () => ({
  createMemoryPageRepository: () => ({
    load: async () => ({
      id: 'summer-campaign',
      revision: 3,
      schema: { revision: 3 },
    }),
    save: vi.fn(),
  }),
  PageRevisionConflictError: class PageRevisionConflictError extends Error {},
}))

vi.mock('./runtime', () => ({
  guideRuntimeRegistry: {},
  RuntimePage: defineComponent(() => () => h('div')),
}))

describe('guide project host workflow', () => {
  afterEach(() => {
    document.body.textContent = ''
    vi.clearAllMocks()
  })

  it('keeps the loaded revision status after importing a draft', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp(App)
    app.mount(host)

    const reloadButton = Array.from(host.querySelectorAll('button'))
      .find(button => button.textContent === '加载草稿')
    reloadButton?.click()
    await Promise.resolve()
    await nextTick()

    expect(host.querySelector('.guide-project__header span')?.textContent)
      .toBe('已加载草稿修订号 3')

    app.unmount()
  })
})
