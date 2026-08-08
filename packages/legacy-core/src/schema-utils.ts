import type { ShallowRef } from 'vue'
import type { DeepReadonly, DesignerSchema } from './types'
import { cloneDeep } from '@dragcraft/utils'
import { toRaw } from 'vue'

export function cloneSchema(schema: DeepReadonly<DesignerSchema>): DesignerSchema {
  return cloneDeep(schema) as DesignerSchema
}

export function cloneRawSchema(schema: DesignerSchema): DesignerSchema {
  return cloneSchema(toRaw(schema))
}

export function cloneSchemaRef(schema: ShallowRef<DesignerSchema>): DesignerSchema {
  return cloneRawSchema(schema.value)
}

export function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value))
      deepFreeze(child)
  }
  return value as DeepReadonly<T>
}
