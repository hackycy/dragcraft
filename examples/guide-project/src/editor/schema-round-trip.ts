import type { DocumentSchema } from '@dragcraft/designer'

/**
 * Demonstrates the persistence boundary used by the Guide Project.
 * Schema exports are plain JSON and can be persisted without Designer internals.
 */
export function roundTripGuideSchema(schema: DocumentSchema): DocumentSchema {
  return JSON.parse(JSON.stringify(schema)) as DocumentSchema
}
