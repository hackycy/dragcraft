import type { DocumentSchema } from '@dragcraft/designer/dev-harness'
import { describe, expect, it } from 'vitest'
import { isFinalDocumentSchema } from './schema-validation'
import { useSchemaIO } from './use-schema-io'

const finalSchema: DocumentSchema = {
  version: '1',
  globalConfig: { title: 'Final' },
  page: { props: {} },
  nodes: [{ id: 'title', type: 'text', props: { content: 'Final' } }],
  structure: { root: ['title'], containers: {} },
}

describe('useSchemaIO', () => {
  it('exports and imports a final DocumentSchema without a Legacy root projection', () => {
    const imported: DocumentSchema[] = []
    const state = useSchemaIO({
      exportSchema: () => finalSchema,
      importSchema: schema => imported.push(schema),
      invalidSchemaMessage: 'invalid final schema',
      isValidSchema: isFinalDocumentSchema,
    })

    state.handleExport()
    expect(JSON.parse(state.exportJson.value)).toEqual(finalSchema)
    expect(JSON.parse(state.exportJson.value)).not.toHaveProperty('root')

    state.importJson.value = JSON.stringify(finalSchema)
    state.handleImportConfirm()
    expect(imported).toEqual([finalSchema])
    expect(state.showImportModal.value).toBe(false)
  })

  it('rejects a Legacy-shaped payload when configured for final DocumentSchema', () => {
    const state = useSchemaIO({
      exportSchema: () => finalSchema,
      importSchema: () => {},
      invalidSchemaMessage: 'invalid final schema',
      isValidSchema: isFinalDocumentSchema,
    })

    state.importJson.value = JSON.stringify({ version: '1', globalConfig: {}, root: {} })
    state.handleImportConfirm()

    expect(state.importError.value).toBe('invalid final schema')
  })
})
