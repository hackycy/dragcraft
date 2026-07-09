// @vitest-environment happy-dom
import type { FieldComponentMap, FormSchema } from '../types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, reactive, ref } from 'vue'
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

const DisplayLike = defineComponent({
  name: 'DisplayLike',
  props: {
    modelValue: { type: null, default: undefined },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props) {
    return () =>
      h('div', {
        'class': 'display-like',
        'data-value': props.modelValue === null ? 'null' : String(props.modelValue),
        'data-disabled': String(props.disabled),
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
  Display: {
    component: DisplayLike,
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

  it('reacts when a schema replaces a field object with the same key', async () => {
    const schemaRef = ref<FormSchema>({
      sections: [{
        title: 'Basic',
        fields: [{
          key: 'name',
          label: 'Name',
          component: 'Input',
          componentProps: { placeholder: 'Old placeholder' },
        }],
      }],
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () =>
        h(FormGenerator, {
          schema: schemaRef.value,
          values: { name: 'Ada' },
          fieldComponentMap,
        }),
    })
    app.mount(host)

    try {
      await nextTick()
      expect(host.querySelector<HTMLInputElement>('.input-like')?.placeholder).toBe('Old placeholder')

      schemaRef.value = {
        sections: [{
          title: 'Basic',
          fields: [{
            key: 'name',
            label: 'Full name',
            component: 'Input',
            componentProps: { placeholder: 'New placeholder' },
          }],
        }],
      }
      await nextTick()

      expect(host.querySelector<HTMLInputElement>('.input-like')?.placeholder).toBe('New placeholder')
      expect(host.querySelector('.dc-form-field__label')?.textContent).toBe('Full name')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('syncs in-place parent value mutations into rendered controls', async () => {
    const schema: FormSchema = {
      sections: [{
        title: 'Basic',
        fields: [{ key: 'name', label: 'Name', component: 'Input' }],
      }],
    }
    const values = reactive({ name: 'Ada' })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () =>
        h(FormGenerator, {
          schema,
          values,
          fieldComponentMap,
        }),
    })
    app.mount(host)

    try {
      await nextTick()
      expect(host.querySelector<HTMLInputElement>('.input-like')?.value).toBe('Ada')

      values.name = 'Grace'
      await nextTick()

      expect(host.querySelector<HTMLInputElement>('.input-like')?.value).toBe('Grace')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('does not validate fields hidden from the generated form', async () => {
    const schema: FormSchema = {
      sections: [{
        title: 'Basic',
        fields: [{
          key: 'secret',
          label: 'Secret',
          component: 'Input',
          ifShow: false,
          rules: [{ required: true, message: 'Secret required' }],
        }],
      }],
    }
    const formRef = ref<{ validate: () => Array<{ key: string, message: string }> }>()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () =>
        h(FormGenerator, {
          ref: formRef,
          schema,
          values: { secret: '' },
          fieldComponentMap,
        }),
    })
    app.mount(host)

    try {
      await nextTick()
      expect(formRef.value?.validate()).toEqual([])
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('revalidates fields that depend on a changed controller field', async () => {
    const schema: FormSchema = {
      sections: [{
        title: 'Basic',
        fields: [
          { key: 'enabled', label: 'Enabled', component: 'Switch' },
          {
            key: 'endpoint',
            label: 'Endpoint',
            component: 'Input',
            dependencies: {
              fields: ['enabled'],
              handler: form => ({
                rules: form.enabled ? [{ required: true, message: 'Endpoint required' }] : [],
              }),
            },
          },
        ],
      }],
    }
    const formRef = ref<{ validate: () => Array<{ key: string, message: string }> }>()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () =>
        h(FormGenerator, {
          ref: formRef,
          schema,
          values: { enabled: true, endpoint: '' },
          fieldComponentMap,
        }),
    })
    app.mount(host)

    try {
      await nextTick()
      expect(formRef.value?.validate()).toEqual([{ key: 'endpoint', message: 'Endpoint required' }])
      await nextTick()
      expect(host.querySelector('.dc-form-field__error')?.textContent).toBe('Endpoint required')

      host.querySelector<HTMLButtonElement>('.switch-like')!.click()
      await nextTick()

      expect(host.querySelector('.dc-form-field__error')).toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('preserves null values instead of replacing them with defaultValue', async () => {
    const schema: FormSchema = {
      sections: [{
        title: 'Basic',
        fields: [{
          key: 'choice',
          label: 'Choice',
          component: 'Display',
          defaultValue: 'fallback',
        }],
      }],
    }
    const { app, host } = mountForm(schema, { choice: null })

    try {
      await nextTick()
      expect(host.querySelector<HTMLElement>('.display-like')?.dataset.value).toBe('null')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })
})
