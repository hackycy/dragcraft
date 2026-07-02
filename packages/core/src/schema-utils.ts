import type { ShallowRef } from 'vue'
import type { DesignerSchema } from './types'
import { cloneDeep } from '@dragcraft/utils'
import { toRaw } from 'vue'

export function cloneSchema(schema: DesignerSchema): DesignerSchema {
  return cloneDeep(schema)
}

export function cloneRawSchema(schema: DesignerSchema): DesignerSchema {
  return cloneSchema(toRaw(schema))
}

export function cloneSchemaRef(schema: ShallowRef<DesignerSchema>): DesignerSchema {
  return cloneRawSchema(schema.value)
}
