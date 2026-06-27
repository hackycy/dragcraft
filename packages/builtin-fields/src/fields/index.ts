import type { FieldComponentMap } from '@dragcraft/form-generator'
import ArrayField from './ArrayField'
import ColorField from './ColorField'
import InputField from './InputField'
import NumberField from './NumberField'
import SelectField from './SelectField'
import SliderField from './SliderField'
import SwitchField from './SwitchField'
import TextareaField from './TextareaField'

export {
  ArrayField,
  ColorField,
  InputField,
  NumberField,
  SelectField,
  SliderField,
  SwitchField,
  TextareaField,
}

/**
 * Returns the default mapping of field component names to Vue components.
 * Pass this to FormGenerator's `fieldComponentMap` prop to use built-in fields.
 *
 * @example
 * ```ts
 * import { buildDefaultFieldComponentMap } from '@dragcraft/builtin-fields'
 *
 * h(FormGenerator, {
 *   fieldComponentMap: buildDefaultFieldComponentMap(),
 * })
 * ```
 */
export function buildDefaultFieldComponentMap(): FieldComponentMap {
  return {
    input: InputField,
    number: NumberField,
    textarea: TextareaField,
    select: SelectField,
    switch: SwitchField,
    color: ColorField,
    slider: SliderField,
    array: ArrayField,
  }
}
