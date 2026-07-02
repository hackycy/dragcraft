import type { PropType } from 'vue'
import type { FieldChangePayload, FieldComponentMap, FormGeneratorContext, FormSchema, SectionTogglePayload } from '../types'
import { computed, defineComponent, h, provide, reactive, watch } from 'vue'
import { findFieldSchema, useFormValidation } from '../composables/useFormValidation'
import { FORM_GENERATOR_CONTEXT_KEY } from '../types'
import { copyFormValues, resolveFieldDependencies, syncReactiveRecord } from '../utils'
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
    const localValues = reactive<Record<string, unknown>>(copyFormValues(props.values))

    // Sync from parent values prop when it changes
    watch(
      () => props.values,
      (newValues) => {
        syncReactiveRecord(localValues, newValues)
      },
      { deep: false },
    )

    const fieldComponentMapRef = computed(() => props.fieldComponentMap ?? {})

    // Expose localValues directly for fine-grained reactivity in useFieldState
    const getFormValues = () => copyFormValues(localValues)

    // Resolve a field with dependency-driven overrides for validation
    const resolveField = (key: string) => {
      const field = findFieldSchema(props.schema, key)
      return field ? resolveFieldDependencies(field, localValues, localValues[key]) : undefined
    }

    // Validation (imperative, no reactive tracking needed)
    const { fieldErrors, validateField, validateAll, clearErrors } = useFormValidation(
      () => props.schema,
      getFormValues,
      resolveField,
    )

    // Field change handler
    // Note: validation is called by FormField with the resolved field
    const onFieldChange = (key: string, value: unknown) => {
      localValues[key] = value
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
      validateField,
    }
    provide(FORM_GENERATOR_CONTEXT_KEY, ctx)

    // Submit handler
    const submit = () => {
      emit('submit', getFormValues())
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
