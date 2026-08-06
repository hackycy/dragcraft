import type { SchemaDefinitionSnapshot } from '../definitions/types'
import type { DeepReadonly, DocumentSchema } from '../document/types'
import type { DiagnosticReport, SchemaDiagnostic } from './diagnostics'
import type { ResolvedDocument } from './resolved-document'
import { appendJsonPointer, decodeDocumentSchema } from '../document/json'
import { createDiagnosticReport, sortDiagnostics } from './diagnostics'
import { createResolvedDocument } from './resolved-document'

export interface ResolveSchemaOptions {
  readonly maxDiagnostics?: number
}

export type SchemaResolution
  = | {
    readonly status: 'rejected'
    readonly diagnostics: DiagnosticReport
  }
  | {
    readonly status: 'ready' | 'degraded' | 'conflicted'
    readonly document: ResolvedDocument
    readonly diagnostics: DiagnosticReport
  }

function collectStructuralDiagnostics(schema: DeepReadonly<DocumentSchema>): SchemaDiagnostic[] {
  const diagnostics: SchemaDiagnostic[] = []
  const nodeIds = new Set<string>()
  for (const [index, node] of schema.nodes.entries()) {
    if (nodeIds.has(node.id)) {
      diagnostics.push({
        code: 'NODE_ID_DUPLICATE',
        phase: 'structure',
        severity: 'error',
        path: `/nodes/${index}/id`,
        nodeId: node.id,
      })
    }
    else {
      nodeIds.add(node.id)
    }
  }
  const ownedNodeIds = new Set<string>()
  const rootOwnedNodeIds = new Set(schema.structure.root)
  for (const [index, nodeId] of schema.structure.root.entries()) {
    if (ownedNodeIds.has(nodeId)) {
      diagnostics.push({
        code: 'NODE_MULTIPLE_OWNERS',
        phase: 'structure',
        severity: 'error',
        path: `/structure/root/${index}`,
        nodeId,
      })
    }
    else {
      ownedNodeIds.add(nodeId)
    }
    if (!nodeIds.has(nodeId)) {
      diagnostics.push({
        code: 'NODE_REFERENCE_MISSING',
        phase: 'structure',
        severity: 'error',
        path: `/structure/root/${index}`,
        nodeId,
      })
    }
  }
  for (const [containerId, container] of Object.entries(schema.structure.containers)) {
    const containerPath = appendJsonPointer('/structure/containers', containerId)
    if (!nodeIds.has(containerId)) {
      diagnostics.push({
        code: 'CONTAINER_OWNER_MISSING',
        phase: 'structure',
        severity: 'error',
        path: containerPath,
        containerId,
      })
    }
    else if (!rootOwnedNodeIds.has(containerId)) {
      diagnostics.push({
        code: 'CONTAINER_OWNER_NOT_ROOT',
        phase: 'structure',
        severity: 'error',
        path: containerPath,
        containerId,
      })
    }
    for (const [regionId, children] of Object.entries(container.regions)) {
      const regionPath = appendJsonPointer(`${containerPath}/regions`, regionId)
      for (const [index, nodeId] of children.entries()) {
        const path = `${regionPath}/${index}`
        if (ownedNodeIds.has(nodeId)) {
          diagnostics.push({
            code: 'NODE_MULTIPLE_OWNERS',
            phase: 'structure',
            severity: 'error',
            path,
            nodeId,
            containerId,
            regionId,
          })
        }
        else {
          ownedNodeIds.add(nodeId)
        }
        if (!nodeIds.has(nodeId)) {
          diagnostics.push({
            code: 'NODE_REFERENCE_MISSING',
            phase: 'structure',
            severity: 'error',
            path,
            nodeId,
            containerId,
            regionId,
          })
        }
      }
    }
  }
  for (const [index, node] of schema.nodes.entries()) {
    if (!ownedNodeIds.has(node.id)) {
      diagnostics.push({
        code: 'NODE_ORPHANED',
        phase: 'structure',
        severity: 'error',
        path: `/nodes/${index}`,
        nodeId: node.id,
      })
    }
  }
  return diagnostics
}

function collectDefinitionDiagnostics(
  schema: DeepReadonly<DocumentSchema>,
  definitions: SchemaDefinitionSnapshot,
): SchemaDiagnostic[] {
  const diagnostics: SchemaDiagnostic[] = []
  const nodesById = new Map(schema.nodes.map(node => [node.id, node]))
  const regionLocations = new Map<string, {
    readonly path: string
    readonly containerId: string
    readonly regionId: string
  }>()
  for (const [containerId, container] of Object.entries(schema.structure.containers)) {
    const containerPath = appendJsonPointer('/structure/containers', containerId)
    for (const [regionId, childIds] of Object.entries(container.regions)) {
      const regionPath = appendJsonPointer(`${containerPath}/regions`, regionId)
      for (const [index, childId] of childIds.entries()) {
        regionLocations.set(childId, {
          path: `${regionPath}/${index}`,
          containerId,
          regionId,
        })
      }
    }
  }
  for (const [index, node] of schema.nodes.entries()) {
    const definition = definitions.types.get(node.type)
    if (!definition) {
      diagnostics.push({
        code: 'NODE_TYPE_UNRESOLVED',
        phase: 'definition',
        severity: 'warning',
        path: `/nodes/${index}/type`,
        nodeId: node.id,
      })
      continue
    }
    const hasContainerStructure = Object.hasOwn(schema.structure.containers, node.id)
    if (hasContainerStructure && !definition.container) {
      diagnostics.push({
        code: 'CONTAINER_CAPABILITY_MISMATCH',
        phase: 'definition',
        severity: 'error',
        path: appendJsonPointer('/structure/containers', node.id),
        nodeId: node.id,
        containerId: node.id,
      })
    }
    else if (!hasContainerStructure && definition.container) {
      const regionLocation = regionLocations.get(node.id)
      if (regionLocation) {
        diagnostics.push({
          code: 'REGION_CHILD_CONTAINER_FORBIDDEN',
          phase: 'definition',
          severity: 'error',
          path: regionLocation.path,
          nodeId: node.id,
          containerId: regionLocation.containerId,
          regionId: regionLocation.regionId,
        })
      }
      else {
        diagnostics.push({
          code: 'CONTAINER_STRUCTURE_MISSING',
          phase: 'definition',
          severity: 'error',
          path: `/nodes/${index}`,
          nodeId: node.id,
          containerId: node.id,
        })
      }
    }
    else if (hasContainerStructure && definition.container) {
      const structure = schema.structure.containers[node.id]
      const actualRegionIds = new Set(Object.keys(structure.regions))
      const declaredRegionIds = new Set(definition.container.regions.map(region => region.id))
      const containerPath = appendJsonPointer('/structure/containers', node.id)
      for (const regionId of actualRegionIds) {
        if (declaredRegionIds.has(regionId))
          continue
        diagnostics.push({
          code: 'CONTAINER_REGION_UNKNOWN',
          phase: 'definition',
          severity: 'error',
          path: appendJsonPointer(`${containerPath}/regions`, regionId),
          nodeId: node.id,
          containerId: node.id,
          regionId,
        })
      }
      for (const regionId of declaredRegionIds) {
        if (actualRegionIds.has(regionId))
          continue
        diagnostics.push({
          code: 'CONTAINER_REGION_MISSING',
          phase: 'definition',
          severity: 'error',
          path: appendJsonPointer(`${containerPath}/regions`, regionId),
          nodeId: node.id,
          containerId: node.id,
          regionId,
        })
      }
      for (const region of definition.container.regions) {
        const children = structure.regions[region.id]
        if (!children)
          continue
        const regionPath = appendJsonPointer(`${containerPath}/regions`, region.id)
        if (region.cardinality?.min !== undefined && children.length < region.cardinality.min) {
          diagnostics.push({
            code: 'REGION_CARDINALITY_MIN',
            phase: 'definition',
            severity: 'error',
            path: regionPath,
            nodeId: node.id,
            containerId: node.id,
            regionId: region.id,
            details: { actual: children.length, min: region.cardinality.min },
          })
        }
        if (region.cardinality?.max !== undefined && children.length > region.cardinality.max) {
          diagnostics.push({
            code: 'REGION_CARDINALITY_MAX',
            phase: 'definition',
            severity: 'error',
            path: regionPath,
            nodeId: node.id,
            containerId: node.id,
            regionId: region.id,
            details: { actual: children.length, max: region.cardinality.max },
          })
        }
        if (region.accepts?.types) {
          const acceptedTypes = new Set(region.accepts.types)
          for (const [childIndex, childId] of children.entries()) {
            const child = nodesById.get(childId)
            if (!child || acceptedTypes.has(child.type))
              continue
            diagnostics.push({
              code: 'REGION_TYPE_NOT_ACCEPTED',
              phase: 'definition',
              severity: 'error',
              path: `${regionPath}/${childIndex}`,
              nodeId: child.id,
              containerId: node.id,
              regionId: region.id,
              details: { actualType: child.type, acceptedTypes: [...region.accepts.types] },
            })
          }
        }
      }
    }
  }
  return diagnostics
}

export function resolveSchema(
  input: unknown,
  definitions: SchemaDefinitionSnapshot,
  options?: ResolveSchemaOptions,
): SchemaResolution {
  const maxDiagnostics = options?.maxDiagnostics
  const decoded = decodeDocumentSchema(input)
  if (!decoded.ok) {
    return {
      status: 'rejected',
      diagnostics: createDiagnosticReport(decoded.issues.map(issue => ({
        code: issue.code,
        phase: 'decode',
        severity: 'error',
        path: issue.path,
      })), maxDiagnostics),
    }
  }

  const { schema } = decoded
  const structuralDiagnostics = sortDiagnostics(collectStructuralDiagnostics(schema))
  if (structuralDiagnostics.length > 0) {
    return {
      status: 'rejected',
      diagnostics: createDiagnosticReport(structuralDiagnostics, maxDiagnostics),
    }
  }
  const definitionDiagnostics = sortDiagnostics(collectDefinitionDiagnostics(schema, definitions))
  const hasDefinitionErrors = definitionDiagnostics.some(item => item.severity === 'error')
  const conflictedNodeIds = new Set<string>()
  for (const diagnostic of definitionDiagnostics) {
    if (diagnostic.severity !== 'error')
      continue
    if (diagnostic.nodeId)
      conflictedNodeIds.add(diagnostic.nodeId)
    if (diagnostic.containerId)
      conflictedNodeIds.add(diagnostic.containerId)
  }
  return {
    status: hasDefinitionErrors
      ? 'conflicted'
      : definitionDiagnostics.length > 0 ? 'degraded' : 'ready',
    document: createResolvedDocument(schema, definitions, conflictedNodeIds),
    diagnostics: createDiagnosticReport(definitionDiagnostics, maxDiagnostics),
  }
}
