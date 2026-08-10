import type { FieldBindingScope, FieldBindingTarget } from '@dragcraft/form-generator'
import type { DeepReadonly, DesignerSchema, SchemaNode } from '../presentation/semantic'
import type { AuthoringAction } from '../presentation/types'

export type FieldBinding = string | FieldBindingTarget | undefined

export interface ResolvedFieldBinding {
  scope: FieldBindingScope
  path: string
}

const BLOCKED_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor'])

export function toPathSegments(path: string): string[] {
  return path
    .split('.')
    .map(segment => segment.trim())
    .filter(Boolean)
}

function isSafePath(path: string): boolean {
  return toPathSegments(path).every(segment => !BLOCKED_PATH_SEGMENTS.has(segment))
}

function safePathSegments(path: string): string[] {
  if (!isSafePath(path))
    return []
  return toPathSegments(path)
}

function splitHead(path: string): [string | undefined, string] {
  const segments = safePathSegments(path)
  const [head, ...rest] = segments
  return [head, rest.join('.')]
}

function setPatchPath(path: string, value: unknown): Record<string, unknown> | null {
  const segments = safePathSegments(path)
  if (segments.length === 0)
    return null

  const root: Record<string, unknown> = {}
  let cursor = root
  for (let i = 0; i < segments.length - 1; i++) {
    const next: Record<string, unknown> = {}
    cursor[segments[i]] = next
    cursor = next
  }
  cursor[segments[segments.length - 1]] = value
  return root
}

export function resolveFieldBinding(
  binding: FieldBinding,
  fallback: ResolvedFieldBinding,
): ResolvedFieldBinding {
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
  schema: Pick<DeepReadonly<DesignerSchema>, 'globalConfig' | 'root'>,
  node: DeepReadonly<SchemaNode> | null,
): unknown {
  if (binding.scope === 'container')
    return node && binding.path === 'variant' ? node.container?.variant : undefined
  if (binding.scope === 'globalConfig')
    return readPath(schema.globalConfig, binding.path)
  if (binding.scope === 'schema')
    return readPath(schema, binding.path)
  return node ? readPath(node, binding.path) : undefined
}

function createNodeBindingAction(nodeId: string, path: string, value: unknown): AuthoringAction | null {
  const [head, rest] = splitHead(path)
  if (head === 'props') {
    const props = setPatchPath(rest, value)
    return props
      ? { type: 'node.update', nodeId, props }
      : null
  }
  if (head === 'style') {
    const style = setPatchPath(rest, value)
    return style
      ? { type: 'node.update', nodeId, props: {}, style }
      : null
  }
  return null
}

function createPageBindingAction(path: string, value: unknown): AuthoringAction | null {
  const [head, rest] = splitHead(path)
  if (head === 'props') {
    const props = setPatchPath(rest, value)
    return props
      ? { type: 'page.update', props }
      : null
  }
  if (head === 'style') {
    const style = setPatchPath(rest, value)
    return style
      ? { type: 'page.update', props: {}, style }
      : null
  }
  return null
}

export function createBindingAction(
  binding: ResolvedFieldBinding,
  value: unknown,
  nodeId?: string,
): AuthoringAction | null {
  if (!isSafePath(binding.path))
    return null

  if (binding.scope === 'container') {
    if (!nodeId || binding.path !== 'variant' || typeof value !== 'string')
      return null
    return {
      type: 'container.change-variant',
      containerId: nodeId,
      variant: value,
    }
  }

  if (binding.scope === 'globalConfig') {
    const config = setPatchPath(binding.path, value)
    return config
      ? { type: 'global-config.update', config }
      : null
  }

  if (binding.scope === 'schema') {
    const [head, rest] = splitHead(binding.path)
    if (head === 'globalConfig') {
      const config = setPatchPath(rest, value)
      return config
        ? { type: 'global-config.update', config }
        : null
    }
    if (head === 'root')
      return createPageBindingAction(rest, value)
    return null
  }

  return nodeId ? createNodeBindingAction(nodeId, binding.path, value) : null
}
