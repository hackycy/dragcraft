import type { FieldComponentMap, FieldSchema, FormContext } from '@dragcraft/form-generator'
import type { Component, PropType } from 'vue'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'
import { FORM_GENERATOR_CONTEXT_KEY, resolveFieldComponentProps } from '@dragcraft/form-generator'
import { useI18n } from '@dragcraft/i18n'
import { IconArrowDown, IconArrowUp, IconDelete, IconPlus } from '@dragcraft/icons'
import { Button, Input, InputNumber, Select, Slider } from 'ant-design-vue'
import { computed, defineComponent, h, inject, ref } from 'vue'

interface ArrayFieldConfig {
  itemFields?: FieldSchema[]
  title?: string
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

type SpacingType = 'margin' | 'padding'

type SpacingEdge = 'Top' | 'Right' | 'Bottom' | 'Left'

const AButton = Button as unknown as Component
const AInput = Input as unknown as Component
const AInputNumber = InputNumber as unknown as Component
const ASelect = Select as unknown as Component
const ASlider = Slider as unknown as Component

const SPACING_EDGES: Array<{ edge: SpacingEdge, labelKey: string, label: string }> = [
  { edge: 'Top', labelKey: 'field.spacing.top', label: '上' },
  { edge: 'Right', labelKey: 'field.spacing.right', label: '右' },
  { edge: 'Bottom', labelKey: 'field.spacing.bottom', label: '下' },
  { edge: 'Left', labelKey: 'field.spacing.left', label: '左' },
]

export const ColorField = defineComponent({
  name: 'PlaygroundColorField',
  props: {
    modelValue: { type: String as PropType<string>, default: '#000000' },
    disabled: { type: Boolean, default: false },
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

export const SpacingField = defineComponent({
  name: 'PlaygroundSpacingField',
  props: {
    modelValue: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
    disabled: { type: Boolean, default: false },
    type: { type: String as PropType<SpacingType>, default: 'margin' },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 120 },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const linked = ref(true)
    const style = computed(() => props.modelValue ?? {})
    const styleKey = (edge: SpacingEdge) => `${props.type}${edge}`
    const getValue = (edge: SpacingEdge) => {
      const value = style.value[styleKey(edge)]
      if (typeof value === 'number')
        return value
      if (typeof value === 'string') {
        const parsed = Number.parseFloat(value)
        return Number.isNaN(parsed) ? 0 : parsed
      }
      return 0
    }
    const updateEdge = (edge: SpacingEdge, value: number | null) => {
      const nextValue = value ?? 0
      const patch = linked.value
        ? Object.fromEntries(SPACING_EDGES.map(item => [styleKey(item.edge), nextValue]))
        : { [styleKey(edge)]: nextValue }
      emit('update:modelValue', { ...style.value, ...patch })
    }

    return () => h('div', { class: 'playground-spacing-field' }, [
      h('div', { class: 'playground-spacing-field__inputs' }, SPACING_EDGES.map(({ edge, labelKey, label }) =>
        h('label', { class: 'playground-spacing-field__input', key: edge }, [
          h('span', null, t(labelKey, label)),
          h(AInputNumber, {
            'value': getValue(edge),
            'disabled': props.disabled,
            'min': props.min,
            'max': props.max,
            'precision': 0,
            'size': 'small',
            'onUpdate:value': (value: number | null) => updateEdge(edge, value),
          }),
        ]),
      )),
      h(AButton, {
        'aria-label': linked.value
          ? t('field.spacing.unlink', '取消联动')
          : t('field.spacing.link', '启用联动'),
        'class': [
          'playground-spacing-field__link',
          { 'playground-spacing-field__link--active': linked.value },
        ],
        'disabled': props.disabled,
        'size': 'small',
        'title': linked.value
          ? t('field.spacing.unlink', '取消联动')
          : t('field.spacing.link', '启用联动'),
        'type': linked.value ? 'primary' : 'default',
        'onClick': () => {
          linked.value = !linked.value
        },
      }, () => t('field.spacing.linked', '联动')),
    ])
  },
})

export const ArrayField = defineComponent({
  name: 'PlaygroundArrayField',
  props: {
    modelValue: { type: Array as PropType<Array<Record<string, unknown>>>, default: () => [] },
    disabled: { type: Boolean, default: false },
    itemFields: { type: Array as PropType<FieldSchema[]>, default: () => [] },
    title: { type: String, default: '列表项目' },
    minItems: { type: Number, default: undefined },
    maxItems: { type: Number, default: undefined },
    defaultItem: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
    sortable: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const ctx = inject(FORM_GENERATOR_CONTEXT_KEY, null)
    const expandedKeys = ref<string[]>(['0'])
    const fieldComponentMap = computed<FieldComponentMap>(() => ctx?.fieldComponentMap ?? {})
    const config = computed<ArrayFieldConfig>(() => ({
      itemFields: props.itemFields,
      title: props.title,
      minItems: props.minItems,
      maxItems: props.maxItems,
      defaultItem: props.defaultItem,
      sortable: props.sortable,
    }))
    const items = computed(() => props.modelValue ?? [])
    const canAdd = computed(() => config.value.maxItems === undefined || items.value.length < config.value.maxItems)
    const canRemove = computed(() => items.value.length > (config.value.minItems ?? 0))
    const itemCountText = computed(() => {
      const max = config.value.maxItems
      return max === undefined ? `${items.value.length}` : `${items.value.length}/${max}`
    })

    const updateItems = (nextItems: Array<Record<string, unknown>>) => {
      emit('update:modelValue', nextItems)
    }

    const addItem = () => {
      if (!canAdd.value)
        return
      updateItems([...items.value, { ...(config.value.defaultItem ?? {}) }])
      expandedKeys.value = [String(items.value.length)]
    }

    const removeItem = (index: number) => {
      if (!canRemove.value)
        return
      updateItems(items.value.filter((_, itemIndex) => itemIndex !== index))
      expandedKeys.value = expandedKeys.value
        .map(key => Number(key))
        .filter(itemIndex => itemIndex !== index)
        .map(itemIndex => String(itemIndex > index ? itemIndex - 1 : itemIndex))
    }

    const moveItem = (index: number, offset: -1 | 1) => {
      const target = index + offset
      if (target < 0 || target >= items.value.length)
        return
      const nextItems = [...items.value]
      const [item] = nextItems.splice(index, 1)
      nextItems.splice(target, 0, item)
      updateItems(nextItems)
      expandedKeys.value = [String(target)]
    }

    const updateItem = (index: number, key: string, value: unknown) => {
      const nextItems = [...items.value]
      nextItems[index] = { ...nextItems[index], [key]: value }
      updateItems(nextItems)
    }

    const isExpanded = (index: number) => expandedKeys.value.includes(String(index))

    const toggleItem = (index: number) => {
      const key = String(index)
      expandedKeys.value = expandedKeys.value.includes(key)
        ? expandedKeys.value.filter(item => item !== key)
        : [...expandedKeys.value, key]
    }

    const renderItemField = (item: Record<string, unknown>, index: number, field: FieldSchema) => {
      const definition = typeof field.component === 'string'
        ? fieldComponentMap.value[field.component]
        : undefined
      const rawValue = item[field.key] ?? field.defaultValue
      const formCtx: FormContext = { values: item }
      const schemaValue = field.valueFormat?.(rawValue, formCtx) ?? rawValue
      const transformCtx = { field, values: item }
      const currentValue = definition?.formatValue?.(schemaValue, transformCtx) ?? schemaValue

      const control = definition
        ? h(definition.component, {
            ...definition.defaultProps,
            ...resolveFieldComponentProps(field, formCtx, t),
            disabled: props.disabled,
            [definition.modelPropName ?? 'modelValue']: currentValue,
            [definition.updateEventName ?? 'onUpdate:modelValue']: (value: unknown) => {
              const normalized = definition.normalizeValue?.(value, transformCtx) ?? value
              const transformed = field.parseValue?.(normalized, formCtx) ?? normalized
              updateItem(index, field.key, transformed)
            },
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

    const renderIconButton = (
      label: string,
      icon: Component,
      onClick: (event: MouseEvent) => void,
      disabled = false,
      danger = false,
    ) =>
      h(AButton, {
        'aria-label': label,
        'class': 'playground-array-field__icon-button',
        'danger': danger,
        'disabled': disabled,
        'shape': 'circle',
        'size': 'small',
        'title': label,
        'type': 'text',
        onClick,
      }, () => h(icon, { size: 14, color: 'currentColor' }))

    return () => {
      const itemFields = config.value.itemFields ?? []
      const sortable = config.value.sortable ?? false
      const cards = items.value.map((item, index) => {
        const title = String(item.label ?? item.name ?? item.title ?? `Item ${index + 1}`)
        const expanded = isExpanded(index)

        return h('div', {
          class: [
            'playground-array-field__item',
            { 'playground-array-field__item--expanded': expanded },
          ],
          key: index,
        }, [
          h('div', {
            class: 'playground-array-field__header',
            onClick: () => toggleItem(index),
          }, [
            h('span', { class: 'playground-array-field__index' }, String(index + 1).padStart(2, '0')),
            h('div', { class: 'playground-array-field__title-wrap' }, [
              h('span', { class: 'playground-array-field__title' }, title),
              h('span', { class: 'playground-array-field__meta' }, expanded
                ? t('field.array.editing', '编辑中')
                : t('field.array.collapsed', '点击编辑')),
            ]),
            h('div', { class: 'playground-array-field__actions' }, [
              sortable
                ? renderIconButton(t('field.array.moveUp', '上移'), IconArrowUp, (event: MouseEvent) => {
                    event.stopPropagation()
                    moveItem(index, -1)
                  }, props.disabled || index === 0)
                : null,
              sortable
                ? renderIconButton(t('field.array.moveDown', '下移'), IconArrowDown, (event: MouseEvent) => {
                    event.stopPropagation()
                    moveItem(index, 1)
                  }, props.disabled || index === items.value.length - 1)
                : null,
              renderIconButton(t('field.array.remove', '删除'), IconDelete, (event: MouseEvent) => {
                event.stopPropagation()
                removeItem(index)
              }, props.disabled || !canRemove.value, true),
              h('span', {
                class: [
                  'playground-array-field__chevron',
                  { 'playground-array-field__chevron--expanded': expanded },
                ],
              }),
            ]),
          ]),
          expanded
            ? h('div', { class: 'playground-array-field__body' }, itemFields.map(field => renderItemField(item, index, field)))
            : null,
        ])
      })

      return h('div', { class: 'playground-array-field' }, [
        h('div', { class: 'playground-array-field__toolbar' }, [
          h('div', { class: 'playground-array-field__summary' }, [
            h('span', { class: 'playground-array-field__summary-title' }, config.value.title),
            h('span', { class: 'playground-array-field__summary-count' }, itemCountText.value),
          ]),
          h(AButton, {
            class: 'playground-array-field__add-button',
            disabled: props.disabled || !canAdd.value,
            size: 'small',
            type: 'primary',
            onClick: addItem,
          }, () => [
            h(IconPlus, { size: 13, color: 'currentColor' }),
            h('span', null, t('field.array.add', '新增')),
          ]),
        ]),
        items.value.length > 0
          ? h('div', { class: 'playground-array-field__list' }, cards)
          : h('div', { class: 'playground-array-field__empty' }, [
              h('span', { class: 'playground-array-field__empty-title' }, t('field.array.emptyTitle', '暂无项目')),
              h('span', { class: 'playground-array-field__empty-copy' }, t('field.array.emptyCopy', '点击新增来配置列表内容。')),
            ]),
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
    ...createAntDesignVueFields(),
    Color: { component: ColorField },
    Spacing: { component: SpacingField },
    Array: { component: ArrayField },
    NavbarTitle: { component: NavbarTitleField },
  }
}
