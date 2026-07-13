import type {
  ChangeContainerVariantPayload,
  CommandContext,
  CommandResult,
  ContainerDefinition,
  ContainerState,
  ContainerVariantDefinition,
  ContainerVariantMigrationContext,
  ContainerVariantMigrationResult,
  SchemaNode,
} from '../types'
import { cloneDeep } from '@dragcraft/utils'
import { buildSchemaIndex } from '../schema-index'
import { cloneSchema } from '../schema-utils'
import { validateSchema } from '../schema-validation'

function sameRegionIds(
  left: ContainerVariantDefinition,
  right: ContainerVariantDefinition,
): boolean {
  const leftIds = left.regions.map(region => region.id).sort()
  const rightIds = right.regions.map(region => region.id).sort()
  return leftIds.length === rightIds.length
    && leftIds.every((id, index) => id === rightIds[index])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isSchemaNode(value: unknown): value is SchemaNode {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.type === 'string'
    && isRecord(value.props)
}

function isContainerState(value: unknown): value is ContainerState {
  if (!isRecord(value) || typeof value.variant !== 'string' || !isRecord(value.regions))
    return false
  return Object.values(value.regions).every(children =>
    Array.isArray(children) && children.every(isSchemaNode),
  )
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}

function invalidMigrationResult(containerId: string): ContainerVariantMigrationResult {
  return {
    allowed: false,
    code: 'CONTAINER_VARIANT_MIGRATION_INVALID',
    details: { containerId },
  }
}

function safelyMigrateVariant(
  definition: ContainerDefinition,
  ctx: ContainerVariantMigrationContext,
): ContainerVariantMigrationResult {
  if (!definition.migrateVariant)
    return { allowed: false, code: 'CONTAINER_VARIANT_MIGRATION_REQUIRED' }
  try {
    const result: unknown = cloneDeep(definition.migrateVariant(cloneDeep(ctx)))
    if (!isRecord(result) || typeof result.allowed !== 'boolean')
      return invalidMigrationResult(ctx.container.id)
    if (result.allowed) {
      if (!isContainerState(result.state))
        return invalidMigrationResult(ctx.container.id)
      return { allowed: true, state: result.state }
    }
    if (!isOptionalString(result.code)
      || !isOptionalString(result.messageKey)
      || !isOptionalString(result.message)
      || (result.details !== undefined && !isRecord(result.details))) {
      return invalidMigrationResult(ctx.container.id)
    }
    return {
      allowed: false,
      code: result.code,
      messageKey: result.messageKey,
      message: result.message,
      details: result.details,
    }
  }
  catch (error) {
    return {
      allowed: false,
      code: 'CONTAINER_VARIANT_MIGRATION_FAILED',
      message: error instanceof Error ? error.message : String(error),
      details: {
        nodeId: ctx.container.id,
        containerId: ctx.container.id,
        fromVariantId: ctx.fromVariantId,
        toVariantId: ctx.toVariantId,
      },
    }
  }
}

export function changeContainerVariantHandler(
  ctx: CommandContext,
  payload: ChangeContainerVariantPayload,
): CommandResult {
  const rawSchema = ctx.store.getRawSchema()
  const indexed = buildSchemaIndex(rawSchema).index.get(payload.containerId)
  const definition = indexed && ctx.registry.getWidget(indexed.node.type)?.container
  if (!indexed?.node.container || !definition)
    return { ok: false, code: 'CONTAINER_UNRESOLVED' }
  const fromVariantId = indexed.node.container.variant
  const from = definition.variants[fromVariantId]
  const to = definition.variants[payload.variant]
  if (!from || !to)
    return { ok: false, code: 'CONTAINER_VARIANT_UNKNOWN' }

  const result: ContainerVariantMigrationResult = sameRegionIds(from, to)
    ? {
        allowed: true,
        state: { ...cloneDeep(indexed.node.container), variant: payload.variant },
      }
    : safelyMigrateVariant(definition, {
        schema: rawSchema,
        container: indexed.node,
        fromVariantId,
        toVariantId: payload.variant,
        fromVariant: from,
        toVariant: to,
        state: indexed.node.container,
      })
  if (!result.allowed) {
    return {
      ok: false,
      code: result.code ?? 'CONTAINER_VARIANT_MIGRATION_REJECTED',
      message: result.message,
    }
  }
  if (result.state.variant !== payload.variant)
    return { ok: false, code: 'CONTAINER_VARIANT_MIGRATION_TARGET_MISMATCH' }

  const candidate = cloneSchema(rawSchema)
  const candidateNode = buildSchemaIndex(candidate).index.get(indexed.node.id)?.node
  if (!candidateNode)
    return { ok: false, code: 'CONTAINER_NOT_FOUND' }
  candidateNode.container = cloneDeep(result.state)
  const validation = validateSchema(candidate, ctx.registry)
  if (!validation.valid) {
    return {
      ok: false,
      code: 'CONTAINER_VARIANT_MIGRATION_INVALID',
      details: { diagnostics: validation.diagnostics },
    }
  }

  const validatedState = buildSchemaIndex(validation.schema).index.get(indexed.node.id)?.node.container
  if (!validatedState)
    return { ok: false, code: 'CONTAINER_VARIANT_MIGRATION_INVALID' }
  indexed.node.container = cloneDeep(validatedState)
  return {
    ok: true,
    eventPayload: {
      containerId: indexed.node.id,
      fromVariant: fromVariantId,
      toVariant: payload.variant,
    },
  }
}
