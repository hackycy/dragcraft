import type { DocumentSchema } from '@dragcraft/designer'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

export function isFinalDocumentSchema(input: unknown): input is DocumentSchema {
  if (!isRecord(input)
    || typeof input.version !== 'string'
    || input.version.length === 0
    || !isRecord(input.globalConfig)
    || !isRecord(input.page)
    || !isRecord(input.page.props)
    || !Array.isArray(input.nodes)
    || !isRecord(input.structure)
    || !isStringArray(input.structure.root)
    || !isRecord(input.structure.containers)) {
    return false
  }

  return input.nodes.every((node) => {
    return isRecord(node)
      && typeof node.id === 'string'
      && typeof node.type === 'string'
      && isRecord(node.props)
  }) && Object.values(input.structure.containers).every((container) => {
    return isRecord(container)
      && isRecord(container.regions)
      && Object.values(container.regions).every(isStringArray)
  })
}
