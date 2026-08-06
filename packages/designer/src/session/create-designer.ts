import type { DocumentSchema } from '@dragcraft/core'
import type { AuthoringEngine } from '../authoring/types'
import type { MaterialDefinition } from '../materials/types'
import { createAuthoringEngine } from '../authoring/create-authoring-engine'
import {
  createMaterialCatalog,
  DesignerConfigurationError,
} from '../materials/create-material-catalog'

export const DOCUMENT_SCHEMA_VERSION = '1'

export interface CreateDesignerOptions {
  readonly createNodeId?: () => string
  readonly limits?: {
    readonly maxDiagnostics?: number
  }
  readonly materials: readonly MaterialDefinition[]
  readonly maxHistoryEntries?: number
  readonly schema?: unknown
}

export interface DesignerInstance extends AuthoringEngine {
  dispose: () => void
}

function createEmptyDocument(): DocumentSchema {
  return {
    version: DOCUMENT_SCHEMA_VERSION,
    globalConfig: {},
    page: { props: {} },
    nodes: [],
    structure: { root: [], containers: {} },
  }
}

export function createDesigner(options: CreateDesignerOptions): DesignerInstance {
  if (!Array.isArray(options.materials))
    throw new DesignerConfigurationError('MATERIALS_INVALID', 'materials')
  if (options.maxHistoryEntries !== undefined
    && (!Number.isInteger(options.maxHistoryEntries) || options.maxHistoryEntries < 0)) {
    throw new DesignerConfigurationError('HISTORY_LIMIT_INVALID', 'maxHistoryEntries')
  }
  const catalog = createMaterialCatalog(options.materials)
  const schema = Object.hasOwn(options, 'schema')
    ? options.schema
    : createEmptyDocument()
  const engine = createAuthoringEngine({
    catalog,
    createNodeId: options.createNodeId ?? (() => crypto.randomUUID()),
    maxDiagnostics: options.limits?.maxDiagnostics,
    maxHistoryEntries: options.maxHistoryEntries,
    schema,
  })

  return Object.freeze({
    ...engine,
    dispose(): void {},
  })
}
