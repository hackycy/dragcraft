import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { materialItemMatchesQuery, resolveMaterialItem } from './material'

const material = {
  type: 'survey',
  panel: {
    title: 'Survey',
    titleKey: 'material.survey',
    description: 'Collect feedback',
    keywords: ['questionnaire'],
    tags: ['feedback'],
  },
  presentation: { kind: 'visual' as const, preview: defineComponent({}) },
}

describe('material panel projection', () => {
  it('resolves translated display data from MaterialDefinition', () => {
    expect(resolveMaterialItem(material, (key, fallback) => `${fallback} (${key})`)).toMatchObject({
      title: 'Survey (material.survey)',
      description: 'Collect feedback',
      keywords: ['questionnaire'],
      tags: ['feedback'],
    })
  })

  it('matches type and panel search terms', () => {
    const display = resolveMaterialItem(material, (_key, fallback) => fallback ?? '')
    expect(materialItemMatchesQuery(material, display, 'survey')).toBe(true)
    expect(materialItemMatchesQuery(material, display, 'questionnaire')).toBe(true)
    expect(materialItemMatchesQuery(material, display, 'missing')).toBe(false)
  })
})
