import type { PropType } from 'vue'
import type { FieldChangePayload, FieldComponentMap, FormGeneratorContext, FormSchema, SectionTogglePayload } from '../types'
import { computed, defineComponent, h, provide, reactive, watch } from 'vue'
import { useFormValidation } from '../composables/useFormValidation'
import { FORM_GENERATOR_CONTEXT_KEY } from '../types'
import FormSection from './FormSection'

export default defineComponent({
  name: 'DcFormGenerator',

  props: {
    schema: {
      type: Object as PropType<FormSchema>,
      required: true,
    },
    values: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    fieldComponentMap: {
      type: Object as PropType<FieldComponentMap>,
      default: undefined,
    },
  },

  emits: {
    'change': (_payload: FieldChangePayload) => true,
    'section:toggle': (_payload: SectionTogglePayload) => true,
    'submit': (_values: Record<string, unknown>) => true,
  },

  setup(props, { emit, expose }) {
    // Local reactive copy of values for optimistic updates and field interdependency
    const localValues = reactive<Record<string, unknown>>({ ...props.values })

    // Sync from parent values prop when it changes
    watch(
      () => props.values,
      (newValues) => {
        const keys = new Set([...Object.keys(localValues), ...Object.keys(newValues)])
        for (const key of keys) {
          if (key in newValues) {
            localValues[key] = newValues[key]
          }
          else {
            delete localValues[key]
          }
        }
      },
      { deep: false },
    )

    const fieldComponentMapRef = computed(() => props.fieldComponentMap ?? {})

    // Expose localValues directly for fine-grained reactivity in useFieldState
    const getFormValues = () => ({ ...localValues })

    // Validation (imperative, no reactive tracking needed)
    const { fieldErrors, validateField, validateAll, clearErrors } = useFormValidation(
      props.schema,
      () => ({ ...localValues }),
    )

    // Field change handler
    const onFieldChange = (key: string, value: unknown) => {
      localValues[key] = value
      validateField(key)
      emit('change', { key, value })
    }

    // Disabled ref
    const disabledRef = computed(() => props.disabled)

    // Create and provide context
    const ctx: FormGeneratorContext = {
      get fieldComponentMap() {
        return fieldComponentMapRef.value
      },
      onFieldChange,
      getFieldValue: (key: string) => localValues[key],
      getFormValues,
      values: localValues,
      disabled: disabledRef,
      fieldErrors,
    }
    provide(FORM_GENERATOR_CONTEXT_KEY, ctx)

    // Submit handler
    const submit = () => {
      emit('submit', { ...localValues })
    }

    // Expose validation API for parent template ref
    expose({ validate: validateAll, clearErrors, submit })

    return () => {
      const schema = props.schema

      return h(
        'div',
        { class: 'dc-form-generator' },
        schema.sections.map((section, i) =>
          h(FormSection, {
            key: `${section.title}-${i}`,
            section,
            onToggle: (collapsed: boolean) => {
              emit('section:toggle', { index: i, title: section.title, collapsed })
            },
          }),
        ),
      )
    }
  },
})
