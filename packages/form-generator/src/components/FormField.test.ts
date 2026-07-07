// @vitest-environment happy-dom
import type { FieldComponentMap, FormSchema } from '../types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import FormGenerator from './FormGenerator'

const InputLike = defineComponent({
  name: 'InputLike',
  props: {
    value: { type: [String, Number], default: '' },
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    size: { type: String, default: '' },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        'class': 'input-like',
        'value': props.value,
        'disabled': props.disabled,
        'placeholder': props.placeholder,
        'data-size': props.size,
        'onInput': (event: Event) => emit('update:value', (event.target as HTMLInputElement).value),
      })
  },
})

const SwitchLike = defineComponent({
  name: 'SwitchLike',
  props: {
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:checked'],
  setup(props, { emit }) {
    return () =>
      h('button', {
        'class': 'switch-like',
        'disabled': props.disabled,
        'data-checked': String(props.checked),
        'onClick': () => emit('update:checked', !props.checked),
      })
  },
})

const fieldComponentMap: FieldComponentMap = {
  Input: {
    component: InputLike,
    modelPropName: 'value',
    updateEventName: 'onUpdate:value',
  },
  Switch: {
    component: SwitchLike,
    modelPropName: 'checked',
    updateEventName: 'onUpdate:checked',
  },
}

function mountForm(schema: FormSchema, values: Record<string, unknown>, props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const onChange = vi.fn()
  const app = createApp({
    render: () =>
      h(FormGenerator, {
        schema,
        values,
        fieldComponentMap,
        onChange,
        ...props,
      }),
  })
  app.mount(host)

  return { app, host, onChange }
}

describe('formField', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('passes static componentProps to the registered component', async () => {
    const schema: FormSchema = {
      sections: [{
        title: 'Basic',
        fields: [{
          key: 'name',
          label: 'Name',
          component: 'Input',
          componentProps: { placeholder: 'Enter name', size: 'small' },
        }],
      }],
    }
    const { app, host } = mountForm(schema, { name: 'Ada' })

    try {
      await nextTick()
      const input = host.querySelector<HTMLInputElement>('.input-like')

      expect(input?.value).toBe('Ada')
      expect(input?.placeholder).toBe('Enter name')
      expect(input?.dataset.size).toBe('small')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('passes dynamic componentProps to the registered component', async () => {
    const schema: FormSchema = {
      sections: [{
        title: 'Basic',
        fields: [{
          key: 'endpoint',
          label: 'Endpoint',
          component: 'Input',
          componentProps: ctx => ({
            placeholder: ctx.values.mode === 'api' ? 'Enter URL' : 'Enter value',
          }),
        }],
      }],
    }
    const { app, host } = mountForm(schema, { endpoint: '', mode: 'api' })

    try {
      await nextTick()
      const input = host.querySelector<HTMLInputElement>('.input-like')

      expect(input?.placeholder).toBe('Enter URL')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('uses modelPropName and updateEventName for value binding', async () => {
    const schema: FormSchema = {
      sections: [{
        title: 'Basic',
        fields: [{ key: 'name', label: 'Name', component: 'Input' }],
      }],
    }
    const { app, host, onChange } = mountForm(schema, { name: 'Ada' })

    try {
      await nextTick()
      const input = host.querySelector<HTMLInputElement>('.input-like')
      input!.value = 'Grace'
      input!.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()

      expect(onChange).toHaveBeenCalledWith({ key: 'name', value: 'Grace' })
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('supports checked model bindings', async () => {
    const schema: FormSchema = {
      sections: [{
        title: 'Basic',
        fields: [{ key: 'visible', label: 'Visible', component: 'Switch' }],
      }],
    }
    const { app, host, onChange } = mountForm(schema, { visible: false })

    try {
      await nextTick()
      const button = host.querySelector<HTMLButtonElement>('.switch-like')
      expect(button?.dataset.checked).toBe('false')

      button!.click()
      await nextTick()

      expect(onChange).toHaveBeenCalledWith({ key: 'visible', value: true })
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('overrides componentProps disabled with resolved form disabled state', async () => {
    const schema: FormSchema = {
      sections: [{
        title: 'Basic',
        fields: [{
          key: 'name',
          label: 'Name',
          component: 'Input',
          componentProps: { disabled: false },
        }],
      }],
    }
    const { app, host } = mountForm(schema, { name: 'Ada' }, { disabled: true })

    try {
      await nextTick()
      const input = host.querySelector<HTMLInputElement>('.input-like')

      expect(input?.disabled).toBe(true)
    }
    finally {
      app.unmount()
      host.remove()
    }
  })
})
