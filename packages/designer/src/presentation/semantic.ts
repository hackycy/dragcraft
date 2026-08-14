import type { DocumentSchema, NodeDefinition } from '@dragcraft/core'

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
  = | { readonly kind: 'root', readonly sortScope?: string }
    | { readonly kind: 'container', readonly containerId: string, readonly regionId: string }

export type NodeDestination
  = | ({ readonly kind: 'root', readonly sortScope?: string } & { readonly index?: number })
    | ({ readonly kind: 'container', readonly containerId: string, readonly regionId: string } & { readonly index?: number })

export interface CreationBlockReason {
  readonly code?: string
  readonly messageKey?: string
  readonly message?: string
}

export interface PlacementDecision extends CreationBlockReason {
  readonly allowed: boolean
  readonly details?: Record<string, unknown>
}

export type ContainerRegionId = string
export type ContainerVariantId = string

export interface ContainerRegionConstraints {
  readonly includeTypes?: readonly string[]
  readonly excludeTypes?: readonly string[]
  readonly minItems?: number
  readonly maxItems?: number
}

export interface ContainerRegionDefinition {
  readonly id: ContainerRegionId
  readonly title: string
  readonly titleKey?: string
  readonly constraints?: ContainerRegionConstraints
}

export interface ContainerVariantDefinition {
  readonly title: string
  readonly titleKey?: string
  readonly regions: readonly ContainerRegionDefinition[]
}

export interface ContainerDefinition {
  readonly defaultVariant: string
  readonly variants: Readonly<Record<string, ContainerVariantDefinition>>
  readonly canPlace?: (context: Record<string, unknown>) => PlacementDecision
}

export interface ContainerState {
  readonly variant: string
  readonly regions: Readonly<Record<ContainerRegionId, readonly NodeDefinition[]>>
}

export interface ContainerPlanRegion {
  readonly definition: ContainerRegionDefinition
  readonly nodes: readonly NodeDefinition[]
  readonly isEmpty: boolean
}

export interface ContainerPlan {
  readonly containerId: string
  readonly variant: ContainerVariantDefinition
  readonly regions: readonly ContainerPlanRegion[]
}

export type ContainerPlanResult
  = | { readonly ok: true, readonly plan: ContainerPlan }
    | { readonly ok: false, readonly code: 'CONTAINER_UNRESOLVED' | 'CONTAINER_VARIANT_UNKNOWN', readonly containerId: string }

export interface NodeLayout {
  readonly placement?: NodePlacement
  readonly order?: number
  readonly visible?: boolean | ((context: { readonly node: NodeDefinition, readonly schema: DocumentSchema }) => boolean)
}

export type LayoutEdge = 'block-start' | 'block-end' | 'inline-start' | 'inline-end'
export type LayoutAnchor = 'start' | 'center' | 'end'
export type LayoutChromePosition = 'fixed' | 'sticky' | 'flow'
export type LayoutLayerMode = 'framework' | 'self'
export type LayoutReserveMode = 'measure' | 'size' | 'none'
export type LayoutAvoidTarget = 'safe-area' | 'chrome' | 'viewport'
export interface LayoutReserveSpec { readonly mode?: LayoutReserveMode, readonly size?: string | number }
export interface LayoutOffsets {
  readonly blockStart?: string | number
  readonly blockEnd?: string | number
  readonly inlineStart?: string | number
  readonly inlineEnd?: string | number
}
export type NodePlacement
  = | { readonly kind: 'flow', readonly region?: string, readonly sortScope?: string | false }
    | { readonly kind: 'chrome', readonly edge: LayoutEdge, readonly position?: LayoutChromePosition, readonly reserve?: LayoutReserveSpec, readonly avoidContent?: boolean }
    | { readonly kind: 'layer', readonly layer?: string, readonly mode?: LayoutLayerMode, readonly anchor?: { readonly block?: LayoutAnchor, readonly inline?: LayoutAnchor }, readonly offset?: LayoutOffsets, readonly avoid?: readonly LayoutAvoidTarget[] }

export interface ResolvedFlowPlacement { readonly kind: 'flow', readonly region: string, readonly sortScope: string | false }
export interface ResolvedChromePlacement { readonly kind: 'chrome', readonly edge: LayoutEdge, readonly position: LayoutChromePosition, readonly reserve: { readonly mode: LayoutReserveMode, readonly size?: string | number }, readonly avoidContent: boolean }
export interface ResolvedLayerPlacement { readonly kind: 'layer', readonly layer: string, readonly mode: LayoutLayerMode, readonly anchor: { readonly block?: LayoutAnchor, readonly inline?: LayoutAnchor }, readonly offset?: LayoutOffsets, readonly avoid: readonly LayoutAvoidTarget[] }
export type ResolvedNodePlacement = ResolvedFlowPlacement | ResolvedChromePlacement | ResolvedLayerPlacement
export interface ResolvedNodeLayout {
  readonly placement: ResolvedNodePlacement
  readonly region?: string
  readonly sortScope: string | false
  readonly order?: number
  readonly visible: boolean
}

export interface LayoutNodeEntry { readonly node: NodeDefinition, readonly arrayIndex: number, readonly layout: ResolvedNodeLayout }
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

export interface BehaviorContext {
  readonly node: DeepReadonly<NodeDefinition>
  readonly schema: DeepReadonly<DocumentSchema>
}
export type BehaviorPredicate<Context = BehaviorContext> = boolean | ((context: Context) => boolean)
export type CreatablePredicate = boolean | CreationBlockReason & { readonly allowed: boolean } | ((context: { readonly widgetType: string, readonly schema: DeepReadonly<DocumentSchema> }) => boolean | CreationBlockReason & { readonly allowed: boolean })

export interface CoreWidgetMeta {
  readonly type: string
  readonly title: string
  readonly titleKey?: string
  readonly group: string
  readonly icon?: string
  readonly defaultProps: Record<string, unknown>
  readonly defaultStyle?: NodeStyle
  readonly formSchema: { readonly sections: readonly unknown[] }
  readonly container?: ContainerDefinition
  readonly authoring?: 'schema-managed'
  readonly mask?: BehaviorPredicate
  readonly selectable?: BehaviorPredicate
  readonly draggable?: BehaviorPredicate
  readonly sortable?: BehaviorPredicate
  readonly deletable?: BehaviorPredicate
  readonly configurable?: BehaviorPredicate
  readonly variantChangeable?: BehaviorPredicate
  readonly defaultLayout?: NodeLayout
  readonly creatable?: CreatablePredicate
  readonly actions?: { readonly only?: readonly string[], readonly exclude?: readonly string[] }
}

export type WidgetMeta = CoreWidgetMeta

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

export interface ResolvedNodeDestination {
  readonly children: readonly NodeDefinition[]
  readonly destination: NodeDestination
  readonly container?: NodeDefinition
  readonly definition?: ContainerDefinition
  readonly variant?: ContainerVariantDefinition
  readonly region?: ContainerRegionDefinition
}

export const DEFAULT_LAYOUT_REGION = 'content'
export const DEFAULT_SORT_SCOPE = 'content'
export const DEFAULT_LAYER = 'float'

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

export function isSchemaManagedWidget(meta: WidgetMeta | undefined): boolean {
  return meta?.authoring === 'schema-managed'
}

export function isWidgetVisibleInMaterialPanel(meta: WidgetMeta): boolean {
  return !isSchemaManagedWidget(meta)
}

export function resolveAuthoringCapability(meta: WidgetMeta | undefined, node: DeepReadonly<NodeDefinition>, schema: DeepReadonly<DocumentSchema>, capability: 'selectable' | 'configurable' | 'draggable' | 'sortable' | 'deletable' | 'variantChangeable'): boolean {
  const defaultValue = capability === 'draggable' || capability === 'deletable' || capability === 'variantChangeable'
    ? !isSchemaManagedWidget(meta)
    : true
  const value = meta?.[capability]
  if (value === undefined)
    return defaultValue
  if (typeof value === 'boolean')
    return value
  try {
    const resolved = value({ node, schema })
    return typeof resolved === 'boolean' ? resolved : false
  }
  catch {
    return false
  }
}

export function resolveWidgetCreation(meta: WidgetMeta | undefined, widgetType: string, schema: DeepReadonly<DocumentSchema>): PlacementDecision {
  if (isSchemaManagedWidget(meta))
    return { allowed: false, code: 'SCHEMA_MANAGED_CREATION_FORBIDDEN' }
  if (meta?.creatable === undefined)
    return { allowed: true }
  try {
    const value = typeof meta.creatable === 'function' ? meta.creatable({ widgetType, schema }) : meta.creatable
    if (typeof value === 'boolean')
      return { allowed: value }
    if (value && typeof value === 'object' && typeof value.allowed === 'boolean')
      return value
  }
  catch {
    return { allowed: false, code: 'AUTHORING_PREDICATE_FAILED' }
  }
  return { allowed: false, code: 'AUTHORING_PREDICATE_INVALID' }
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

export function getValidDropIndices(children: readonly (NodeDefinition | LayoutNodeEntry)[], lockedIndices: ReadonlySet<number>, sourceNodeId: string | null): Set<number> {
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
  const sourceIndex = children.findIndex(item => 'node' in item ? item.node.id === sourceNodeId : item.id === sourceNodeId)
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

export function resolvePlacementDecision(context: {
  readonly definition: ContainerDefinition
  readonly region: ContainerRegionDefinition
  readonly child: NodeDefinition
  readonly childHasContainerCapability: boolean
  readonly targetCount: number
  readonly callbackContext: Record<string, unknown>
}): PlacementDecision {
  if (context.childHasContainerCapability)
    return { allowed: false, code: 'CONTAINER_NESTING_FORBIDDEN' }
  const constraints = context.region.constraints ?? {}
  if (constraints.includeTypes && !constraints.includeTypes.includes(context.child.type))
    return { allowed: false, code: 'CONTAINER_TYPE_NOT_INCLUDED' }
  if (constraints.excludeTypes?.includes(context.child.type))
    return { allowed: false, code: 'CONTAINER_TYPE_EXCLUDED' }
  if (context.targetCount + 1 > (constraints.maxItems ?? Number.POSITIVE_INFINITY))
    return { allowed: false, code: 'CONTAINER_REGION_MAX_ITEMS' }
  try {
    const result = context.definition.canPlace?.(context.callbackContext) ?? { allowed: true }
    return result && typeof result.allowed === 'boolean' ? result : { allowed: false, code: 'CONTAINER_PLACEMENT_PREDICATE_INVALID' }
  }
  catch (error) {
    return { allowed: false, code: 'CONTAINER_PLACEMENT_PREDICATE_FAILED', message: error instanceof Error ? error.message : String(error) }
  }
}
