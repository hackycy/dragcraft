import type { FieldComponentMap } from '@dragcraft/form-generator'
import { FieldInput } from './FieldInput'
import { FieldSelect } from './FieldSelect'
import { FieldSwitch } from './FieldSwitch'

export const fieldComponents: FieldComponentMap = {
  input: FieldInput,
  textarea: FieldInput,
  number: FieldInput,
  select: FieldSelect,
  switch: FieldSwitch,
  checkbox: FieldSwitch,
}
