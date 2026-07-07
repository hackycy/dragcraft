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
  /** If true (or predicate returns true), the field must have a non-empty/non-null value */
  required?: boolean | ((ctx: FormContext) => boolean)
  /** Error message to display when validation fails */
  message?: string
  /** Custom validator returning true (pass) or a string (error message) */
  validator?: (value: unknown, ctx: FormContext) => boolean | string
  /** Minimum value (number only) */
  min?: number
  /** Maximum value (number only) */
  max?: number
  /** Minimum string length */
  minLength?: number
  /** Maximum string length */
  maxLength?: number
  /** Regex pattern the string must match */
  pattern?: RegExp
  /** Value must be one of these */
  enum?: unknown[]
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
export type FieldComponentProps<Props extends object = Record<string, unknown>>
  = | Props
    | ((ctx: FormContext) => Props)

export type FieldBindingScope = 'node' | 'schema' | 'globalConfig'

export interface FieldBindingTarget {
  /** The document area this field writes to. Defaults depend on the host form. */
  scope?: FieldBindingScope
  /** Dot path inside the selected scope. */
  path: string
}

export interface FieldSchema<
  ComponentType extends string = string,
  ComponentProps extends object = Record<string, unknown>,
> {
  /** Property key in the values object (e.g., 'text', 'fontSize') */
  key: string
  /** Human-readable label */
  label: string
  /** i18n message key for label; overrides `label` when i18n is active */
  labelKey?: string
  /** i18n message key for placeholder; overrides field.componentProps.placeholder when i18n is active */
  placeholderKey?: string
  /**
   * i18n key prefix for select/radio option labels.
   * Each option label is resolved as `${optionKeyPrefix}.${option.value}`.
   * Falls back to the static `option.label` when the key is missing.
   */
  optionKeyPrefix?: string
  /** Registered field component name (e.g., 'Input', 'Select', 'Color') */
  component: ComponentType
  /** Optional DSL path binding used by host applications such as the designer. */
  bindTo?: string | FieldBindingTarget
  /** Props forwarded to the registered UI component. Static or dynamic. */
  componentProps?: FieldComponentProps<ComponentProps>
  /** Declares which other fields this field depends on, and how to react. */
  dependencies?: FieldDependencies<FieldSchema<ComponentType, ComponentProps>>
  /** If false (or predicate returns false), field is hidden via CSS (preserves DOM state). */
  show?: boolean | ((ctx: FormContext) => boolean)
  /** If false (or predicate returns false), field is removed from DOM entirely. */
  ifShow?: boolean | ((ctx: FormContext) => boolean)
  /** Transform value before writing to form model (input -> model). */
  parseValue?: (value: unknown, ctx: FormContext) => unknown
  /** Transform value before passing to component (model -> component). */
  valueFormat?: (value: unknown, ctx: FormContext) => unknown
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
  /** Number of grid columns this field spans (requires section.columns > 1) */
  span?: number
}

/**
 * Declares dependencies on other fields and how to react when they change.
 */
export interface FieldDependencies<Field extends FieldSchema<string, object> = FieldSchema> {
  /** Field keys this field depends on. */
  fields: string[]

  /**
   * Called when any dependency field changes.
   * Returns partial FieldSchema overrides.
   * Cannot override key, component, or dependencies (to prevent cycles).
   */
  handler: (
    form: Record<string, unknown>,
    fieldValue: unknown,
  ) => Partial<Omit<Field, 'key' | 'component' | 'dependencies'>>
}

/**
 * A titled group of fields.
 */
export interface SectionSchema<Field extends FieldSchema<string, object> = FieldSchema> {
  title: string
  /** i18n message key for title; overrides `title` when i18n is active */
  titleKey?: string
  /** Whether the section starts collapsed. Defaults to false. */
  collapsed?: boolean
  fields: Field[]
  /** Number of grid columns. Defaults to 1 (vertical stack). */
  columns?: number
}

/**
 * Top-level schema that FormGenerator accepts.
 */
export interface FormSchema<Field extends FieldSchema<string, object> = FieldSchema> {
  sections: Array<SectionSchema<Field>>
}

export type TypedFieldSchema<PropsMap extends object> = {
  [ComponentType in Extract<keyof PropsMap, string>]:
  PropsMap[ComponentType] extends object
    ? FieldSchema<ComponentType, PropsMap[ComponentType]>
    : never
}[Extract<keyof PropsMap, string>]

export type TypedSectionSchema<PropsMap extends object> = SectionSchema<TypedFieldSchema<PropsMap>>

export type TypedFormSchema<PropsMap extends object> = FormSchema<TypedFieldSchema<PropsMap>>

// ──────────────────────────────────────────
// Component resolution
// ──────────────────────────────────────────

export interface FieldComponentTransformContext {
  field: FieldSchema
  values: Record<string, unknown>
}

/**
 * Describes how a schema field binds to a concrete Vue UI component.
 */
export interface FieldComponentDefinition {
  /** Vue component rendered for this field type. */
  component: Component
  /** Prop name used by the UI component as its model value. Defaults to `modelValue`. */
  modelPropName?: string
  /** Event prop used to receive model updates. Defaults to `onUpdate:modelValue`. */
  updateEventName?: string
  /** Default UI component props merged before field.componentProps. */
  defaultProps?: Record<string, unknown>
  /** Transform model value before passing it to the UI component. */
  formatValue?: (value: unknown, ctx: FieldComponentTransformContext) => unknown
  /** Transform UI component value before writing it to the form model. */
  normalizeValue?: (value: unknown, ctx: FieldComponentTransformContext) => unknown
}

/**
 * Maps field component names (e.g., 'Input', 'Select') to component adapters.
 */
export type FieldComponentMap = Record<string, FieldComponentDefinition>

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
  /** Field components keyed by schema component name */
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

/**
 * Section toggle event payload.
 */
export interface SectionTogglePayload {
  /** Index of the section in the schema */
  index: number
  /** Title of the section */
  title: string
  /** Whether the section is now collapsed */
  collapsed: boolean
}

// ──────────────────────────────────────────
// Internal context (provide/inject)
// ──────────────────────────────────────────

/**
 * Internal context provided to all FormGenerator descendants via provide/inject.
 */
export interface FormGeneratorContext {
  /** Field component map available to nested fields */
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
  /** Validate a specific field, optionally with a resolved field for dependency-driven rules */
  validateField: (key: string, resolvedField?: FieldSchema) => string | undefined
}

/**
 * Injection key for the form generator context.
 */
export const FORM_GENERATOR_CONTEXT_KEY: InjectionKey<FormGeneratorContext> = Symbol('dc-form-generator')
