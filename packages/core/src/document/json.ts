import type { DeepReadonly, DocumentSchema, JsonValue } from './types'

export interface DocumentDecodeIssue {
  readonly code: DocumentDecodeIssueCode
  readonly path: string
}

export type DocumentDecodeIssueCode
  = | 'CONTAINER_STRUCTURE_INVALID'
    | 'DOCUMENT_GLOBAL_CONFIG_INVALID'
    | 'DOCUMENT_NODES_INVALID'
    | 'DOCUMENT_PAGE_INVALID'
    | 'DOCUMENT_SCHEMA_INVALID'
    | 'DOCUMENT_STRUCTURE_INVALID'
    | 'DOCUMENT_VERSION_INVALID'
    | 'JSON_VALUE_INVALID'
    | 'NODE_DEFINITION_INVALID'
    | 'NODE_ID_INVALID'
    | 'NODE_PROPS_INVALID'
    | 'NODE_REFERENCE_INVALID'
    | 'NODE_STYLE_INVALID'
    | 'NODE_TYPE_INVALID'
    | 'REGION_STRUCTURE_INVALID'
    | 'STRUCTURE_CONTAINERS_INVALID'
    | 'STRUCTURE_ROOT_INVALID'

export type DocumentDecodeResult
  = | { readonly ok: true, readonly schema: DeepReadonly<DocumentSchema> }
    | { readonly ok: false, readonly issues: readonly DocumentDecodeIssue[] }

export function appendJsonPointer(path: string, token: string | number): string {
  const escaped = String(token).replaceAll('~', '~0').replaceAll('/', '~1')
  return `${path}/${escaped}`
}

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isJsonObject(value: unknown): value is Record<string, JsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function collectInvalidJsonPaths(input: unknown): string[] {
  const paths: string[] = []
  const ancestors = new Set<object>()

  const inspect = (value: unknown, path: string): void => {
    if (value === null || typeof value === 'string' || typeof value === 'boolean')
      return
    if (typeof value === 'number') {
      if (!Number.isFinite(value))
        paths.push(path)
      return
    }
    if (typeof value !== 'object') {
      paths.push(path)
      return
    }
    if (ancestors.has(value)) {
      paths.push(path)
      return
    }

    if (Array.isArray(value)) {
      const expectedKeys = new Set(['length'])
      ancestors.add(value)
      for (let index = 0; index < value.length; index++) {
        expectedKeys.add(String(index))
        const itemPath = appendJsonPointer(path, index)
        const descriptor = Object.getOwnPropertyDescriptor(value, index)
        if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
          paths.push(itemPath)
          continue
        }
        inspect(descriptor.value, itemPath)
      }
      ancestors.delete(value)
      if (Object.getOwnPropertyNames(value).some(key => !expectedKeys.has(key))
        || Object.getOwnPropertySymbols(value).length > 0) {
        paths.push(path)
      }
      return
    }

    if (!isPlainObject(value)) {
      paths.push(path)
      return
    }
    if (Object.getOwnPropertySymbols(value).length > 0)
      paths.push(path)

    ancestors.add(value)
    for (const key of Object.getOwnPropertyNames(value)) {
      const propertyPath = appendJsonPointer(path, key)
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
        paths.push(propertyPath)
        continue
      }
      inspect(descriptor.value, propertyPath)
    }
    ancestors.delete(value)
  }

  inspect(input, '')
  return paths
}

function cloneJsonObject(value: { readonly [key: string]: JsonValue }): DeepReadonly<typeof value> {
  const clone: Record<string, DeepReadonly<JsonValue>> = {}
  for (const [key, item] of Object.entries(value)) {
    Object.defineProperty(clone, key, {
      configurable: false,
      enumerable: true,
      value: cloneJsonValue(item),
      writable: false,
    })
  }
  return Object.freeze(clone)
}

export function cloneJsonValue<T extends JsonValue>(value: T): DeepReadonly<T> {
  if (Array.isArray(value))
    return Object.freeze(value.map(item => cloneJsonValue(item))) as DeepReadonly<T>
  if (value !== null && typeof value === 'object')
    return cloneJsonObject(value) as DeepReadonly<T>
  return value as DeepReadonly<T>
}

export function decodeDocumentSchema(input: unknown): DocumentDecodeResult {
  const invalidJsonPaths = collectInvalidJsonPaths(input)
  if (invalidJsonPaths.length > 0) {
    return {
      ok: false,
      issues: invalidJsonPaths.map(path => ({ code: 'JSON_VALUE_INVALID', path })),
    }
  }
  if (!isJsonObject(input)) {
    return { ok: false, issues: [{ code: 'DOCUMENT_SCHEMA_INVALID', path: '' }] }
  }

  const issues: DocumentDecodeIssue[] = []
  if (typeof input.version !== 'string' || input.version.length === 0)
    issues.push({ code: 'DOCUMENT_VERSION_INVALID', path: '/version' })
  if (!isJsonObject(input.globalConfig))
    issues.push({ code: 'DOCUMENT_GLOBAL_CONFIG_INVALID', path: '/globalConfig' })
  if (!isJsonObject(input.page)
    || !isJsonObject(input.page.props)
    || (input.page.style !== undefined && !isJsonObject(input.page.style))) {
    issues.push({ code: 'DOCUMENT_PAGE_INVALID', path: '/page' })
  }
  if (!Array.isArray(input.nodes)) {
    issues.push({ code: 'DOCUMENT_NODES_INVALID', path: '/nodes' })
  }
  else {
    for (const [index, node] of input.nodes.entries()) {
      const path = `/nodes/${index}`
      if (!isJsonObject(node)) {
        issues.push({ code: 'NODE_DEFINITION_INVALID', path })
        continue
      }
      if (typeof node.id !== 'string' || node.id.length === 0)
        issues.push({ code: 'NODE_ID_INVALID', path: `${path}/id` })
      if (typeof node.type !== 'string' || node.type.length === 0)
        issues.push({ code: 'NODE_TYPE_INVALID', path: `${path}/type` })
      if (!isJsonObject(node.props))
        issues.push({ code: 'NODE_PROPS_INVALID', path: `${path}/props` })
      if (node.style !== undefined && !isJsonObject(node.style))
        issues.push({ code: 'NODE_STYLE_INVALID', path: `${path}/style` })
    }
  }
  if (!isJsonObject(input.structure)) {
    issues.push({ code: 'DOCUMENT_STRUCTURE_INVALID', path: '/structure' })
  }
  else {
    if (!Array.isArray(input.structure.root)) {
      issues.push({ code: 'STRUCTURE_ROOT_INVALID', path: '/structure/root' })
    }
    else {
      for (const [index, nodeId] of input.structure.root.entries()) {
        if (typeof nodeId !== 'string' || nodeId.length === 0)
          issues.push({ code: 'NODE_REFERENCE_INVALID', path: `/structure/root/${index}` })
      }
    }

    if (!isJsonObject(input.structure.containers)) {
      issues.push({ code: 'STRUCTURE_CONTAINERS_INVALID', path: '/structure/containers' })
    }
    else {
      for (const [containerId, container] of Object.entries(input.structure.containers)) {
        const containerPath = appendJsonPointer('/structure/containers', containerId)
        if (!isJsonObject(container) || !isJsonObject(container.regions)) {
          issues.push({ code: 'CONTAINER_STRUCTURE_INVALID', path: containerPath })
          continue
        }
        for (const [regionId, children] of Object.entries(container.regions)) {
          const regionPath = appendJsonPointer(`${containerPath}/regions`, regionId)
          if (!Array.isArray(children)) {
            issues.push({ code: 'REGION_STRUCTURE_INVALID', path: regionPath })
            continue
          }
          for (const [index, nodeId] of children.entries()) {
            if (typeof nodeId !== 'string' || nodeId.length === 0)
              issues.push({ code: 'NODE_REFERENCE_INVALID', path: `${regionPath}/${index}` })
          }
        }
      }
    }
  }

  if (issues.length > 0)
    return { ok: false, issues }
  return {
    ok: true,
    schema: cloneJsonValue(input as JsonValue) as unknown as DeepReadonly<DocumentSchema>,
  }
}
