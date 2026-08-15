import type { MaterialDefinition } from './materials/types'
import { describe, expect, it } from 'vitest'
import { materialItemMatchesQuery, resolveMaterialItem } from './material'

const t = (key: string, fallback = '') => `${fallback} (${key})`

function makeMaterial(overrides: Partial<MaterialDefinition> = {}): MaterialDefinition {
  return {
    type: 'banner',
    panel: {
      title: 'Banner',
      titleKey: 'widget.banner.title',
      group: 'basic',
      icon: 'banner',
    },
    presentation: { kind: 'headless' },
    ...overrides,
  }
}

describe('material protocol helpers', () => {
  it('resolves material display data with widget fallbacks', () => {
    const material = makeMaterial({
      panel: {
        title: 'Hero Banner',
        titleKey: 'widget.banner.material.title',
        icon: 'hero',
        description: 'Promotional hero section',
        descriptionKey: 'widget.banner.material.description',
        tags: ['marketing'],
        keywords: ['campaign'],
      },
    })

    expect(resolveMaterialItem(material, t)).toEqual({
      title: 'Hero Banner (widget.banner.material.title)',
      icon: 'hero',
      description: 'Promotional hero section (widget.banner.material.description)',
      thumbnail: undefined,
      tags: ['marketing'],
      keywords: ['campaign'],
    })
  })

  it('matches query against resolved material text and keywords', () => {
    const materialDefinition = makeMaterial({
      panel: {
        description: 'Collect customer feedback',
        tags: ['form'],
        keywords: ['survey'],
      },
    })
    const material = resolveMaterialItem(materialDefinition, t)

    expect(materialItemMatchesQuery(materialDefinition, material, 'survey')).toBe(true)
    expect(materialItemMatchesQuery(materialDefinition, material, 'feedback')).toBe(true)
    expect(materialItemMatchesQuery(materialDefinition, material, 'missing')).toBe(false)
  })
})
