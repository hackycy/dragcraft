// ── Components ───────────────────────────
export { FormGenerator } from './components'

// ── Field Components (for advanced usage / override) ──
export {
  buildDefaultFieldComponentMap,
  ColorField,
  InputField,
  NumberField,
  SelectField,
  SliderField,
  SwitchField,
  TextareaField,
} from './components/fields'

// ── Composables ──────────────────────────
export { useFieldState, useFormValidation } from './composables'
export type { FieldState } from './composables'
export type { FormValidation } from './composables'

// ── Context ──────────────────────────────
export { useFormGeneratorContext } from './context'

// ── Types ────────────────────────────────
export type {
  FieldChangePayload,
  FieldComponentMap,
  FieldComponentProps,
  FieldSchema,
  FormContext,
  FormGeneratorContext,
  FormGeneratorProps,
  FormSchema,
  SectionSchema,
  ValidationError,
  ValidationRule,
} from './types'
export { FORM_GENERATOR_CONTEXT_KEY } from './types'
