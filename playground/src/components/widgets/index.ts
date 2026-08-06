import type { MaterialDefinition } from '@dragcraft/designer'
import { basicMaterials } from './basic'
import { containerMaterials } from './container'
import { formMaterials } from './form'
import { miniProgramMaterials } from './mini-program'

export const playgroundMaterials: readonly MaterialDefinition[] = [
  ...basicMaterials,
  ...formMaterials,
  ...miniProgramMaterials,
  ...containerMaterials,
]
