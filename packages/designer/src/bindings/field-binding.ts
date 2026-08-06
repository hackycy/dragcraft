import type { DocumentDeepReadonly, DocumentSchema, JsonObject, NodeDefinition } from '@dragcraft/core'
import type { FieldBindingScope, FieldBindingTarget } from '@dragcraft/form-generator'
import type { AuthoringAction } from '../authoring/types'
import { collectInvalidJsonPaths } from '@dragcraft/core'

export type FieldBinding = string | FieldBindingTarget | undefined

export interface ResolvedFieldBinding {
  readonly scope: FieldBindingScope
  readonly path: string
}

const BLOCKED_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor'])

function mutableClone(value: unknown): unknown {
  if (Array.isArray(value))
    return value.map(item => mutableClone(item))
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mutableClone(item)]))
  return value
}

export function toPathSegments(path: string): string[] {
  return path.split('.').map(segment => segment.trim()).filter(Boolean)
}

function isSafePath(path: string): boolean {
  return toPathSegments(path).every(segment => !BLOCKED_PATH_SEGMENTS.has(segment))
}

function setPath(source: JsonObject, path: string, value: unknown): boolean {
  const segments = toPathSegments(path)
  if (!isSafePath(path) || segments.length === 0 || collectInvalidJsonPaths(value).length > 0)
    return false
  let cursor: JsonObject = source
  for (const segment of segments.slice(0, -1)) {
    const existing = cursor[segment]
    const next = existing && typeof existing === 'object' && !Array.isArray(existing)
      ? existing as JsonObject
      : {}
    cursor[segment] = next
    cursor = next
  }
  cursor[segments.at(-1)!] = mutableClone(value) as never
  return true
}

export function resolveFieldBinding(binding: FieldBinding, fallback: ResolvedFieldBinding): ResolvedFieldBinding {
  if (typeof binding === 'string')
    return { scope: fallback.scope, path: binding }
  if (binding)
    return { scope: binding.scope ?? fallback.scope, path: binding.path }
  return fallback
}

export function readPath(source: unknown, path: string): unknown {
  if (!isSafePath(path))
    return undefined
  let current = source
  for (const segment of toPathSegments(path)) {
    if (typeof current !== 'object' || current === null)
      return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

export function readBindingValue(
  binding: ResolvedFieldBinding,
  schema: DocumentDeepReadonly<DocumentSchema>,
  node: DocumentDeepReadonly<NodeDefinition> | null,
): unknown {
  if (binding.scope === 'globalConfig')
    return readPath(schema.globalConfig, binding.path)
  if (binding.scope === 'schema') {
    if (binding.path.startsWith('globalConfig.'))
      return readPath(schema.globalConfig, binding.path.slice('globalConfig.'.length))
    if (binding.path.startsWith('page.'))
      return readPath(schema.page, binding.path.slice('page.'.length))
    return undefined
  }
  if (binding.scope !== 'node' || !node)
    return undefined
  return readPath(node, binding.path)
}

export function createBindingAction(
  binding: ResolvedFieldBinding,
  value: unknown,
  schema: DocumentDeepReadonly<DocumentSchema>,
  node: DocumentDeepReadonly<NodeDefinition> | null,
): AuthoringAction | null {
  if (collectInvalidJsonPaths(value).length > 0)
    return null
  if (binding.scope === 'globalConfig' || (binding.scope === 'schema' && binding.path.startsWith('globalConfig.'))) {
    const config = mutableClone(schema.globalConfig) as JsonObject
    const path = binding.scope === 'globalConfig' ? binding.path : binding.path.slice('globalConfig.'.length)
    return setPath(config, path, value)
      ? { type: 'update-global-config', globalConfig: config }
      : null
  }
  if (binding.scope === 'schema' && binding.path.startsWith('page.')) {
    const page = mutableClone(schema.page) as JsonObject
    return setPath(page, binding.path.slice('page.'.length), value)
      ? { type: 'update-page', page: page as unknown as DocumentSchema['page'] }
      : null
  }
  if (binding.scope !== 'node' || !node)
    return null
  const [head, ...rest] = toPathSegments(binding.path)
  if (head !== 'props' && head !== 'style')
    return null
  const props = mutableClone(node.props) as JsonObject
  const style = mutableClone(node.style ?? {}) as JsonObject
  const target = head === 'props' ? props : style
  if (!setPath(target, rest.join('.'), value))
    return null
  return {
    type: 'update-node',
    nodeId: node.id,
    node: {
      type: node.type,
      props,
      ...(Object.keys(style).length > 0 ? { style } : {}),
    },
  }
}
