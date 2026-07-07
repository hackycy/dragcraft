import type { FieldComponentDefinition, FieldComponentMap } from '@dragcraft/form-generator'
import type {
  AutoCompleteProps,
  CascaderProps,
  CheckboxGroupProps,
  CheckboxProps,
  DatePickerProps,
  InputNumberProps,
  InputProps,
  MentionsProps,
  RadioGroupProps,
  RadioProps,
  RateProps,
  SelectProps,
  SliderProps,
  SwitchProps,
  TextAreaProps,
  TimePickerProps,
  TreeSelectProps,
} from 'ant-design-vue'
import type { RangePickerProps } from 'ant-design-vue/es/date-picker'
import type { Component } from 'vue'
import {
  AutoComplete,
  Cascader,
  Checkbox,
  CheckboxGroup,
  DatePicker,
  Input,
  InputNumber,
  Mentions,
  Radio,
  RadioGroup,
  RangePicker,
  Rate,
  Select,
  Slider,
  Switch,
  Textarea,
  TimePicker,
  TreeSelect,
} from 'ant-design-vue'

export type AntDesignVueFieldComponentType
  = | 'AutoComplete'
    | 'Cascader'
    | 'Checkbox'
    | 'CheckboxGroup'
    | 'DatePicker'
    | 'Input'
    | 'InputNumber'
    | 'Mentions'
    | 'Radio'
    | 'RadioGroup'
    | 'RangePicker'
    | 'Rate'
    | 'Select'
    | 'Slider'
    | 'Switch'
    | 'Textarea'
    | 'TimePicker'
    | 'TreeSelect'

export interface AntDesignVueFieldComponentPropsMap {
  AutoComplete: AutoCompleteProps
  Cascader: CascaderProps
  Checkbox: CheckboxProps
  CheckboxGroup: CheckboxGroupProps
  DatePicker: DatePickerProps
  Input: InputProps
  InputNumber: InputNumberProps
  Mentions: MentionsProps
  Radio: RadioProps
  RadioGroup: RadioGroupProps
  RangePicker: RangePickerProps
  Rate: RateProps
  Select: SelectProps
  Slider: SliderProps
  Switch: SwitchProps
  Textarea: TextAreaProps
  TimePicker: TimePickerProps
  TreeSelect: TreeSelectProps
}

export type AntDesignVueFieldComponentMap = Record<AntDesignVueFieldComponentType, FieldComponentDefinition>

function valueField(component: Component): FieldComponentDefinition {
  return {
    component,
    modelPropName: 'value',
    updateEventName: 'onUpdate:value',
  }
}

function checkedField(component: Component): FieldComponentDefinition {
  return {
    component,
    modelPropName: 'checked',
    updateEventName: 'onUpdate:checked',
  }
}

export const antDesignVueFieldComponents: AntDesignVueFieldComponentMap = {
  AutoComplete: valueField(AutoComplete as unknown as Component),
  Cascader: valueField(Cascader as unknown as Component),
  Checkbox: checkedField(Checkbox as unknown as Component),
  CheckboxGroup: valueField(CheckboxGroup as unknown as Component),
  DatePicker: valueField(DatePicker as unknown as Component),
  Input: valueField(Input as unknown as Component),
  InputNumber: valueField(InputNumber as unknown as Component),
  Mentions: valueField(Mentions as unknown as Component),
  Radio: checkedField(Radio as unknown as Component),
  RadioGroup: valueField(RadioGroup as unknown as Component),
  RangePicker: valueField(RangePicker as unknown as Component),
  Rate: valueField(Rate as unknown as Component),
  Select: valueField(Select as unknown as Component),
  Slider: valueField(Slider as unknown as Component),
  Switch: checkedField(Switch as unknown as Component),
  Textarea: valueField(Textarea as unknown as Component),
  TimePicker: valueField(TimePicker as unknown as Component),
  TreeSelect: valueField(TreeSelect as unknown as Component),
}

export function createAntDesignVueFields(): FieldComponentMap {
  return { ...antDesignVueFieldComponents }
}
