import type {
  DocumentSchema,
  FieldComponentMap,
  FormSchema,
  MaterialDefinition,
  StructuralDestination,
} from './index'
import { describe, expect, expectTypeOf, it } from 'vitest'
import * as publicDesigner from './index'

describe('designer public interface', () => {
  it('exposes the agreed deep Designer seams', () => {
    expect(typeof publicDesigner.createDesigner).toBe('function')
    expect(typeof publicDesigner.defineMaterial).toBe('function')
    expect(typeof publicDesigner.DcDesigner).toBe('object')
    expect(typeof publicDesigner.DesignerRegionOutlet).toBe('object')
    expect(typeof publicDesigner.DesignerViewportPortal).toBe('object')
    expect(typeof publicDesigner.useDesigner).toBe('function')
    expect(typeof publicDesigner.useSurfaceReservation).toBe('function')
  })

  it('does not expose removed Core, Renderer, or Widgets protocols', () => {
    for (const removed of [
      'CommandType',
      'createEngine',
      'RootRenderer',
      'WidgetRenderer',
      'WidgetDefinition',
      'ComponentMap',
      'DesignerSchema',
      'ResolvedDocument',
      'SchemaOperation',
      'NodeHost',
    ]) {
      expect(removed in publicDesigner).toBe(false)
    }
  })

  it('aggregates pure-data, material, authoring, and form types', () => {
    expectTypeOf<DocumentSchema>().toMatchTypeOf<{ version: string, nodes: unknown[] }>()
    expectTypeOf<MaterialDefinition>().toMatchTypeOf<{ type: string, presentation: unknown }>()
    expectTypeOf<StructuralDestination>().toMatchTypeOf<{ owner: unknown, position: unknown }>()
    expectTypeOf<FormSchema>().toMatchTypeOf<{ sections: unknown[] }>()
    expectTypeOf<FieldComponentMap>().toBeObject()
  })
})
