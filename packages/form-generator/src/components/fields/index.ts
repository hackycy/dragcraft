import type { FieldComponentMap } from '../../types'
import ColorField from './ColorField'
import InputField from './InputField'
import NumberField from './NumberField'
import SelectField from './SelectField'
import SliderField from './SliderField'
import SwitchField from './SwitchField'
import TextareaField from './TextareaField'

export {
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
 * Users can override any of these via the `fieldComponentMap` prop on FormGenerator.
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
  }
}
