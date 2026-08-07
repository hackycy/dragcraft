import type { FieldComponentMap, FieldSchema } from '@dragcraft/designer'
import type { Component, PropType } from 'vue'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'
import { Button, Input, InputNumber } from 'ant-design-vue'
import { computed, defineComponent, h, ref } from 'vue'
import { IconArrowDown, IconArrowUp, IconDelete, IconPlus } from '../icons'

type Translate = (key: string, fallback?: string) => string

interface ArrayFieldConfig {
  defaultItem?: Record<string, unknown>
  itemFields?: FieldSchema[]
  maxItems?: number
  minItems?: number
  sortable?: boolean
  title?: string
  titleKey?: string
}

const AButton = Button as unknown as Component
const AInput = Input as unknown as Component
const AInputNumber = InputNumber as unknown as Component

type SpacingEdge = 'Top' | 'Right' | 'Bottom' | 'Left'
type SpacingType = 'margin' | 'padding'

const SPACING_EDGES: Array<{ edge: SpacingEdge, labelKey: string, label: string }> = [
  { edge: 'Top', labelKey: 'field.spacing.top', label: '上' },
  { edge: 'Right', labelKey: 'field.spacing.right', label: '右' },
  { edge: 'Bottom', labelKey: 'field.spacing.bottom', label: '下' },
  { edge: 'Left', labelKey: 'field.spacing.left', label: '左' },
]

export const ColorField = defineComponent({
  name: 'PlaygroundColorField',
  props: {
    modelValue: { type: String, default: '#000000' },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', { class: 'playground-color-field' }, [
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

function createArrayField(translate: Translate) {
  return defineComponent({
    name: 'PlaygroundArrayField',
    props: {
      modelValue: { type: Array as PropType<Array<Record<string, unknown>>>, default: () => [] },
      disabled: { type: Boolean, default: false },
      itemFields: { type: Array as PropType<FieldSchema[]>, default: () => [] },
      title: { type: String, default: '列表项目' },
      titleKey: { type: String, default: '' },
      minItems: { type: Number, default: undefined },
      maxItems: { type: Number, default: undefined },
      defaultItem: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
      sortable: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const expandedKeys = ref<string[]>(['0'])
      const config = computed<ArrayFieldConfig>(() => ({
        defaultItem: props.defaultItem,
        itemFields: props.itemFields,
        maxItems: props.maxItems,
        minItems: props.minItems,
        sortable: props.sortable,
        title: props.title,
        titleKey: props.titleKey,
      }))
      const items = computed(() => props.modelValue ?? [])
      const canAdd = computed(() => config.value.maxItems === undefined || items.value.length < config.value.maxItems)
      const canRemove = computed(() => items.value.length > (config.value.minItems ?? 0))

      const updateItems = (nextItems: Array<Record<string, unknown>>) => emit('update:modelValue', nextItems)
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
      }
      const moveItem = (index: number, offset: -1 | 1) => {
        const target = index + offset
        if (target < 0 || target >= items.value.length)
          return
        const nextItems = [...items.value]
        const [item] = nextItems.splice(index, 1)
        nextItems.splice(target, 0, item!)
        updateItems(nextItems)
        expandedKeys.value = [String(target)]
      }
      const updateItem = (index: number, key: string, value: unknown) => {
        const nextItems = [...items.value]
        nextItems[index] = { ...nextItems[index], [key]: value }
        updateItems(nextItems)
      }
      const toggleItem = (index: number) => {
        const key = String(index)
        expandedKeys.value = expandedKeys.value.includes(key)
          ? expandedKeys.value.filter(item => item !== key)
          : [...expandedKeys.value, key]
      }
      const renderIconButton = (
        label: string,
        icon: Component,
        onClick: (event: MouseEvent) => void,
        disabled = false,
        danger = false,
      ) => h(AButton, {
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
        const cards = items.value.map((item, index) => {
          const expanded = expandedKeys.value.includes(String(index))
          const title = String(item.label ?? item.name ?? item.title ?? `Item ${index + 1}`)
          return h('div', {
            class: ['playground-array-field__item', { 'playground-array-field__item--expanded': expanded }],
            key: index,
          }, [
            h('div', { class: 'playground-array-field__header', onClick: () => toggleItem(index) }, [
              h('span', { class: 'playground-array-field__index' }, String(index + 1).padStart(2, '0')),
              h('div', { class: 'playground-array-field__title-wrap' }, [
                h('span', { class: 'playground-array-field__title' }, title),
                h('span', { class: 'playground-array-field__meta' }, translate(
                  expanded ? 'field.array.editing' : 'field.array.collapsed',
                  expanded ? '编辑中' : '点击编辑',
                )),
              ]),
              h('div', { class: 'playground-array-field__actions' }, [
                config.value.sortable
                  ? renderIconButton(translate('field.array.moveUp', '上移'), IconArrowUp, (event) => {
                      event.stopPropagation()
                      moveItem(index, -1)
                    }, props.disabled || index === 0)
                  : null,
                config.value.sortable
                  ? renderIconButton(translate('field.array.moveDown', '下移'), IconArrowDown, (event) => {
                      event.stopPropagation()
                      moveItem(index, 1)
                    }, props.disabled || index === items.value.length - 1)
                  : null,
                renderIconButton(translate('field.array.remove', '删除'), IconDelete, (event) => {
                  event.stopPropagation()
                  removeItem(index)
                }, props.disabled || !canRemove.value, true),
                h('span', { class: ['playground-array-field__chevron', { 'playground-array-field__chevron--expanded': expanded }] }),
              ]),
            ]),
            expanded
              ? h('div', { class: 'playground-array-field__body' }, config.value.itemFields?.map(field => h('label', {
                  class: 'playground-array-field__field',
                  key: field.key,
                }, [
                  h('span', { class: 'playground-array-field__label' }, field.labelKey
                    ? translate(field.labelKey, field.label)
                    : field.label),
                  h(AInput, {
                    'value': item[field.key] ?? field.defaultValue ?? '',
                    'disabled': props.disabled,
                    'placeholder': field.placeholderKey
                      ? translate(field.placeholderKey, String((field.componentProps as Record<string, unknown> | undefined)?.placeholder ?? ''))
                      : (field.componentProps as Record<string, unknown> | undefined)?.placeholder,
                    'size': 'small',
                    'onUpdate:value': (value: string) => updateItem(index, field.key, value),
                  }),
                ])))
              : null,
          ])
        })
        const title = config.value.titleKey
          ? translate(config.value.titleKey, config.value.title)
          : config.value.title
        return h('div', { class: 'playground-array-field' }, [
          h('div', { class: 'playground-array-field__toolbar' }, [
            h('div', { class: 'playground-array-field__summary' }, [
              h('span', { class: 'playground-array-field__summary-title' }, title),
              h('span', { class: 'playground-array-field__summary-count' }, config.value.maxItems === undefined
                ? String(items.value.length)
                : `${items.value.length}/${config.value.maxItems}`),
            ]),
            h(AButton, {
              class: 'playground-array-field__add-button',
              disabled: props.disabled || !canAdd.value,
              size: 'small',
              type: 'primary',
              onClick: addItem,
            }, () => [h(IconPlus, { size: 13, color: 'currentColor' }), h('span', translate('field.array.add', '新增'))]),
          ]),
          cards.length > 0
            ? h('div', { class: 'playground-array-field__list' }, cards)
            : h('div', { class: 'playground-array-field__empty' }, [
                h('span', { class: 'playground-array-field__empty-title' }, translate('field.array.emptyTitle', '暂无项目')),
                h('span', { class: 'playground-array-field__empty-copy' }, translate('field.array.emptyCopy', '点击新增来配置列表内容。')),
              ]),
        ])
      }
    },
  })
}

function createSpacingField(translate: Translate) {
  return defineComponent({
    name: 'PlaygroundSpacingField',
    props: {
      modelValue: { type: [String, Number] as PropType<string | number>, default: '0px' },
      disabled: { type: Boolean, default: false },
      type: { type: String as PropType<SpacingType>, default: 'margin' },
      min: { type: Number, default: 0 },
      max: { type: Number, default: 120 },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const linked = ref(true)
      const values = computed(() => {
        const parts = String(props.modelValue ?? 0).trim().split(/\s+/).map((part) => {
          const parsed = Number.parseFloat(part)
          return Number.isNaN(parsed) ? 0 : parsed
        })
        if (parts.length === 1)
          return [parts[0]!, parts[0]!, parts[0]!, parts[0]!]
        if (parts.length === 2)
          return [parts[0]!, parts[1]!, parts[0]!, parts[1]!]
        if (parts.length === 3)
          return [parts[0]!, parts[1]!, parts[2]!, parts[1]!]
        return [parts[0]!, parts[1]!, parts[2]!, parts[3]!]
      })
      const getValue = (edge: SpacingEdge) => {
        return values.value[SPACING_EDGES.findIndex(item => item.edge === edge)] ?? 0
      }
      const updateEdge = (edge: SpacingEdge, value: number | null) => {
        const nextValue = value ?? 0
        const edgeIndex = SPACING_EDGES.findIndex(item => item.edge === edge)
        const next = linked.value
          ? [nextValue, nextValue, nextValue, nextValue]
          : values.value.map((current, index) => index === edgeIndex ? nextValue : current)
        emit('update:modelValue', next.map(item => `${item}px`).join(' '))
      }
      return () => h('div', { class: 'playground-spacing-field' }, [
        h('div', { class: 'playground-spacing-field__inputs' }, SPACING_EDGES.map(({ edge, labelKey, label }) => h('label', {
          class: 'playground-spacing-field__input',
          key: edge,
        }, [
          h('span', translate(labelKey, label)),
          h(AInputNumber, {
            'value': getValue(edge),
            'disabled': props.disabled,
            'min': props.min,
            'max': props.max,
            'precision': 0,
            'size': 'small',
            'onUpdate:value': (value: number | null) => updateEdge(edge, value),
          }),
        ]))),
        h(AButton, {
          'aria-label': linked.value
            ? translate('field.spacing.unlink', '取消联动')
            : translate('field.spacing.link', '启用联动'),
          'class': ['playground-spacing-field__link', { 'playground-spacing-field__link--active': linked.value }],
          'disabled': props.disabled,
          'size': 'small',
          'title': linked.value
            ? translate('field.spacing.unlink', '取消联动')
            : translate('field.spacing.link', '启用联动'),
          'type': linked.value ? 'primary' : 'default',
          'onClick': () => { linked.value = !linked.value },
        }, () => translate('field.spacing.linked', '联动')),
      ])
    },
  })
}

export function buildPlaygroundFieldComponentMap(translate: Translate): FieldComponentMap {
  return {
    ...createAntDesignVueFields(),
    Array: { component: createArrayField(translate) },
    Color: { component: ColorField },
    Spacing: { component: createSpacingField(translate) },
  }
}
