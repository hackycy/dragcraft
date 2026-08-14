import type { DocumentSchema } from '@dragcraft/core'
import type { FieldComponentDefinition, FieldRenderFactory, FormContext, FormGeneratorContext, FormValidation, TypedFormSchema } from '@dragcraft/form-generator'
import type { DesignerPresentation, MaterialDefinition } from './materials/types'
import type { DesignerDeviceFrame, DesignerInstance } from './types'
import { describe, expect, expectTypeOf, it } from 'vitest'
import * as publicApi from './index'

describe('designer public interface', () => {
  it('exposes the final designer contract and omits legacy runtime protocols', () => {
    expect(typeof publicApi.createDesigner).toBe('function')
    expect(typeof publicApi.defineMaterial).toBe('function')
    expect(typeof publicApi.DcDesigner).toBe('object')
    expect(publicApi).not.toHaveProperty('createEngine')
    expect(publicApi).not.toHaveProperty('CommandType')
    expect(publicApi).not.toHaveProperty('buildComponentMap')
    expect(publicApi).not.toHaveProperty('RootRenderer')
    expect(publicApi).toHaveProperty('DesignerRegionOutlet')
    expect(publicApi).not.toHaveProperty('ContainerRegionOutlet')
    expect(publicApi).not.toHaveProperty('RendererExtensions')
    expect(publicApi).not.toHaveProperty('RendererEventHooks')
  })

  it('exposes the extension types through one package', () => {
    expectTypeOf<MaterialDefinition>().toBeObject()
    expectTypeOf<DesignerPresentation>().toMatchTypeOf<{ kind: 'visual' | 'headless' }>()
    expectTypeOf<DocumentSchema>().toBeObject()
    expectTypeOf<DesignerInstance>().toHaveProperty('execute')
    expectTypeOf<DesignerDeviceFrame>().toHaveProperty('id')
    expectTypeOf<DesignerDeviceFrame>().toHaveProperty('containerShell')
    expectTypeOf<FieldComponentDefinition>().toBeObject()
    expectTypeOf<FieldRenderFactory>().toBeFunction()
    expectTypeOf<FormContext>().toBeObject()
    expectTypeOf<FormGeneratorContext>().toBeObject()
    expectTypeOf<FormValidation>().toBeObject()
    expectTypeOf<TypedFormSchema<{ Input: { allowClear?: boolean } }>>().toBeObject()
  })
})
