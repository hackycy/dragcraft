import { createDesigner } from '@dragcraft/designer'
import { describe, expect, it } from 'vitest'
import { ecommerceSchema, productDetailSchema } from '../../config/templates'
import { playgroundMaterials } from './index'

describe('e-commerce product template', () => {
  it('round-trips the complete product document through the public Designer seam', () => {
    const designer = createDesigner({
      materials: playgroundMaterials,
      schema: ecommerceSchema,
    })

    expect(designer.document.value.status).toBe('ready')
    expect(designer.exportSchema()).toEqual(ecommerceSchema)
    expect(ecommerceSchema.structure.root.slice(0, 3)).toEqual([
      'nav-ecommerce',
      'tabbar-main',
      'floating-cart',
    ])
    expect(ecommerceSchema.nodes.find(node => node.id === 'analytics-home')).toMatchObject({
      type: 'analytics-config',
      props: { eventName: 'home_view' },
    })
  })

  it('installs ordinary content, a purchase bar and an overlay dialog', () => {
    const designer = createDesigner({
      materials: playgroundMaterials,
      schema: productDetailSchema,
    })

    expect(designer.document.value.status).toBe('ready')
    expect(productDetailSchema.nodes.map(node => node.type)).toEqual(expect.arrayContaining([
      'image',
      'text',
      'purchase-bar',
      'promo-dialog',
    ]))
    expect(productDetailSchema.structure.root.slice(-2)).toEqual([
      'purchase-actions',
      'member-offer-dialog',
    ])
    expect(designer.exportSchema()).toEqual(productDetailSchema)
  })
})
