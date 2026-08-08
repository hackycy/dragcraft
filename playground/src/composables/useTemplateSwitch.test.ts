import { describe, expect, it, vi } from 'vitest'
import { playgroundNextTemplates } from '../config/next-fixtures'
import { templateRegistry } from '../config/templates'
import { useTemplateSwitch } from './useTemplateSwitch'

function createModifiedSchema() {
  const template = templateRegistry[0].schema
  return {
    ...template,
    globalConfig: {
      ...template.globalConfig,
      title: 'modified',
    },
  }
}

describe('useTemplateSwitch', () => {
  it('waits for an asynchronous confirmation before switching', async () => {
    let resolveConfirmation: (allowed: boolean) => void = () => {}
    const confirmSwitch = vi.fn(() => new Promise<boolean>((resolve) => {
      resolveConfirmation = resolve
    }))
    const importSchema = vi.fn()
    const state = useTemplateSwitch({
      importSchema,
      exportSchema: createModifiedSchema,
      templates: templateRegistry,
      confirmSwitch,
    })

    const switching = state.switchTemplate('content-detail')
    expect(confirmSwitch).toHaveBeenCalledOnce()
    expect(importSchema).not.toHaveBeenCalled()

    resolveConfirmation(false)
    await expect(switching).resolves.toBe(false)
    expect(importSchema).not.toHaveBeenCalled()
    expect(state.activeTemplateId.value).toBe('ecommerce')
  })

  it('switches only after an asynchronous confirmation accepts', async () => {
    const importSchema = vi.fn()
    const state = useTemplateSwitch({
      importSchema,
      exportSchema: createModifiedSchema,
      templates: templateRegistry,
      confirmSwitch: async () => true,
    })

    await expect(state.switchTemplate('content-detail')).resolves.toBe(true)
    expect(importSchema).toHaveBeenCalledWith(templateRegistry[1].schema)
    expect(state.activeTemplateId.value).toBe('content-detail')
  })

  it('switches a final DocumentSchema without using the Legacy template registry', async () => {
    const importSchema = vi.fn()
    const state = useTemplateSwitch({
      importSchema,
      exportSchema: () => playgroundNextTemplates[0].schema,
      templates: playgroundNextTemplates,
    })

    await expect(state.switchTemplate('content-detail')).resolves.toBe(true)
    expect(importSchema).toHaveBeenCalledWith(playgroundNextTemplates[1].schema)
    expect(importSchema.mock.calls[0]?.[0]).not.toHaveProperty('root')
  })
})
