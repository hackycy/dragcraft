import type { NodeDefinition } from '@dragcraft/core'

export type DeepReadonly<T>
  = T extends (...args: infer Args) => infer Result
    ? (...args: Args) => Result
    : T extends readonly (infer Item)[]
      ? readonly DeepReadonly<Item>[]
      : T extends object
        ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
        : T

export type StyleValueMap = Record<string, unknown>

export interface NodeStyle {
  readonly container?: StyleValueMap
  readonly content?: StyleValueMap
  readonly surface?: StyleValueMap
}

export type NodeOwner
  = | { readonly kind: 'root' }
    | { readonly kind: 'container', readonly containerId: string, readonly regionId: string }

export type NodeDestination
  = | ({ readonly kind: 'root' } & { readonly index?: number })
    | ({ readonly kind: 'container', readonly containerId: string, readonly regionId: string } & { readonly index?: number })

export interface CreationBlockReason {
  readonly code?: string
  readonly messageKey?: string
  readonly message?: string
}

export interface ContainerDropDecision extends CreationBlockReason {
  readonly allowed: boolean
  readonly details?: Record<string, unknown>
}

export interface DragTarget {
  readonly sourceNodeId: string | null
  readonly widgetType: string | null
}

export interface HistoryState {
  readonly canUndo: boolean
  readonly canRedo: boolean
  readonly undoCount: number
  readonly redoCount: number
}

export type OwnerResolutionResult<T>
  = | { readonly ok: true, readonly value: T }
    | { readonly ok: false, readonly code: string, readonly message?: string }

export interface SchemaDiagnostic {
  readonly code: string
  readonly severity: 'warning' | 'error'
  readonly nodeId?: string
  readonly ownerId?: string
  readonly regionId?: string
  readonly path?: string
  readonly details?: Record<string, unknown>
}

const LENGTH_STYLE_KEYS = new Set([
  'bottom',
  'height',
  'left',
  'margin',
  'marginBlock',
  'marginBlockEnd',
  'marginBlockStart',
  'marginBottom',
  'marginInline',
  'marginInlineEnd',
  'marginInlineStart',
  'marginLeft',
  'marginRight',
  'marginTop',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'padding',
  'paddingBlock',
  'paddingBlockEnd',
  'paddingBlockStart',
  'paddingBottom',
  'paddingInline',
  'paddingInlineEnd',
  'paddingInlineStart',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'right',
  'top',
  'width',
])

export function normalizeStyleValueMap(style: DeepReadonly<StyleValueMap> | undefined): StyleValueMap | undefined {
  if (!style)
    return undefined
  const normalized: StyleValueMap = {}
  for (const [key, value] of Object.entries(style))
    normalized[key] = typeof value === 'number' && value !== 0 && LENGTH_STYLE_KEYS.has(key) ? `${value}px` : value
  return normalized
}

export function isInsertAllowed(insertIndex: number, lockedIndices: ReadonlySet<number>): boolean {
  for (const index of lockedIndices) {
    if (index >= insertIndex)
      return false
  }
  return true
}

export function isMoveAllowed(sourceIndex: number, targetIndex: number, lockedIndices: ReadonlySet<number>): boolean {
  if (lockedIndices.has(sourceIndex))
    return false
  for (const lockedIndex of lockedIndices) {
    if (lockedIndex === sourceIndex)
      continue
    if (sourceIndex < lockedIndex ? targetIndex > lockedIndex - 1 : targetIndex <= lockedIndex)
      return false
  }
  return true
}

export function isRemoveAllowed(removeIndex: number, lockedIndices: ReadonlySet<number>): boolean {
  for (const lockedIndex of lockedIndices) {
    if (lockedIndex > removeIndex)
      return false
  }
  return true
}

export function getValidDropIndices(children: readonly NodeDefinition[], lockedIndices: ReadonlySet<number>, sourceNodeId: string | null): Set<number> {
  const valid = new Set<number>()
  const count = children.length
  if (lockedIndices.size === 0) {
    for (let index = 0; index <= count; index++)
      valid.add(index)
    return valid
  }
  if (sourceNodeId === null) {
    for (let index = 0; index <= count; index++) {
      if (isInsertAllowed(index, lockedIndices))
        valid.add(index)
    }
    return valid
  }
  const sourceIndex = children.findIndex(item => item.id === sourceNodeId)
  if (sourceIndex === -1)
    return valid
  for (let visualIndex = 0; visualIndex <= count; visualIndex++) {
    const targetIndex = visualIndex > sourceIndex ? visualIndex - 1 : visualIndex
    if (targetIndex === sourceIndex || isMoveAllowed(sourceIndex, targetIndex, lockedIndices))
      valid.add(visualIndex)
  }
  return valid
}

export function findNearestValidIndex(rawIndex: number, validIndices: ReadonlySet<number>): number | null {
  if (validIndices.size === 0)
    return null
  if (validIndices.has(rawIndex))
    return rawIndex
  let best: number | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  for (const index of validIndices) {
    const distance = Math.abs(index - rawIndex)
    if (distance < bestDistance) {
      bestDistance = distance
      best = index
    }
  }
  return best
}

export function clampInsertIndex(index: number | undefined, length: number): number {
  return Math.max(0, Math.min(index ?? length, length))
}
