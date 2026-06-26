// ── Components ───────────────────────────
export { FormGenerator } from './components'

// ── Composables ──────────────────────────
export { findFieldSchema, useFieldDependencies, useFieldState, useFormValidation } from './composables'
export type { FieldDependenciesResult, FieldState, FormValidation } from './composables'

// ── Context ──────────────────────────────
export { useFormGeneratorContext } from './context'

// ── Types ────────────────────────────────
export type {
  FieldChangePayload,
  FieldComponentMap,
  FieldComponentProps,
  FieldDependencies,
  FieldSchema,
  FormContext,
  FormGeneratorContext,
  FormGeneratorProps,
  FormSchema,
  SectionSchema,
  SectionTogglePayload,
  ValidationError,
  ValidationRule,
} from './types'
export { FORM_GENERATOR_CONTEXT_KEY } from './types'
