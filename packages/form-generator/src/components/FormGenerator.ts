import type { PropType } from 'vue'
import type { FieldChangePayload, FieldComponentMap, FormGeneratorContext, FormSchema } from '../types'
import { computed, defineComponent, h, provide, reactive, watch } from 'vue'
import { useFormValidation } from '../composables/useFormValidation'
import { FORM_GENERATOR_CONTEXT_KEY } from '../types'
import { buildDefaultFieldComponentMap } from './fields'
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
    change: (_payload: FieldChangePayload) => true,
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

    // Merge field component maps (user overrides take precedence)
    const mergedFieldComponentMap = computed(() => ({
      ...buildDefaultFieldComponentMap(),
      ...(props.fieldComponentMap ?? {}),
    }))

    // Validation
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
        return mergedFieldComponentMap.value
      },
      onFieldChange,
      getFieldValue: (key: string) => localValues[key],
      getFormValues: () => ({ ...localValues }),
      disabled: disabledRef,
      fieldErrors,
    }
    provide(FORM_GENERATOR_CONTEXT_KEY, ctx)

    // Expose validation API for parent template ref
    expose({ validate: validateAll, clearErrors })

    return () => {
      const schema = props.schema

      return h(
        'div',
        { class: 'dc-form-generator' },
        schema.sections.map(section =>
          h(FormSection, { key: section.title, section }),
        ),
      )
    }
  },
})
