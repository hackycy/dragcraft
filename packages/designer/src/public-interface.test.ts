import type { DocumentSchema } from '@dragcraft/core'
import type { FieldComponentDefinition, FieldRenderFactory, FormContext, FormGeneratorContext, FormValidation, TypedFormSchema } from '@dragcraft/form-generator'
import type { ActionInterceptor, DesignerDeviceFrame, DesignerDocumentState, DesignerExtensions, DesignerInstance, NodeActionDefinition } from './index'
import type { DesignerPresentation, MaterialDefinition } from './materials/types'
import { describe, expect, expectTypeOf, it } from 'vitest'
import * as publicApi from './index'

interface CarouselItem {
  link: string
  src: string
}

interface CarouselProps {
  autoplay: boolean
  height: number
  interval: number
  items: CarouselItem[]
  objectFit: string
}

const carouselDefaultProps = {
  height: 300,
  objectFit: 'cover',
  autoplay: true,
  interval: 3,
  items: [{ src: '', link: '' }] as CarouselItem[],
}

describe('designer public interface', () => {
  it('exposes the final designer contract and omits legacy runtime protocols', () => {
    expect(typeof publicApi.createDesigner).toBe('function')
    expect(typeof publicApi.defineMaterial).toBe('function')
    expect(typeof publicApi.DcDesigner).toBe('object')
    expect(publicApi).not.toHaveProperty('createEngine')
    expect(publicApi).not.toHaveProperty('CommandType')
    expect(publicApi).not.toHaveProperty('buildMaterialPreviewMap')
    expect(publicApi).not.toHaveProperty('ApplicationSurface')
    expect(publicApi).toHaveProperty('DesignerRegionOutlet')
    expect(publicApi).not.toHaveProperty('ContainerRegionOutlet')
    expect(publicApi).not.toHaveProperty('PresentationDefaults')
    expect(publicApi).not.toHaveProperty('DesignerEventHooks')
  })

  it('exposes the extension types through one package', () => {
    expectTypeOf<MaterialDefinition>().toBeObject()
    expectTypeOf<DesignerPresentation>().toMatchTypeOf<{ kind: 'visual' | 'headless' }>()
    expectTypeOf<DesignerPresentation>().not.toHaveProperty('layout')
    expectTypeOf<DesignerPresentation>().not.toHaveProperty('placement')
    expectTypeOf<DocumentSchema>().toBeObject()
    expectTypeOf<DesignerDocumentState>().toMatchTypeOf<{
      status: 'ready' | 'degraded' | 'conflicted' | 'rejected'
    }>()
    expectTypeOf<DesignerInstance>().toHaveProperty('execute')
    expectTypeOf<DesignerInstance>().not.toHaveProperty('resolvedDocument')
    expectTypeOf<DesignerDeviceFrame>().toHaveProperty('id')
    expectTypeOf<DesignerDeviceFrame>().toHaveProperty('containerShell')
    expectTypeOf<DesignerExtensions>().toHaveProperty('materialPanelRenderer')
    expectTypeOf<ActionInterceptor>().toHaveProperty('beforeAction')
    expectTypeOf<NodeActionDefinition>().toHaveProperty('key')
    expectTypeOf<FieldComponentDefinition>().toBeObject()
    expectTypeOf<FieldRenderFactory>().toBeFunction()
    expectTypeOf<FormContext>().toBeObject()
    expectTypeOf<FormGeneratorContext>().toBeObject()
    expectTypeOf<FormValidation>().toBeObject()
    expectTypeOf<TypedFormSchema<{ Input: { allowClear?: boolean } }>>().toBeObject()
  })

  it('accepts named props and reads dynamic schema fields without assertions', () => {
    const material: MaterialDefinition<CarouselProps> = {
      type: 'carousel',
      schema: { defaultProps: carouselDefaultProps },
      presentation: { kind: 'headless' },
    }
    const materials: readonly MaterialDefinition[] = [{
      type: 'registered-carousel',
      schema: { defaultProps: carouselDefaultProps },
      presentation: { kind: 'headless' },
    }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {}, style: { surface: { backgroundColor: '#fff' } } },
      nodes: [],
      structure: { root: [], containers: {} },
    }
    const backgroundColor: string | undefined = schema.page.style?.surface?.backgroundColor

    expectTypeOf(material.schema?.defaultProps).toEqualTypeOf<CarouselProps | undefined>()
    expect(materials[0]!.schema?.defaultProps).toBe(carouselDefaultProps)
    expect(backgroundColor).toBe('#fff')
  })
})
