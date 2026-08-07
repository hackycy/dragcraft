import { describe, expect, it } from 'vitest'
import { DesignerConfigurationError } from '../materials/create-material-catalog'
import { createDesigner, DOCUMENT_SCHEMA_VERSION } from './create-designer'

describe('createDesigner session', () => {
  it('switches localization synchronously without replacing the current document', () => {
    const designer = createDesigner({ materials: [] })
    const document = designer.document.value

    expect(designer.localization.locale.value).toBe('zh-CN')
    expect(designer.localization.translate('panel.materials.title')).toBe('物料')

    designer.localization.setLocale('en')

    expect(designer.localization.locale.value).toBe('en')
    expect(designer.localization.translate('panel.materials.title')).toBe('Materials')
    expect(designer.document.value).toBe(document)
  })

  it('rejects invalid localization values without changing the active locale', () => {
    expect(() => createDesigner({ locale: '', materials: [] })).toThrowError(TypeError)

    const designer = createDesigner({ locale: 'en', materials: [] })

    expect(() => designer.localization.setLocale('')).toThrowError(TypeError)
    expect(() => designer.localization.setLocale(null as never)).toThrowError(TypeError)
    expect(designer.localization.locale.value).toBe('en')
  })

  it('keeps localization readable and ignores locale changes after dispose', () => {
    const designer = createDesigner({ locale: 'en', materials: [] })

    designer.dispose()
    designer.localization.setLocale('zh-CN')

    expect(designer.localization.locale.value).toBe('en')
    expect(designer.localization.translate('panel.materials.title')).toBe('Materials')
  })

  it('creates the canonical empty version-1 document when schema is omitted', () => {
    const designer = createDesigner({ materials: [] })

    expect(DOCUMENT_SCHEMA_VERSION).toBe('1')
    expect(designer.document.value).toMatchObject({
      status: 'ready',
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [],
        structure: { root: [], containers: {} },
      },
    })
    expect(designer.selection.selectedNodeId.value).toBeNull()
    expect(designer.history.canUndo.value).toBe(false)
  })

  it('keeps an explicitly rejected initial input as a recoverable document state', () => {
    const designer = createDesigner({ materials: [], schema: null })

    expect(designer.document.value).toMatchObject({
      status: 'rejected',
      diagnostics: {
        items: [{ code: 'DOCUMENT_SCHEMA_INVALID', phase: 'decode', path: '' }],
      },
    })
    expect(designer.history.canUndo.value).toBe(false)
    expect(designer.execute({ type: 'undo' })).toEqual({ status: 'unchanged' })
    expect(designer.history.canRedo.value).toBe(false)
  })

  it('installs a degraded import while preserving unknown node data', () => {
    const designer = createDesigner({ materials: [] })
    const input = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'external-1', type: 'external', props: { source: 'remote' } }],
      structure: { root: ['external-1'], containers: {} },
    }

    expect(designer.importSchema(input)).toMatchObject({
      status: 'degraded',
      diagnostics: { items: [{ code: 'NODE_TYPE_UNRESOLVED' }] },
    })
    expect(designer.document.value).toMatchObject({
      status: 'degraded',
      schema: input,
    })
    expect(designer.history.canUndo.value).toBe(false)
  })

  it('installs a structurally valid import that conflicts with material definitions', () => {
    const designer = createDesigner({
      materials: [{ type: 'text', presentation: { kind: 'headless' } }],
    })
    const input = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'text-1', type: 'text', props: {} }],
      structure: {
        root: ['text-1'],
        containers: { 'text-1': { regions: { content: [] } } },
      },
    }

    expect(designer.importSchema(input)).toMatchObject({
      status: 'conflicted',
      diagnostics: { items: [{ code: 'CONTAINER_CAPABILITY_MISMATCH' }] },
    })
    expect(designer.document.value).toMatchObject({ status: 'conflicted', schema: input })
  })

  it('preserves the installed document when a later import is rejected', () => {
    const designer = createDesigner({ materials: [] })
    const before = designer.document.value

    expect(designer.importSchema(null)).toMatchObject({
      status: 'rejected',
      diagnostics: { items: [{ code: 'DOCUMENT_SCHEMA_INVALID' }] },
    })
    expect(designer.document.value).toBe(before)
  })

  it('applies the Designer diagnostic limit without changing document status', () => {
    const designer = createDesigner({
      limits: { maxDiagnostics: 0 },
      materials: [],
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [{ id: 'unknown-1', type: 'unknown', props: {} }],
        structure: { root: ['unknown-1'], containers: {} },
      },
    })

    expect(designer.document.value).toMatchObject({
      status: 'degraded',
      diagnostics: { items: [], truncated: true },
    })
  })

  it('exports detached JSON data and returns null without an installed document', () => {
    const rejected = createDesigner({ materials: [], schema: null })
    expect(rejected.exportSchema()).toBeNull()

    const designer = createDesigner({
      materials: [{ type: 'text', presentation: { kind: 'headless' } }],
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [{ id: 'text-1', type: 'text', props: { value: 'Internal' } }],
        structure: { root: ['text-1'], containers: {} },
      },
    })
    const exported = designer.exportSchema()!

    exported.nodes[0]!.props.value = 'External mutation'

    expect(designer.document.value).toMatchObject({
      schema: { nodes: [{ props: { value: 'Internal' } }] },
    })
    expect(JSON.parse(JSON.stringify(designer.exportSchema()))).toEqual(designer.exportSchema())
  })

  it('rejects invalid Designer initialization limits and material collections', () => {
    expect(() => createDesigner({} as never)).toThrowError(
      new DesignerConfigurationError('MATERIALS_INVALID', 'materials'),
    )
    expect(() => createDesigner({ materials: [], maxHistoryEntries: -1 })).toThrowError(
      new DesignerConfigurationError('HISTORY_LIMIT_INVALID', 'maxHistoryEntries'),
    )
    expect(() => createDesigner({ materials: [], maxHistoryEntries: 1.5 })).toThrowError(
      new DesignerConfigurationError('HISTORY_LIMIT_INVALID', 'maxHistoryEntries'),
    )
  })

  it('keeps programmatic execute synchronous and outside host confirmation', () => {
    let confirmations = 0
    const designer = createDesigner({
      materials: [{
        type: 'protected-text',
        authoring: { policy: { remove: 'confirmation-required' } },
        presentation: { kind: 'headless' },
      }],
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [{ id: 'protected-1', type: 'protected-text', props: {} }],
        structure: { root: ['protected-1'], containers: {} },
      },
      confirmAuthoringAction: () => {
        confirmations += 1
        return true
      },
    })

    expect(designer.execute({ type: 'remove-node', nodeId: 'protected-1' })).toEqual({
      status: 'confirmation-required',
      code: 'POLICY_CONFIRMATION_REQUIRED',
    })
    expect(confirmations).toBe(0)
    expect(designer.exportSchema()?.structure.root).toEqual(['protected-1'])
  })
})
