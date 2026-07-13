import type {
  ContainerState,
  ContainerStateCreationResult,
  CreateRegisteredNode,
  DesignerSchema,
  PlacementDecision,
  RegistryInstance,
  ResolvePlacementContext,
  SchemaIndexResult,
  SchemaNode,
} from './types'
import { cloneDeep, generateShortId } from '@dragcraft/utils'
import { buildSchemaIndex } from './schema-index'
import { cloneSchema } from './schema-utils'
import { validateSchema } from './schema-validation'

function placementFailureDetails(ctx: ResolvePlacementContext): Record<string, unknown> {
  return {
    nodeId: ctx.child.id,
    containerId: ctx.callbackContext.container.id,
    regionId: ctx.region.id,
  }
}

export function resolvePlacementDecision(
  ctx: ResolvePlacementContext,
): PlacementDecision {
  if (ctx.child.container || ctx.childHasContainerCapability)
    return { allowed: false, code: 'CONTAINER_NESTING_FORBIDDEN' }

  const constraints = ctx.region.constraints ?? {}
  if (constraints.includeTypes && !constraints.includeTypes.includes(ctx.child.type))
    return { allowed: false, code: 'CONTAINER_TYPE_NOT_INCLUDED' }
  if (constraints.excludeTypes?.includes(ctx.child.type))
    return { allowed: false, code: 'CONTAINER_TYPE_EXCLUDED' }
  if (ctx.targetCount + 1 > (constraints.maxItems ?? Number.POSITIVE_INFINITY))
    return { allowed: false, code: 'CONTAINER_REGION_MAX_ITEMS' }

  try {
    const decision = ctx.definition.canPlace?.(ctx.callbackContext) ?? { allowed: true }
    if (!decision || typeof decision.allowed !== 'boolean') {
      return {
        allowed: false,
        code: 'CONTAINER_PLACEMENT_PREDICATE_INVALID',
        details: placementFailureDetails(ctx),
      }
    }
    return decision
  }
  catch (error) {
    return {
      allowed: false,
      code: 'CONTAINER_PLACEMENT_PREDICATE_FAILED',
      message: error instanceof Error ? error.message : String(error),
      details: placementFailureDetails(ctx),
    }
  }
}

function isContainerState(value: unknown): value is ContainerState {
  if (!value || typeof value !== 'object')
    return false

  const candidate = value as Partial<ContainerState>
  return typeof candidate.variant === 'string'
    && Boolean(candidate.regions)
    && typeof candidate.regions === 'object'
    && !Array.isArray(candidate.regions)
    && Object.values(candidate.regions).every(Array.isArray)
}

function buildCandidateIndex(
  schema: DesignerSchema,
  candidateNode: SchemaNode,
): SchemaIndexResult {
  return buildSchemaIndex({
    version: schema.version,
    globalConfig: {},
    root: {
      id: schema.root.id,
      type: schema.root.type,
      props: {},
      children: [candidateNode],
    },
  })
}

export function createContainerState(
  node: SchemaNode,
  schema: DesignerSchema,
  registry: RegistryInstance,
  createNode: CreateRegisteredNode,
): ContainerStateCreationResult {
  const definition = registry.getWidget(node.type)?.container
  if (!definition)
    return { ok: false, code: 'CONTAINER_DEFINITION_MISSING' }

  const variant = definition.variants[definition.defaultVariant]
  if (!variant)
    return { ok: false, code: 'CONTAINER_DEFAULT_VARIANT_MISSING' }

  const emptyState: ContainerState = {
    variant: definition.defaultVariant,
    regions: Object.fromEntries(variant.regions.map(region => [region.id, []])),
  }

  let state: unknown = emptyState
  try {
    state = cloneDeep(definition.createInitialState
      ? definition.createInitialState({
          containerNode: cloneDeep(node),
          schema: cloneSchema(schema),
          createNode,
        })
      : emptyState)
  }
  catch (error) {
    return {
      ok: false,
      code: 'CONTAINER_INITIAL_STATE_FAILED',
      message: error instanceof Error ? error.message : String(error),
      details: { nodeId: node.id, containerId: node.id },
    }
  }

  if (!isContainerState(state)) {
    return {
      ok: false,
      code: 'CONTAINER_INITIAL_STATE_INVALID',
      details: {
        nodeId: node.id,
        containerId: node.id,
        diagnostics: [],
      },
    }
  }

  const candidateNode = cloneDeep(node)
  candidateNode.container = state
  try {
    const candidateIndex = buildCandidateIndex(schema, candidateNode)
    const candidateNodeIds = new Set(candidateIndex.index.keys())

    const candidateSchema = cloneSchema(schema)
    candidateSchema.root.children ??= []
    candidateSchema.root.children.push(candidateNode)
    const validation = validateSchema(candidateSchema, registry)
    const ownDiagnostics = validation.diagnostics.filter(diagnostic =>
      diagnostic.nodeId === node.id
      || diagnostic.ownerId === node.id
      || (diagnostic.nodeId !== undefined && candidateNodeIds.has(diagnostic.nodeId)),
    )
    if (ownDiagnostics.some(diagnostic => diagnostic.severity === 'error')) {
      return {
        ok: false,
        code: 'CONTAINER_INITIAL_STATE_INVALID',
        details: {
          nodeId: node.id,
          containerId: node.id,
          diagnostics: ownDiagnostics,
        },
      }
    }
  }
  catch (error) {
    return {
      ok: false,
      code: 'CONTAINER_INITIAL_STATE_INVALID',
      message: error instanceof Error ? error.message : String(error),
      details: {
        nodeId: node.id,
        containerId: node.id,
        diagnostics: [],
      },
    }
  }

  return { ok: true, state: cloneDeep(state) }
}

export function createRegisteredNode(
  registry: RegistryInstance,
  createId: () => string = generateShortId,
): CreateRegisteredNode {
  return (type, overrides = {}) => {
    const meta = registry.getWidget(type)
    if (!meta)
      throw new Error(`Cannot initialize unregistered widget type: ${type}`)

    const layout = overrides.layout !== undefined
      ? cloneDeep(overrides.layout)
      : cloneDeep(meta.defaultLayout)
    if (layout) {
      delete layout.placement
      delete layout.order
    }

    return {
      id: createId(),
      type,
      props: {
        ...cloneDeep(meta.defaultProps),
        ...cloneDeep(overrides.props ?? {}),
      },
      style: overrides.style !== undefined
        ? cloneDeep(overrides.style)
        : cloneDeep(meta.defaultStyle),
      layout,
    }
  }
}
