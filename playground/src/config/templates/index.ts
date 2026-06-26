import type { DesignerSchema } from '@dragcraft/designer'
import { contentDetailSchema } from './content-detail-schema'
import { ecommerceSchema } from './ecommerce-schema'
import { productDetailSchema } from './product-detail-schema'

export interface TemplateEntry {
  id: string
  label: string
  schema: DesignerSchema
}

export const templateRegistry: TemplateEntry[] = [
  { id: 'ecommerce', label: '电商首页', schema: ecommerceSchema },
  { id: 'content-detail', label: '内容详情页', schema: contentDetailSchema },
  { id: 'product-detail', label: '商品详情页', schema: productDetailSchema },
]

export { contentDetailSchema } from './content-detail-schema'
export { ecommerceSchema } from './ecommerce-schema'
export { productDetailSchema } from './product-detail-schema'
