export type {
  ContainerDeclaration,
  RegionDeclaration,
  SchemaDefinitionSnapshot,
  SchemaTypeDeclaration,
} from './definitions/types'

export { cloneJsonValue, collectInvalidJsonPaths } from './document/json'
export type {
  ContainerStructure,
  DeepReadonly,
  DocumentSchema,
  DocumentStructure,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  NodeDefinition,
  NodeId,
  NodeType,
  PageDefinition,
  RegionId,
} from './document/types'

export { applySchemaOperation } from './editor/apply-schema-operation'
export type { SchemaEditResult } from './editor/apply-schema-operation'
export type { NodeBundle } from './editor/node-bundle'
export type { OperationBatch, SchemaOperation } from './editor/schema-operation'
export type { StructuralDestination } from './editor/structural-destination'

export type {
  DiagnosticReport,
  SchemaDiagnostic,
  SchemaDiagnosticCode,
  SchemaDiagnosticPhase,
  SchemaDiagnosticSeverity,
} from './resolver/diagnostics'
export { resolveSchema } from './resolver/resolve-schema'
export type { ResolveSchemaOptions, SchemaResolution } from './resolver/resolve-schema'
export type {
  NodeLocation,
  ResolvedContainer,
  ResolvedDocument,
  ResolvedNode,
  ResolvedRegion,
} from './resolver/resolved-document'
