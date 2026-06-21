import type { Component, InjectionKey, Ref } from 'vue'

// ──────────────────────────────────────────
// Form context (passed to visible/disabled predicates)
// ──────────────────────────────────────────

/**
 * Context object passed to visible/disabled predicates.
 * Provides access to the current form values so fields can react to each other.
 */
export interface FormContext {
  /** Current flat key-value map of all form field values */
  values: Record<string, unknown>
}

// ──────────────────────────────────────────
// Validation
// ──────────────────────────────────────────

/**
 * Validation rule for a single field.
 */
export interface ValidationRule {
  /** If true, the field must have a non-empty/non-null value */
  required?: boolean
  /** Error message to display when validation fails */
  message?: string
  /** Custom validator returning true (pass) or a string (error message) */
  validator?: (value: unknown, ctx: FormContext) => boolean | string
}

/**
 * Validation error associated with a specific field.
 */
export interface ValidationError {
  key: string
  message: string
}

// ──────────────────────────────────────────
// Schema types
// ──────────────────────────────────────────

/**
 * Describes a single form field.
 */
export interface FieldSchema {
  /** Property key in the values object (e.g., 'text', 'fontSize') */
  key: string
  /** Human-readable label */
  label: string
  /** Registered field component name (e.g., 'input', 'select', 'color') */
  component: string
  /** Extra props forwarded to the field component */
  props?: Record<string, unknown>
  /** Default value used when the actual value is undefined */
  defaultValue?: unknown
  /** Dynamic visibility predicate */
  visible?: (ctx: FormContext) => boolean
  /** Dynamic disabled predicate */
  disabled?: (ctx: FormContext) => boolean
  /** Validation rules */
  rules?: ValidationRule[]
  /** Optional tooltip / help text */
  tooltip?: string
}

/**
 * A titled group of fields.
 */
export interface SectionSchema {
  title: string
  /** Whether the section starts collapsed. Defaults to false. */
  collapsed?: boolean
  fields: FieldSchema[]
}

/**
 * Top-level schema that FormGenerator accepts.
 */
export interface FormSchema {
  sections: SectionSchema[]
}

// ──────────────────────────────────────────
// Component resolution
// ──────────────────────────────────────────

/**
 * Maps field component names (e.g., 'input', 'select') to Vue components.
 */
export type FieldComponentMap = Record<string, Component>

/**
 * Standard props that every field component receives.
 * Field components must implement v-model via modelValue + onUpdate:modelValue.
 */
export interface FieldComponentProps {
  /** Current field value */
  modelValue: unknown
  /** Whether the field is disabled */
  disabled: boolean
  /** The full field schema, so the component can read field.props for extra configuration */
  field: FieldSchema
}

// ──────────────────────────────────────────
// FormGenerator props and events
// ──────────────────────────────────────────

/**
 * Props accepted by the FormGenerator root component.
 */
export interface FormGeneratorProps {
  /** Schema describing sections and fields to render */
  schema: FormSchema
  /** Current values keyed by field key */
  values: Record<string, unknown>
  /** Globally disable all fields */
  disabled?: boolean
  /** Custom/override field components merged on top of built-in defaults */
  fieldComponentMap?: FieldComponentMap
}

/**
 * Change event payload emitted by FormGenerator.
 */
export interface FieldChangePayload {
  /** Which field changed */
  key: string
  /** New value */
  value: unknown
}

// ──────────────────────────────────────────
// Internal context (provide/inject)
// ──────────────────────────────────────────

/**
 * Internal context provided to all FormGenerator descendants via provide/inject.
 */
export interface FormGeneratorContext {
  /** Merged field component map (built-in defaults + user overrides) */
  fieldComponentMap: FieldComponentMap
  /** Callback invoked when any field value changes */
  onFieldChange: (key: string, value: unknown) => void
  /** Read a specific field value from the current model */
  getFieldValue: (key: string) => unknown
  /** Get all current values as a snapshot */
  getFormValues: () => Record<string, unknown>
  /** Reactive values — use for fine-grained dependency tracking in computed/watch */
  values: Record<string, unknown>
  /** Global disabled ref */
  disabled: Ref<boolean>
  /** Map of field key -> validation error messages (reactive) */
  fieldErrors: Ref<Record<string, string | undefined>>
}

/**
 * Injection key for the form generator context.
 */
export const FORM_GENERATOR_CONTEXT_KEY: InjectionKey<FormGeneratorContext> = Symbol('dc-form-generator')
