import type {
  DesignerSchema,
  RegistryInstance,
  SchemaValidationResult,
} from './types'
import { buildSchemaIndex } from './schema-index'
import { cloneSchema } from './schema-utils'

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function collectSchemaStructuralDiagnostics(input: unknown): SchemaValidationResult['diagnostics'] {
  const diagnostics: SchemaValidationResult['diagnostics'] = []
  if (!isRecord(input)
    || typeof input.version !== 'string'
    || input.version.length === 0
    || !Object.hasOwn(input, 'root')
    || !input.root) {
    diagnostics.push({ code: 'SCHEMA_ENVELOPE_INVALID', severity: 'error' })
    return diagnostics
  }
  if (!isRecord(input.globalConfig)) {
    diagnostics.push({ code: 'SCHEMA_GLOBAL_CONFIG_INVALID', severity: 'error', path: 'globalConfig' })
    return diagnostics
  }

  const root = input.root
  if (!isRecord(root)
    || typeof root.id !== 'string'
    || typeof root.type !== 'string'
    || !isRecord(root.props)) {
    diagnostics.push({ code: 'SCHEMA_ROOT_INVALID', severity: 'error', path: 'root' })
    return diagnostics
  }

  const inspectNode = (value: unknown, path: string, ownerId?: string, regionId?: string): void => {
    if (!isRecord(value)
      || typeof value.id !== 'string'
      || typeof value.type !== 'string'
      || !isRecord(value.props)) {
      diagnostics.push({
        code: 'SCHEMA_NODE_INVALID',
        severity: 'error',
        path,
        nodeId: isRecord(value) && typeof value.id === 'string' ? value.id : undefined,
        ownerId,
        regionId,
      })
      return
    }
    const nodeId = value.id as string
    if (value.container === undefined)
      return
    if (!isRecord(value.container) || typeof value.container.variant !== 'string') {
      diagnostics.push({
        code: 'CONTAINER_STATE_INVALID',
        severity: 'error',
        nodeId,
        path: `${path}.container`,
      })
      return
    }
    if (!isRecord(value.container.regions)) {
      diagnostics.push({
        code: 'CONTAINER_REGIONS_INVALID',
        severity: 'error',
        nodeId,
        path: `${path}.container.regions`,
      })
      return
    }
    for (const [childRegionId, children] of Object.entries(value.container.regions)) {
      if (!Array.isArray(children)) {
        diagnostics.push({
          code: 'CONTAINER_REGION_CHILDREN_INVALID',
          severity: 'error',
          nodeId,
          regionId: childRegionId,
          path: `${path}.container.regions.${childRegionId}`,
        })
        continue
      }
      children.forEach((child, index) => inspectNode(
        child,
        `${path}.container.regions.${childRegionId}.${index}`,
        nodeId,
        childRegionId,
      ))
    }
  }

  if (root.children !== undefined && !Array.isArray(root.children)) {
    diagnostics.push({ code: 'SCHEMA_CHILDREN_INVALID', severity: 'error', path: 'root.children' })
    return diagnostics
  }
  for (const [index, node] of (root.children ?? []).entries())
    inspectNode(node, `root.children.${index}`)
  return diagnostics
}

export function validateSchema(
  input: DesignerSchema,
  registry: RegistryInstance,
): SchemaValidationResult {
  const schema = cloneSchema(input)
  const structuralDiagnostics = collectSchemaStructuralDiagnostics(schema)
  if (structuralDiagnostics.length > 0) {
    return {
      valid: false,
      schema,
      diagnostics: structuralDiagnostics,
    }
  }
  const indexed = buildSchemaIndex(schema)
  const diagnostics = [...indexed.diagnostics]

  for (const node of schema.root.children ?? []) {
    for (const [regionId, children] of Object.entries(node.container?.regions ?? {})) {
      for (const child of children) {
        if (registry.getWidget(child.type)?.container && !child.container) {
          diagnostics.push({
            code: 'SCHEMA_CONTAINER_NESTED',
            severity: 'error',
            nodeId: child.id,
            ownerId: node.id,
            regionId,
          })
        }
        if (child.layout?.placement !== undefined || child.layout?.order !== undefined) {
          diagnostics.push({
            code: 'CONTAINER_CHILD_PAGE_LAYOUT_FORBIDDEN',
            severity: 'error',
            nodeId: child.id,
            ownerId: node.id,
            regionId,
          })
        }
      }
    }

    const meta = registry.getWidget(node.type)
    if (node.container && !meta) {
      diagnostics.push({
        code: 'UNRESOLVED_CONTAINER_TYPE',
        severity: 'warning',
        nodeId: node.id,
      })
      continue
    }
    if (node.container && !meta?.container) {
      diagnostics.push({
        code: 'CONTAINER_CAPABILITY_MISMATCH',
        severity: 'error',
        nodeId: node.id,
      })
      continue
    }
    if (!node.container && meta?.container) {
      diagnostics.push({
        code: 'CONTAINER_STATE_MISSING',
        severity: 'error',
        nodeId: node.id,
      })
      continue
    }
    if (!node.container || !meta?.container)
      continue

    const variant = meta.container.variants[node.container.variant]
    if (!variant) {
      diagnostics.push({
        code: 'CONTAINER_VARIANT_UNKNOWN',
        severity: 'error',
        nodeId: node.id,
      })
      continue
    }

    const knownRegionIds = new Set(variant.regions.map(region => region.id))
    for (const regionId of Object.keys(node.container.regions)) {
      if (!knownRegionIds.has(regionId)) {
        diagnostics.push({
          code: 'CONTAINER_REGION_UNKNOWN',
          severity: 'error',
          nodeId: node.id,
          regionId,
        })
      }
    }
    for (const region of variant.regions)
      node.container.regions[region.id] ??= []

    for (const region of variant.regions) {
      const children = node.container.regions[region.id]
      const { minItems = 0, maxItems = Number.POSITIVE_INFINITY } = region.constraints ?? {}
      if (children.length < minItems) {
        diagnostics.push({
          code: 'CONTAINER_REGION_MIN_ITEMS',
          severity: 'error',
          nodeId: node.id,
          regionId: region.id,
          details: { actual: children.length, minItems },
        })
      }
      if (children.length > maxItems) {
        diagnostics.push({
          code: 'CONTAINER_REGION_MAX_ITEMS',
          severity: 'error',
          nodeId: node.id,
          regionId: region.id,
          details: { actual: children.length, maxItems },
        })
      }
      for (const child of children) {
        if (region.constraints?.includeTypes
          && !region.constraints.includeTypes.includes(child.type)) {
          diagnostics.push({
            code: 'CONTAINER_TYPE_NOT_INCLUDED',
            severity: 'error',
            nodeId: child.id,
            ownerId: node.id,
            regionId: region.id,
          })
        }
        if (region.constraints?.excludeTypes?.includes(child.type)) {
          diagnostics.push({
            code: 'CONTAINER_TYPE_EXCLUDED',
            severity: 'error',
            nodeId: child.id,
            ownerId: node.id,
            regionId: region.id,
          })
        }
      }
    }
  }

  return {
    valid: diagnostics.every(item => item.severity !== 'error'),
    schema,
    diagnostics,
  }
}
