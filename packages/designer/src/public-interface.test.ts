import type {
  FieldComponentDefinition,
  FieldRenderFactory,
  FormContext,
  FormGeneratorContext,
  FormValidation,
  TypedFormSchema,
  WidgetDefinition,
  WidgetGroup,
  WidgetGroupConfig,
  WidgetRuntimeContext,
} from './index'
import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  buildComponentMap,
  createContainerPlan,
  defineContainerWidget,
  getWidgetMetas,
  registerWidgets,
  resolveFieldComponentProps,
  useFormGeneratorContext,
  useFormValidation,
  useWidgetRuntime,
} from './index'

describe('designer public interface', () => {
  it('aggregates widget registration helpers', () => {
    expect(typeof buildComponentMap).toBe('function')
    expect(typeof defineContainerWidget).toBe('function')
    expect(typeof getWidgetMetas).toBe('function')
    expect(typeof registerWidgets).toBe('function')
    expect(typeof createContainerPlan).toBe('function')
  })

  it('aggregates custom field helpers', () => {
    expect(typeof resolveFieldComponentProps).toBe('function')
    expect(typeof useFormGeneratorContext).toBe('function')
    expect(typeof useFormValidation).toBe('function')
    expect(typeof useWidgetRuntime).toBe('function')
  })

  it('exposes the extension types through one package', () => {
    expectTypeOf<WidgetDefinition>().toBeObject()
    expectTypeOf<WidgetGroup>().toBeString()
    expectTypeOf<WidgetGroupConfig>().toBeObject()
    expectTypeOf<FieldComponentDefinition>().toBeObject()
    expectTypeOf<FieldRenderFactory>().toBeFunction()
    expectTypeOf<FormContext>().toBeObject()
    expectTypeOf<FormGeneratorContext>().toBeObject()
    expectTypeOf<FormValidation>().toBeObject()
    expectTypeOf<TypedFormSchema<{ Input: { allowClear?: boolean } }>>().toBeObject()
    expectTypeOf<WidgetRuntimeContext>().toBeObject()
  })
})
