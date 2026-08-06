import type { MaterialDefinition } from './types'

export function defineMaterial<const Definition extends MaterialDefinition>(
  definition: Definition,
): Definition {
  return definition
}
