import type { DocumentDecodeIssueCode } from '../document/json'
import type { DeepReadonly, JsonObject, NodeId, RegionId } from '../document/types'
import { cloneJsonValue } from '../document/json'

export type SchemaDiagnosticPhase = 'decode' | 'structure' | 'definition'
export type SchemaDiagnosticSeverity = 'warning' | 'error'
export type SchemaDiagnosticCode
  = | DocumentDecodeIssueCode
    | 'CONTAINER_CAPABILITY_MISMATCH'
    | 'CONTAINER_OWNER_MISSING'
    | 'CONTAINER_OWNER_NOT_ROOT'
    | 'CONTAINER_REGION_MISSING'
    | 'CONTAINER_REGION_UNKNOWN'
    | 'CONTAINER_STRUCTURE_MISSING'
    | 'NODE_ID_DUPLICATE'
    | 'NODE_MULTIPLE_OWNERS'
    | 'NODE_ORPHANED'
    | 'NODE_REFERENCE_MISSING'
    | 'NODE_TYPE_UNRESOLVED'
    | 'REGION_CARDINALITY_MAX'
    | 'REGION_CARDINALITY_MIN'
    | 'REGION_CHILD_CONTAINER_FORBIDDEN'
    | 'REGION_TYPE_NOT_ACCEPTED'

export interface SchemaDiagnostic {
  readonly code: SchemaDiagnosticCode
  readonly phase: SchemaDiagnosticPhase
  readonly severity: SchemaDiagnosticSeverity
  readonly path: string
  readonly nodeId?: NodeId
  readonly containerId?: NodeId
  readonly regionId?: RegionId
  readonly details?: DeepReadonly<JsonObject>
}

export interface DiagnosticReport {
  readonly items: readonly SchemaDiagnostic[]
  readonly truncated: boolean
}

const phaseOrder: Record<SchemaDiagnosticPhase, number> = {
  decode: 0,
  structure: 1,
  definition: 2,
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

export function sortDiagnostics(items: readonly SchemaDiagnostic[]): SchemaDiagnostic[] {
  return [...items].sort((left, right) => {
    return phaseOrder[left.phase] - phaseOrder[right.phase]
      || compareStrings(left.path, right.path)
      || compareStrings(left.code, right.code)
  })
}

export function createDiagnosticReport(
  items: readonly SchemaDiagnostic[],
  maxDiagnostics?: number,
): DiagnosticReport {
  const sorted = sortDiagnostics(items)
  const requestedBudget = typeof maxDiagnostics === 'number'
    && Number.isFinite(maxDiagnostics)
    && Number.isInteger(maxDiagnostics)
    && maxDiagnostics >= 0
    ? maxDiagnostics
    : 200
  const budget = Math.min(requestedBudget, 2000)
  const retained = sorted.slice(0, budget).map((diagnostic) => {
    return Object.freeze({
      ...diagnostic,
      ...(diagnostic.details
        ? { details: cloneJsonValue(diagnostic.details as unknown as JsonObject) }
        : {}),
    })
  })
  return Object.freeze({
    items: Object.freeze(retained),
    truncated: sorted.length > budget,
  })
}
