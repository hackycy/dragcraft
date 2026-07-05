import type { FieldComponentMap, FieldSchema } from '@dragcraft/form-generator'
import type { Component, PropType } from 'vue'
import { FORM_GENERATOR_CONTEXT_KEY } from '@dragcraft/form-generator'
import { useI18n } from '@dragcraft/utils'
import { Button, Collapse, Input, InputNumber, Select, Slider, Switch } from 'ant-design-vue'
import { computed, defineComponent, h, inject, ref } from 'vue'

interface SelectOption {
  label: string
  value: string | number | boolean
}

interface ArrayFieldConfig {
  itemFields?: FieldSchema[]
  minItems?: number
  maxItems?: number
  defaultItem?: Record<string, unknown>
  sortable?: boolean
}

interface NavbarTitleConfig {
  title?: string
  subtitle?: string
  titleFontSize?: number
  titleFontWeight?: string
}

const AButton = Button as unknown as Component
const ACollapse = Collapse as unknown as Component
const ACollapsePanel = Collapse.Panel as unknown as Component
const AInput = Input as unknown as Component
const AInputNumber = InputNumber as unknown as Component
const ASelect = Select as unknown as Component
const ASlider = Slider as unknown as Component
const ASwitch = Switch as unknown as Component
const ATextarea = Input.TextArea as unknown as Component

function getFieldProps(field: FieldSchema): Record<string, unknown> {
  return (field.props ?? {}) as Record<string, unknown>
}

function resolvePlaceholder(field: FieldSchema, t: ReturnType<typeof useI18n>['t']): string {
  const raw = (getFieldProps(field).placeholder as string) ?? ''
  return field.placeholderKey ? t(field.placeholderKey, raw) : raw
}

export const InputField = defineComponent({
  name: 'PlaygroundInputField',
  props: {
    modelValue: { type: [String, Number] as PropType<string | number>, default: '' },
    disabled: { type: Boolean, default: false },
    field: { type: Object as PropType<FieldSchema>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()

    return () =>
      h(AInput, {
        'value': props.modelValue ?? '',
        'disabled': props.disabled,
        'placeholder': resolvePlaceholder(props.field, t),
        'size': 'small',
        'allowClear': true,
        'onChange': (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
        'onUpdate:value': (value: string) => emit('update:modelValue', value),
      })
  },
})

export const NumberField = defineComponent({
  name: 'PlaygroundNumberField',
  props: {
    modelValue: { type: Number as PropType<number>, default: 0 },
    disabled: { type: Boolean, default: false },
    field: { type: Object as PropType<FieldSchema>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()

    return () => {
      const extra = getFieldProps(props.field)
      return h(AInputNumber, {
        'value': props.modelValue ?? 0,
        'disabled': props.disabled,
        'min': extra.min as number | undefined,
        'max': extra.max as number | undefined,
        'step': extra.step as number | undefined,
        'placeholder': resolvePlaceholder(props.field, t),
        'size': 'small',
        'style': { width: '100%' },
        'onUpdate:value': (value: number | null) => emit('update:modelValue', value ?? 0),
      })
    }
  },
})

export const TextareaField = defineComponent({
  name: 'PlaygroundTextareaField',
  props: {
    modelValue: { type: String as PropType<string>, default: '' },
    disabled: { type: Boolean, default: false },
    field: { type: Object as PropType<FieldSchema>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()

    return () => {
      const extra = getFieldProps(props.field)
      return h(ATextarea, {
        'value': props.modelValue ?? '',
        'disabled': props.disabled,
        'placeholder': resolvePlaceholder(props.field, t),
        'rows': (extra.rows as number) ?? 3,
        'size': 'small',
        'allowClear': true,
        'onChange': (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
        'onUpdate:value': (value: string) => emit('update:modelValue', value),
      })
    }
  },
})

export const SelectField = defineComponent({
  name: 'PlaygroundSelectField',
  props: {
    modelValue: { type: [String, Number, Boolean] as PropType<string | number | boolean>, default: '' },
    disabled: { type: Boolean, default: false },
    field: { type: Object as PropType<FieldSchema>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()

    return () => {
      const extra = getFieldProps(props.field)
      const optionPrefix = props.field.optionKeyPrefix
      const options = ((extra.options as SelectOption[] | undefined) ?? []).map(option => ({
        value: option.value,
        label: optionPrefix ? t(`${optionPrefix}.${option.value}`, option.label) : option.label,
      }))

      return h(ASelect, {
        'value': props.modelValue ?? '',
        'disabled': props.disabled,
        'placeholder': resolvePlaceholder(props.field, t),
        options,
        'size': 'small',
        'style': { width: '100%' },
        'onUpdate:value': (value: string | number | boolean) => emit('update:modelValue', value),
      })
    }
  },
})

export const SwitchField = defineComponent({
  name: 'PlaygroundSwitchField',
  props: {
    modelValue: { type: Boolean as PropType<boolean>, default: false },
    disabled: { type: Boolean, default: false },
    field: { type: Object as PropType<FieldSchema>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h(ASwitch, {
        'checked': props.modelValue ?? false,
        'disabled': props.disabled,
        'size': 'small',
        'onUpdate:checked': (checked: unknown) => emit('update:modelValue', checked === true),
      })
  },
})

export const ColorField = defineComponent({
  name: 'PlaygroundColorField',
  props: {
    modelValue: { type: String as PropType<string>, default: '#000000' },
    disabled: { type: Boolean, default: false },
    field: { type: Object as PropType<FieldSchema>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'playground-color-field' }, [
        h('input', {
          class: 'playground-color-field__swatch',
          type: 'color',
          value: props.modelValue || '#000000',
          disabled: props.disabled,
          onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
        }),
        h(AInput, {
          'value': props.modelValue || '#000000',
          'disabled': props.disabled,
          'size': 'small',
          'onUpdate:value': (value: string) => emit('update:modelValue', value),
        }),
      ])
  },
})

export const SliderField = defineComponent({
  name: 'PlaygroundSliderField',
  props: {
    modelValue: { type: Number as PropType<number>, default: 0 },
    disabled: { type: Boolean, default: false },
    field: { type: Object as PropType<FieldSchema>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => {
      const extra = getFieldProps(props.field)
      return h('div', { class: 'playground-field-slider' }, [
        h(ASlider, {
          'value': props.modelValue ?? 0,
          'disabled': props.disabled,
          'min': (extra.min as number) ?? 0,
          'max': (extra.max as number) ?? 100,
          'step': (extra.step as number) ?? 1,
          'onUpdate:value': (value: unknown) => emit('update:modelValue', typeof value === 'number' ? value : props.modelValue),
        }),
        h('span', { class: 'playground-field-slider__value' }, String(props.modelValue ?? 0)),
      ])
    }
  },
})

export const ArrayField = defineComponent({
  name: 'PlaygroundArrayField',
  props: {
    modelValue: { type: Array as PropType<Array<Record<string, unknown>>>, default: () => [] },
    disabled: { type: Boolean, default: false },
    field: { type: Object as PropType<FieldSchema>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const ctx = inject(FORM_GENERATOR_CONTEXT_KEY, null)
    const activeKeys = ref<string[]>(['0'])
    const fieldComponentMap = computed<FieldComponentMap>(() => ctx?.fieldComponentMap ?? {})
    const config = computed(() => getFieldProps(props.field) as unknown as ArrayFieldConfig)
    const items = computed(() => props.modelValue ?? [])
    const canAdd = computed(() => config.value.maxItems === undefined || items.value.length < config.value.maxItems)
    const canRemove = computed(() => items.value.length > (config.value.minItems ?? 0))

    const updateItems = (nextItems: Array<Record<string, unknown>>) => {
      emit('update:modelValue', nextItems)
    }

    const addItem = () => {
      if (!canAdd.value)
        return
      updateItems([...items.value, { ...(config.value.defaultItem ?? {}) }])
      activeKeys.value = [String(items.value.length)]
    }

    const removeItem = (index: number) => {
      if (!canRemove.value)
        return
      updateItems(items.value.filter((_, itemIndex) => itemIndex !== index))
    }

    const moveItem = (index: number, offset: -1 | 1) => {
      const target = index + offset
      if (target < 0 || target >= items.value.length)
        return
      const nextItems = [...items.value]
      const [item] = nextItems.splice(index, 1)
      nextItems.splice(target, 0, item)
      updateItems(nextItems)
      activeKeys.value = [String(target)]
    }

    const updateItem = (index: number, key: string, value: unknown) => {
      const nextItems = [...items.value]
      nextItems[index] = { ...nextItems[index], [key]: value }
      updateItems(nextItems)
    }

    const renderItemField = (item: Record<string, unknown>, index: number, field: FieldSchema) => {
      const FieldComponent = fieldComponentMap.value[field.component]
      const control = FieldComponent
        ? h(FieldComponent, {
            'modelValue': item[field.key] ?? '',
            'disabled': props.disabled,
            'field': { ...field, props: getFieldProps(field) },
            'onUpdate:modelValue': (value: unknown) => updateItem(index, field.key, value),
          })
        : h(AInput, {
            'value': item[field.key] ?? '',
            'disabled': props.disabled,
            'size': 'small',
            'onUpdate:value': (value: string) => updateItem(index, field.key, value),
          })

      return h('div', { class: 'playground-array-field__field', key: field.key }, [
        h('span', { class: 'playground-array-field__label' }, field.label),
        control,
      ])
    }

    return () => {
      const itemFields = config.value.itemFields ?? []
      const sortable = config.value.sortable ?? false
      const panels = items.value.map((item, index) => {
        const title = String(item.label ?? item.name ?? item.title ?? `Item ${index + 1}`)
        const header = h('div', { class: 'playground-array-field__header' }, [
          h('span', { class: 'playground-array-field__title' }, title),
          h('div', { class: 'playground-array-field__actions' }, [
            sortable
              ? h(AButton, {
                  disabled: props.disabled || index === 0,
                  size: 'small',
                  type: 'text',
                  onClick: (event: MouseEvent) => {
                    event.stopPropagation()
                    moveItem(index, -1)
                  },
                }, () => 'Up')
              : null,
            sortable
              ? h(AButton, {
                  disabled: props.disabled || index === items.value.length - 1,
                  size: 'small',
                  type: 'text',
                  onClick: (event: MouseEvent) => {
                    event.stopPropagation()
                    moveItem(index, 1)
                  },
                }, () => 'Down')
              : null,
            h(AButton, {
              disabled: props.disabled || !canRemove.value,
              size: 'small',
              danger: true,
              type: 'text',
              onClick: (event: MouseEvent) => {
                event.stopPropagation()
                removeItem(index)
              },
            }, () => 'Remove'),
          ]),
        ])

        return h(ACollapsePanel, { key: String(index), header }, () =>
          h('div', { class: 'playground-array-field__body' }, itemFields.map(field => renderItemField(item, index, field))))
      })

      return h('div', { class: 'playground-array-field' }, [
        items.value.length > 0
          ? h(ACollapse, {
              'activeKey': activeKeys.value,
              'size': 'small',
              'ghost': true,
              'onUpdate:activeKey': (value: unknown) => {
                activeKeys.value = (Array.isArray(value) ? value : [value]).map(String)
              },
            }, () => panels)
          : h('div', { class: 'playground-array-field__empty' }, 'No items'),
        h(AButton, {
          block: true,
          disabled: props.disabled || !canAdd.value,
          size: 'small',
          type: 'dashed',
          onClick: addItem,
        }, () => 'Add item'),
      ])
    }
  },
})

export const NavbarTitleField = defineComponent({
  name: 'PlaygroundNavbarTitleField',
  props: {
    modelValue: {
      type: Object as PropType<NavbarTitleConfig>,
      default: () => ({ title: '页面标题', subtitle: '', titleFontSize: 16, titleFontWeight: '600' }),
    },
    disabled: { type: Boolean, default: false },
    field: { type: Object as PropType<FieldSchema>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const config = computed(() => props.modelValue ?? {})
    const updateField = (key: keyof NavbarTitleConfig, value: unknown) => {
      emit('update:modelValue', { ...config.value, [key]: value })
    }

    return () => {
      const title = config.value.title || '页面标题'
      const subtitle = config.value.subtitle || ''
      const titleFontSize = config.value.titleFontSize ?? 16
      const titleFontWeight = config.value.titleFontWeight ?? '600'

      return h('div', { class: 'playground-navbar-title-field' }, [
        h('div', { class: 'playground-navbar-title-field__preview' }, [
          h('div', {
            class: 'playground-navbar-title-field__preview-title',
            style: { fontSize: `${titleFontSize}px`, fontWeight: titleFontWeight },
          }, title),
          subtitle ? h('div', { class: 'playground-navbar-title-field__preview-subtitle' }, subtitle) : null,
        ]),
        h('div', { class: 'playground-navbar-title-field__controls' }, [
          h(AInput, {
            'value': title,
            'disabled': props.disabled,
            'placeholder': '请输入标题',
            'size': 'small',
            'onUpdate:value': (value: string) => updateField('title', value),
          }),
          h(AInput, {
            'value': subtitle,
            'disabled': props.disabled,
            'placeholder': '请输入副标题',
            'size': 'small',
            'allowClear': true,
            'onUpdate:value': (value: string) => updateField('subtitle', value),
          }),
          h('div', { class: 'playground-navbar-title-field__row' }, [
            h('span', null, `字号 ${titleFontSize}px`),
            h(ASlider, {
              'value': titleFontSize,
              'min': 12,
              'max': 24,
              'disabled': props.disabled,
              'style': { flex: 1 },
              'onUpdate:value': (value: unknown) => {
                if (typeof value === 'number')
                  updateField('titleFontSize', value)
              },
            }),
          ]),
          h(ASelect, {
            'value': titleFontWeight,
            'disabled': props.disabled,
            'size': 'small',
            'options': [
              { label: '常规', value: '400' },
              { label: '中等', value: '500' },
              { label: '粗体', value: '600' },
            ],
            'onUpdate:value': (value: string) => updateField('titleFontWeight', value),
          }),
        ]),
      ])
    }
  },
})

export function buildPlaygroundFieldComponentMap(): FieldComponentMap {
  return {
    'input': InputField,
    'number': NumberField,
    'textarea': TextareaField,
    'select': SelectField,
    'switch': SwitchField,
    'color': ColorField,
    'slider': SliderField,
    'array': ArrayField,
    'navbar-title': NavbarTitleField,
  }
}
