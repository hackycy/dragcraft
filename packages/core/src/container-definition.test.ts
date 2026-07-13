import { describe, expect, it } from 'vitest'
import { validateContainerDefinition } from './container-definition'

const base = {
  defaultVariant: 'single',
  variants: {
    single: { title: 'Single', regions: [{ id: 'default', title: 'Default' }] },
  },
}

describe('validateContainerDefinition', () => {
  it('accepts an external definition without layout semantics', () => {
    expect(validateContainerDefinition(base)).toEqual({ valid: true, errors: [] })
  })

  it.each([
    [{ ...base, defaultVariant: 'missing' }, 'CONTAINER_DEFAULT_VARIANT_MISSING'],
    [{ ...base, variants: { single: { title: 'Single', regions: [{ id: '__proto__', title: 'Bad' }] } } }, 'CONTAINER_REGION_ID_RESERVED'],
    [{ ...base, variants: { single: { title: 'Single', regions: [{ id: 'a', title: 'A' }, { id: 'a', title: 'B' }] } } }, 'CONTAINER_REGION_ID_DUPLICATE'],
    [{ ...base, variants: { single: { title: 'Single', regions: [{ id: 'a', title: 'A', constraints: { minItems: 2, maxItems: 1 } }] } } }, 'CONTAINER_CARDINALITY_INVALID'],
    [{ ...base, variants: { single: { title: 'Single', regions: [{ id: 'a', title: 'A', constraints: { includeTypes: [''] } }] } } }, 'CONTAINER_TYPE_ID_INVALID'],
  ])('rejects invalid definitions', (definition, code) => {
    expect(validateContainerDefinition(definition as never).errors).toContainEqual(expect.objectContaining({ code }))
  })
})
