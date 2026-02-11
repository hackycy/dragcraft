import type { Component } from 'vue'

// Field types

export type FormFieldType =
  | 'input'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'color'
  | 'slider'
  | 'switch'

export interface FormFieldOption {
  label: string
  value: any
}

export interface FormFieldSchema {
  key: string
  label: string
  type: FormFieldType
  defaultValue?: any
  placeholder?: string
  options?: FormFieldOption[]
  min?: number
  max?: number
  step?: number
  required?: boolean
  disabled?: boolean
  visible?: boolean | ((model: Record<string, any>) => boolean)
  validator?: (value: any) => boolean | string
}

export type FormSchema = FormFieldSchema[]

// Component map: field type → user-provided Vue component
export type FieldComponentMap = Partial<Record<FormFieldType, Component>>

// Standard props passed to each user-provided field component
export interface FieldComponentProps {
  field: FormFieldSchema
  modelValue: any
  error: string | null
  disabled: boolean
}

// Validation result
export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}
