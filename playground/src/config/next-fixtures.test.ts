import type { DocumentSchema } from '@dragcraft/designer'
import { describe, expect, it } from 'vitest'
import {
  playgroundNextMaterials,
  playgroundNextTemplates,
} from './next-fixtures'

function allStructureNodeIds(schema: DocumentSchema): string[] {
  return [
    ...schema.structure.root,
    ...Object.values(schema.structure.containers).flatMap(container => Object.values(container.regions).flat()),
  ]
}

describe('next Playground fixtures', () => {
  it('provides an inspector schema for every visual material', () => {
    for (const material of playgroundNextMaterials) {
      if (material.presentation.kind !== 'visual')
        continue
      expect(material.inspector?.formSchema?.sections.length).toBeGreaterThan(0)
    }
  })

  it('keeps three static Documents structurally complete against the final materials', () => {
    const materialTypes = new Set(playgroundNextMaterials.map(material => material.type))
    expect(materialTypes.size).toBe(playgroundNextMaterials.length)
    expect(playgroundNextTemplates.map(template => template.id)).toEqual([
      'ecommerce',
      'content-detail',
      'product-detail',
    ])

    for (const { schema } of playgroundNextTemplates) {
      const nodeIds = new Set(schema.nodes.map(node => node.id))
      expect(new Set(allStructureNodeIds(schema)).size).toBe(schema.nodes.length)
      expect(allStructureNodeIds(schema).every(nodeId => nodeIds.has(nodeId))).toBe(true)
      expect(schema.nodes.every(node => materialTypes.has(node.type))).toBe(true)
    }
  })

  it('keeps the existing browser baseline node identities and Region order', () => {
    const content = playgroundNextTemplates[1].schema
    expect(content.structure.containers['article-flow']?.regions.default).toEqual([
      'article-title',
      'author-info',
      'divider-1',
      'body-1',
      'inline-img',
      'body-2',
    ])
    expect(content.structure.containers['article-actions']?.regions).toEqual({
      top: ['follow-btn'],
      bottomLeft: ['share-link'],
      bottomRight: ['favorite-link'],
    })
  })
})
