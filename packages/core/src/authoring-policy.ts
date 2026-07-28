import type {
  BehaviorPredicate,
  CommandExecutionResult,
  CreatableBehaviorResult,
  CreatableDecision,
  DeepReadonly,
  DesignerSchema,
  InstanceBehaviorContext,
  RegistryInstance,
  ResolvedAuthoringPolicy,
  SchemaNode,
  TypeBehaviorContext,
  WidgetMeta,
} from './types'

type AuthoringFailure = Extract<CommandExecutionResult, { ok: false }>
type AuthoringValidationResult = { ok: true } | AuthoringFailure

function warnPredicateFailure(capability: string, widgetType: string, error?: unknown): void {
  const suffix = error === undefined
    ? 'returned a non-boolean value'
    : `threw: ${error instanceof Error ? error.message : String(error)}`
  console.warn(`[dragcraft/core] authoring predicate "${capability}" for widget "${widgetType}" ${suffix}; denying capability`)
}

function resolveBooleanCapability(
  field: BehaviorPredicate<InstanceBehaviorContext> | undefined,
  ctx: InstanceBehaviorContext,
  defaultValue: boolean,
  capability: string,
  widgetType: string,
): boolean {
  if (field === undefined)
    return defaultValue
  if (typeof field !== 'function')
    return field

  try {
    const result: unknown = field(ctx)
    if (typeof result === 'boolean')
      return result
    warnPredicateFailure(capability, widgetType)
  }
  catch (error) {
    warnPredicateFailure(capability, widgetType, error)
  }
  return false
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}

function normalizeCreatableResult(
  result: unknown,
  widgetType: string,
): CreatableDecision {
  if (typeof result === 'boolean')
    return { allowed: result }
  if (result === null || typeof result !== 'object' || Array.isArray(result)) {
    warnPredicateFailure('creatable', widgetType)
    return { allowed: false, code: 'AUTHORING_PREDICATE_INVALID' }
  }

  const decision = result as Record<string, unknown>
  if (typeof decision.allowed !== 'boolean'
    || !isOptionalString(decision.code)
    || !isOptionalString(decision.messageKey)
    || !isOptionalString(decision.message)) {
    warnPredicateFailure('creatable', widgetType)
    return { allowed: false, code: 'AUTHORING_PREDICATE_INVALID' }
  }

  return {
    allowed: decision.allowed,
    ...(decision.code === undefined ? {} : { code: decision.code }),
    ...(decision.messageKey === undefined ? {} : { messageKey: decision.messageKey }),
    ...(decision.message === undefined ? {} : { message: decision.message }),
  }
}

function walkNodeSubtree(
  node: DeepReadonly<SchemaNode>,
  visitor: (node: DeepReadonly<SchemaNode>) => AuthoringFailure | undefined,
): AuthoringFailure | undefined {
  const failure = visitor(node)
  if (failure)
    return failure
  for (const children of Object.values(node.container?.regions ?? {})) {
    for (const child of children) {
      const childFailure = walkNodeSubtree(child, visitor)
      if (childFailure)
        return childFailure
    }
  }
  return undefined
}

function collectSchemaNodes(schema: DeepReadonly<DesignerSchema>): Map<string, DeepReadonly<SchemaNode>> {
  const nodes = new Map<string, DeepReadonly<SchemaNode>>()
  for (const node of schema.root.children ?? []) {
    walkNodeSubtree(node, (current) => {
      nodes.set(current.id, current)
      return undefined
    })
  }
  return nodes
}

export function isSchemaManagedWidget(meta: WidgetMeta | undefined): boolean {
  return meta?.authoring === 'schema-managed'
}

export function isWidgetVisibleInMaterialPanel(meta: WidgetMeta): boolean {
  return !isSchemaManagedWidget(meta)
}

export function resolveAuthoringCapability(
  meta: WidgetMeta | undefined,
  ctx: InstanceBehaviorContext,
  capability: 'selectable' | 'configurable' | 'draggable' | 'sortable' | 'deletable' | 'variantChangeable',
): boolean {
  const schemaManaged = isSchemaManagedWidget(meta)
  const defaultValue = capability === 'draggable'
    || capability === 'deletable'
    || capability === 'variantChangeable'
    ? !schemaManaged
    : true
  return resolveBooleanCapability(
    meta?.[capability],
    ctx,
    defaultValue,
    capability,
    meta?.type ?? ctx.node.type,
  )
}

export function resolveAuthoringPolicy(
  meta: WidgetMeta | undefined,
  ctx: InstanceBehaviorContext,
): ResolvedAuthoringPolicy {
  const schemaManaged = isSchemaManagedWidget(meta)
  return {
    schemaManaged,
    materialVisible: !schemaManaged,
    duplicable: !schemaManaged,
    selectable: resolveAuthoringCapability(meta, ctx, 'selectable'),
    configurable: resolveAuthoringCapability(meta, ctx, 'configurable'),
    draggable: resolveAuthoringCapability(meta, ctx, 'draggable'),
    sortable: resolveAuthoringCapability(meta, ctx, 'sortable'),
    deletable: resolveAuthoringCapability(meta, ctx, 'deletable'),
    variantChangeable: resolveAuthoringCapability(meta, ctx, 'variantChangeable'),
  }
}

export function resolveWidgetCreation(
  meta: WidgetMeta | undefined,
  ctx: TypeBehaviorContext,
): CreatableDecision {
  if (isSchemaManagedWidget(meta)) {
    return {
      allowed: false,
      code: 'SCHEMA_MANAGED_CREATION_FORBIDDEN',
    }
  }
  if (meta?.creatable === undefined)
    return { allowed: true }

  try {
    const result: CreatableBehaviorResult = typeof meta.creatable === 'function'
      ? meta.creatable(ctx)
      : meta.creatable
    return normalizeCreatableResult(result, ctx.widgetType)
  }
  catch (error) {
    warnPredicateFailure('creatable', ctx.widgetType, error)
    return { allowed: false, code: 'AUTHORING_PREDICATE_FAILED' }
  }
}

export function validateSubtreeCreation(
  node: DeepReadonly<SchemaNode>,
  schema: DeepReadonly<DesignerSchema>,
  registry: RegistryInstance,
): AuthoringValidationResult {
  const failure = walkNodeSubtree(node, (candidate) => {
    const decision = resolveWidgetCreation(registry.getWidget(candidate.type), {
      widgetType: candidate.type,
      schema,
    })
    if (decision.allowed)
      return undefined
    return {
      ok: false,
      code: decision.code ?? 'NODE_NOT_CREATABLE',
      ...(decision.messageKey === undefined ? {} : { messageKey: decision.messageKey }),
      ...(decision.message === undefined ? {} : { message: decision.message }),
      ...(candidate.id === node.id
        ? {}
        : { details: { nodeId: candidate.id, widgetType: candidate.type } }),
    }
  })
  return failure ?? { ok: true }
}

export function validateSubtreeDeletion(
  node: DeepReadonly<SchemaNode>,
  schema: DeepReadonly<DesignerSchema>,
  registry: RegistryInstance,
): AuthoringValidationResult {
  const failure = walkNodeSubtree(node, (candidate) => {
    const deletable = resolveAuthoringCapability(registry.getWidget(candidate.type), {
      node: candidate,
      schema,
    }, 'deletable')
    return deletable
      ? undefined
      : {
          ok: false,
          code: 'NODE_NOT_DELETABLE',
          ...(candidate.id === node.id
            ? {}
            : { details: { nodeId: candidate.id, widgetType: candidate.type } }),
        }
  })
  return failure ?? { ok: true }
}

export function validateAuthoringTransition(
  before: DeepReadonly<DesignerSchema>,
  after: DeepReadonly<DesignerSchema>,
  registry: RegistryInstance,
): AuthoringValidationResult {
  const beforeNodes = collectSchemaNodes(before)
  const afterNodes = collectSchemaNodes(after)

  for (const node of afterNodes.values()) {
    const previous = beforeNodes.get(node.id)
    if (previous?.type === node.type)
      continue
    const decision = resolveWidgetCreation(registry.getWidget(node.type), {
      widgetType: node.type,
      schema: before,
    })
    if (!decision.allowed) {
      return {
        ok: false,
        code: decision.code ?? 'NODE_NOT_CREATABLE',
        ...(decision.messageKey === undefined ? {} : { messageKey: decision.messageKey }),
        ...(decision.message === undefined ? {} : { message: decision.message }),
        details: { nodeId: node.id, widgetType: node.type },
      }
    }
  }

  for (const node of beforeNodes.values()) {
    const next = afterNodes.get(node.id)
    if (next?.type === node.type)
      continue
    const deletable = resolveAuthoringCapability(
      registry.getWidget(node.type),
      { node, schema: before },
      'deletable',
    )
    if (!deletable) {
      return {
        ok: false,
        code: 'NODE_NOT_DELETABLE',
        details: { nodeId: node.id, widgetType: node.type },
      }
    }
  }

  return { ok: true }
}
