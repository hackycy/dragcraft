import type { FieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { computed, defineComponent, h } from 'vue'

interface NavbarTitleConfig {
  title: string
  subtitle?: string
  titleFontSize?: number
  titleFontWeight?: string
}

export default defineComponent({
  name: 'DcNavbarTitleField',

  props: {
    modelValue: {
      type: Object as PropType<NavbarTitleConfig>,
      default: () => ({ title: '页面标题', subtitle: '', titleFontSize: 16, titleFontWeight: '600' }),
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
    const config = computed(() => props.modelValue as NavbarTitleConfig)

    const updateField = (key: string, value: unknown) => {
      emit('update:modelValue', {
        ...config.value,
        [key]: value,
      })
    }

    return () => {
      const { title, subtitle, titleFontSize = 16, titleFontWeight = '600' } = config.value

      return h('div', { class: 'dc-field-navbar-title' }, [
        // Preview
        h('div', { class: 'dc-field-navbar-title__preview' }, [
          h('div', {
            class: 'dc-field-navbar-title__preview-title',
            style: {
              fontSize: `${titleFontSize}px`,
              fontWeight: titleFontWeight,
            },
          }, title || '页面标题'),
          subtitle
            ? h('div', {
                class: 'dc-field-navbar-title__preview-subtitle',
              }, subtitle)
            : null,
        ]),

        // Fields
        h('div', { class: 'dc-field-navbar-title__fields' }, [
          // Title
          h('div', { class: 'dc-field-navbar-title__field' }, [
            h('label', { class: 'dc-field-navbar-title__label' }, '主标题'),
            h('input', {
              class: 'dc-field-navbar-title__input',
              type: 'text',
              value: title,
              disabled: props.disabled,
              placeholder: '请输入标题',
              onInput: (e: Event) => updateField('title', (e.target as HTMLInputElement).value),
            }),
          ]),

          // Subtitle
          h('div', { class: 'dc-field-navbar-title__field' }, [
            h('label', { class: 'dc-field-navbar-title__label' }, '副标题'),
            h('input', {
              class: 'dc-field-navbar-title__input',
              type: 'text',
              value: subtitle || '',
              disabled: props.disabled,
              placeholder: '请输入副标题（可选）',
              onInput: (e: Event) => updateField('subtitle', (e.target as HTMLInputElement).value),
            }),
          ]),

          // Font Size
          h('div', { class: 'dc-field-navbar-title__field' }, [
            h('label', { class: 'dc-field-navbar-title__label' }, `字号: ${titleFontSize}px`),
            h('input', {
              class: 'dc-field-navbar-title__slider',
              type: 'range',
              min: 12,
              max: 24,
              value: titleFontSize,
              disabled: props.disabled,
              onInput: (e: Event) => updateField('titleFontSize', Number((e.target as HTMLInputElement).value)),
            }),
          ]),

          // Font Weight
          h('div', { class: 'dc-field-navbar-title__field' }, [
            h('label', { class: 'dc-field-navbar-title__label' }, '字重'),
            h('select', {
              class: 'dc-field-navbar-title__select',
              value: titleFontWeight,
              disabled: props.disabled,
              onChange: (e: Event) => updateField('titleFontWeight', (e.target as HTMLSelectElement).value),
            }, [
              h('option', { value: '400' }, '常规'),
              h('option', { value: '500' }, '中等'),
              h('option', { value: '600' }, '粗体'),
            ]),
          ]),
        ]),
      ])
    }
  },
})
