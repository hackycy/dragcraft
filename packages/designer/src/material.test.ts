import type { DesignerWidgetMeta } from './types'
import { describe, expect, it } from 'vitest'
import { materialItemMatchesQuery, resolveMaterialItem } from './material'

const t = (key: string, fallback = '') => `${fallback} (${key})`

function makeMeta(overrides: Partial<DesignerWidgetMeta> = {}): DesignerWidgetMeta {
  return {
    type: 'banner',
    title: 'Banner',
    titleKey: 'widget.banner.title',
    group: 'basic',
    icon: 'banner',
    defaultProps: {},
    formSchema: { sections: [] },
    ...overrides,
  }
}

describe('material protocol helpers', () => {
  it('resolves material display data with widget fallbacks', () => {
    const meta = makeMeta({
      material: {
        title: 'Hero Banner',
        titleKey: 'widget.banner.material.title',
        icon: 'hero',
        description: 'Promotional hero section',
        descriptionKey: 'widget.banner.material.description',
        tags: ['marketing'],
        keywords: ['campaign'],
      },
    })

    expect(resolveMaterialItem(meta, t)).toEqual({
      title: 'Hero Banner (widget.banner.material.title)',
      icon: 'hero',
      description: 'Promotional hero section (widget.banner.material.description)',
      thumbnail: undefined,
      tags: ['marketing'],
      keywords: ['campaign'],
    })
  })

  it('matches query against resolved material text and keywords', () => {
    const meta = makeMeta({
      material: {
        description: 'Collect customer feedback',
        tags: ['form'],
        keywords: ['survey'],
      },
    })
    const material = resolveMaterialItem(meta, t)

    expect(materialItemMatchesQuery(meta, material, 'survey')).toBe(true)
    expect(materialItemMatchesQuery(meta, material, 'feedback')).toBe(true)
    expect(materialItemMatchesQuery(meta, material, 'missing')).toBe(false)
  })
})
