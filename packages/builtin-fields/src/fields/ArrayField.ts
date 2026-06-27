import type { FieldComponentMap, FieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { FORM_GENERATOR_CONTEXT_KEY } from '@dragcraft/form-generator'
import { computed, defineComponent, h, inject, ref } from 'vue'

interface ArrayFieldConfig {
  itemFields: FieldSchema[]
  minItems?: number
  maxItems?: number
  defaultItem?: Record<string, unknown>
  sortable?: boolean
}

export default defineComponent({
  name: 'DcArrayField',

  props: {
    modelValue: {
      type: Array as PropType<Array<Record<string, unknown>>>,
      default: () => [],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    field: {
      type: Object as PropType<FieldSchema>,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const ctx = inject(FORM_GENERATOR_CONTEXT_KEY, null)
    const fieldComponentMap = computed<FieldComponentMap>(() => ctx?.fieldComponentMap ?? {})
    const config = computed(() => (props.field.props || {}) as unknown as ArrayFieldConfig)
    const items = computed(() => props.modelValue || [])
    const expandedItems = ref<Set<number>>(new Set([0]))

    const canAdd = computed(() => {
      const max = config.value.maxItems
      return max === undefined || items.value.length < max
    })

    const canRemove = computed(() => {
      const min = config.value.minItems ?? 0
      return items.value.length > min
    })

    const toggleExpand = (index: number) => {
      if (expandedItems.value.has(index)) {
        expandedItems.value.delete(index)
      }
      else {
        expandedItems.value.add(index)
      }
    }

    const addItem = () => {
      if (!canAdd.value)
        return
      const newItem = config.value.defaultItem || {}
      emit('update:modelValue', [...items.value, { ...newItem }])
    }

    const removeItem = (index: number) => {
      if (!canRemove.value)
        return
      const newItems = items.value.filter((_, i) => i !== index)
      emit('update:modelValue', newItems)
    }

    const updateItem = (index: number, key: string, value: unknown) => {
      const newItems = [...items.value]
      newItems[index] = { ...newItems[index], [key]: value }
      emit('update:modelValue', newItems)
    }

    const moveItem = (from: number, direction: 'up' | 'down') => {
      const to = direction === 'up' ? from - 1 : from + 1
      if (to < 0 || to >= items.value.length)
        return
      const newItems = [...items.value]
      const [item] = newItems.splice(from, 1)
      newItems.splice(to, 0, item)
      emit('update:modelValue', newItems)
    }

    return () => {
      const { itemFields, sortable } = config.value

      const renderItem = (item: Record<string, unknown>, index: number) => {
        const isExpanded = expandedItems.value.has(index)
        const title = item.label || item.name || item.title || `Item ${index + 1}`

        return h('div', {
          key: index,
          class: 'dc-field-array__item',
        }, [
          // Header
          h('div', {
            class: 'dc-field-array__item-header',
            onClick: () => toggleExpand(index),
          }, [
            h('span', { class: 'dc-field-array__item-toggle' }, isExpanded ? '[v]' : '[>]'),
            h('span', { class: 'dc-field-array__item-title' }, `${title}`),
            h('div', { class: 'dc-field-array__item-actions' }, [
              sortable && index > 0
                ? h('button', {
                    class: 'dc-field-array__sort',
                    disabled: props.disabled,
                    onClick: (e: Event) => {
                      e.stopPropagation()
                      moveItem(index, 'up')
                    },
                  }, 'Up')
                : null,
              sortable && index < items.value.length - 1
                ? h('button', {
                    class: 'dc-field-array__sort',
                    disabled: props.disabled,
                    onClick: (e: Event) => {
                      e.stopPropagation()
                      moveItem(index, 'down')
                    },
                  }, 'Down')
                : null,
              h('button', {
                class: 'dc-field-array__remove',
                disabled: props.disabled || !canRemove.value,
                onClick: (e: Event) => {
                  e.stopPropagation()
                  removeItem(index)
                },
              }, 'Remove'),
            ]),
          ]),
          // Body (fields)
          isExpanded
            ? h('div', { class: 'dc-field-array__item-body' }, (itemFields || []).map((field) => {
                const FieldComponent = fieldComponentMap.value[field.component]
                const fieldProps = field.props as Record<string, unknown> | undefined
                const childField = { ...field, props: fieldProps || {} }

                const fieldControl = FieldComponent
                  ? h(FieldComponent, {
                      'modelValue': item[field.key] ?? '',
                      'disabled': props.disabled,
                      'field': childField,
                      'onUpdate:modelValue': (value: unknown) => updateItem(index, field.key, value),
                    })
                  : h('input', {
                      class: 'dc-field-array__field-input',
                      type: 'text',
                      value: item[field.key] ?? '',
                      disabled: props.disabled,
                      onInput: (e: Event) => updateItem(index, field.key, (e.target as HTMLInputElement).value),
                    })

                return h('div', { class: 'dc-field-array__field', key: field.key }, [
                  h('label', { class: 'dc-field-array__field-label' }, field.label),
                  h('div', { class: 'dc-field-array__field-control' }, [fieldControl]),
                ])
              }))
            : null,
        ])
      }

      return h('div', { class: 'dc-field-array' }, [
        items.value.length > 0
          ? h('div', { class: 'dc-field-array__list' }, items.value.map((item, i) => renderItem(item, i)))
          : h('div', { class: 'dc-field-array__empty' }, 'No data'),
        h('button', {
          class: 'dc-field-array__add',
          disabled: props.disabled || !canAdd.value,
          onClick: addItem,
        }, '+ Add'),
      ])
    }
  },
})
