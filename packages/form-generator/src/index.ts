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
  FieldComponentDefinition,
  FieldComponentMap,
  FieldComponentProps,
  FieldComponentTransformContext,
  FieldDependencies,
  FieldSchema,
  FormContext,
  FormGeneratorContext,
  FormGeneratorProps,
  FormSchema,
  SectionSchema,
  SectionTogglePayload,
  TypedFieldSchema,
  TypedFormSchema,
  TypedSectionSchema,
  ValidationError,
  ValidationRule,
} from './types'
export { FORM_GENERATOR_CONTEXT_KEY } from './types'

// ── Utils ────────────────────────────────
export { resolveFieldComponentProps } from './utils'
