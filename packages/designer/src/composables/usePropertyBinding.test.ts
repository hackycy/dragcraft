// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createDesigner, DcDesigner } from '../index'

const InputField = defineComponent({
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('input', {
      'data-test-input': '',
      'value': props.modelValue,
      'onInput': (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
    })
  },
})

describe('workbench property binding', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('writes global config through update-global-config', async () => {
    const designer = createDesigner({
      materials: [],
      schema: {
        version: '1',
        globalConfig: { theme: 'light' },
        page: { props: {} },
        nodes: [],
        structure: { root: [], containers: {} },
      },
      fieldComponentMap: { Input: { component: InputField } },
      globalConfigSchema: {
        sections: [{ title: 'Global', fields: [{ key: 'theme', label: 'Theme', component: 'Input' }] }],
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    try {
      app.mount(host)
      await nextTick()
      const input = host.querySelector<HTMLInputElement>('[data-test-input]')!
      input.value = 'dark'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      expect(designer.exportSchema()?.globalConfig).toEqual({ theme: 'dark' })
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })
})
