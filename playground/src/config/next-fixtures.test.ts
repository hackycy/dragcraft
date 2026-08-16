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

function hasBinding(field: { bindTo?: unknown }, scope: string, path: string): boolean {
  return typeof field.bindTo === 'object'
    && field.bindTo !== null
    && (field.bindTo as { scope?: string, path?: string }).scope === scope
    && (field.bindTo as { scope?: string, path?: string }).path === path
}

describe('next Playground fixtures', () => {
  it('provides an inspector schema for every visual material', () => {
    for (const material of playgroundNextMaterials) {
      if (material.presentation.kind !== 'visual')
        continue
      expect(material.inspector?.formSchema?.sections.length).toBeGreaterThan(0)
    }
  })

  it('exposes container and content style bindings on visual materials', () => {
    for (const material of playgroundNextMaterials) {
      if (material.presentation.kind !== 'visual')
        continue
      const fields = material.inspector?.formSchema?.sections.flatMap(section => section.fields) ?? []
      expect(fields.some(field => hasBinding(field, 'node', 'style.container'))).toBe(true)
      expect(fields.some(field => hasBinding(field, 'node', 'style.content'))).toBe(true)
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
    expect(content.structure.containers['article-content']?.regions.default).toEqual([
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

  it('includes a real headless material in the product fixture', () => {
    const headless = playgroundNextMaterials.find(material => material.type === 'seo-meta')
    const product = playgroundNextTemplates[2].schema
    const node = product.nodes.find(item => item.type === 'seo-meta')

    expect(headless?.panel).toMatchObject({ title: '页面 SEO', group: 'page' })
    expect(headless?.inspector?.formSchema?.sections[0]?.fields.map(field => field.key)).toEqual(['title', 'description'])
    expect(headless?.authoring?.policy?.duplicate).toBe('denied')
    expect(headless?.authoring?.policy?.move).toBe('denied')
    expect(headless?.presentation).toEqual({ kind: 'headless' })
    expect(node?.id).toBe('product-seo')
    expect(product.structure.root).toContain('product-seo')
  })
})
