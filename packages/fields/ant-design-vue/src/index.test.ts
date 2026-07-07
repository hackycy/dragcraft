import type { TypedFieldSchema, TypedFormSchema } from '@dragcraft/form-generator'
import type { AntDesignVueFieldComponentPropsMap } from './index'
import { describe, expect, it } from 'vitest'
import { antDesignVueFieldComponents, createAntDesignVueFields } from './index'

describe('antDesignVueFieldComponents', () => {
  it('registers value-bound components', () => {
    expect(antDesignVueFieldComponents.Input.modelPropName).toBe('value')
    expect(antDesignVueFieldComponents.Input.updateEventName).toBe('onUpdate:value')
    expect(antDesignVueFieldComponents.Select.modelPropName).toBe('value')
    expect(antDesignVueFieldComponents.Select.updateEventName).toBe('onUpdate:value')
  })

  it('registers checked-bound components', () => {
    expect(antDesignVueFieldComponents.Switch.modelPropName).toBe('checked')
    expect(antDesignVueFieldComponents.Switch.updateEventName).toBe('onUpdate:checked')
    expect(antDesignVueFieldComponents.Checkbox.modelPropName).toBe('checked')
    expect(antDesignVueFieldComponents.Checkbox.updateEventName).toBe('onUpdate:checked')
  })

  it('creates a field component map copy', () => {
    const first = createAntDesignVueFields()
    const second = createAntDesignVueFields()

    expect(first).not.toBe(second)
    expect(first.Input).toBe(antDesignVueFieldComponents.Input)
  })

  it('keeps component props aligned with ant-design-vue props types', () => {
    const inputProps: AntDesignVueFieldComponentPropsMap['Input'] = { allowClear: true }
    const selectProps: AntDesignVueFieldComponentPropsMap['Select'] = { options: [{ label: 'A', value: 'a' }] }
    const switchProps: AntDesignVueFieldComponentPropsMap['Switch'] = { size: 'small' }

    expect(inputProps.allowClear).toBe(true)
    expect(selectProps.options).toHaveLength(1)
    expect(switchProps.size).toBe('small')
  })

  it('supports component-discriminated schema typing', () => {
    const inputField: TypedFieldSchema<AntDesignVueFieldComponentPropsMap> = {
      key: 'name',
      label: 'Name',
      component: 'Input',
      componentProps: { allowClear: true },
    }
    const selectField: TypedFieldSchema<AntDesignVueFieldComponentPropsMap> = {
      key: 'status',
      label: 'Status',
      component: 'Select',
      componentProps: { options: [{ label: 'Enabled', value: 'enabled' }] },
    }
    const formSchema: TypedFormSchema<AntDesignVueFieldComponentPropsMap> = {
      sections: [{ title: 'Basic', fields: [inputField, selectField] }],
    }

    expect(formSchema.sections[0].fields).toHaveLength(2)
  })
})

const invalidSelectField: TypedFieldSchema<AntDesignVueFieldComponentPropsMap> = {
  key: 'invalid',
  label: 'Invalid',
  component: 'Select',
  // @ts-expect-error componentProps is checked against SelectProps for component: 'Select'
  componentProps: { checked: true },
}

const invalidComponentField: TypedFieldSchema<AntDesignVueFieldComponentPropsMap> = {
  key: 'invalid',
  label: 'Invalid',
  // @ts-expect-error component must be one of the keys in AntDesignVueFieldComponentPropsMap
  component: 'Color',
}

void invalidSelectField
void invalidComponentField
