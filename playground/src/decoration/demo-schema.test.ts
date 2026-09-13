import { describe, expect, it } from 'vitest'

import { isFinalDocumentSchema } from '../shared/schema-validation'
import { DECORATION_DEMO_SCHEMA } from './demo-schema'
import { createDecorationDesigner } from './designer'
import { DECORATION_MATERIALS } from './registry'

const materialByType = new Map(DECORATION_MATERIALS.map(material => [material.type, material]))

function defaultPropsKeys(type: string): string[] {
  return Object.keys(materialByType.get(type)?.schema?.defaultProps ?? {})
}

describe('decoration demo schema', () => {
  it('is a valid final document schema', () => {
    expect(isFinalDocumentSchema(DECORATION_DEMO_SCHEMA)).toBe(true)
  })

  it('is accepted by the designer and survives an export round trip', () => {
    const designer = createDecorationDesigner(DECORATION_DEMO_SCHEMA)

    expect(designer.exportSchema()).toEqual(DECORATION_DEMO_SCHEMA)
  })

  it('only uses registered material types', () => {
    for (const node of DECORATION_DEMO_SCHEMA.nodes) {
      expect(materialByType.has(node.type)).toBe(true)
    }
  })

  it('gives every node all of its material default props', () => {
    for (const node of DECORATION_DEMO_SCHEMA.nodes) {
      const keys = Object.keys(node.props)

      for (const key of defaultPropsKeys(node.type)) {
        expect(keys, `${node.type} 缺 prop: ${key}`).toContain(key)
      }
    }
  })

  it('lists exactly its nodes in the root, in order and without duplicates', () => {
    const nodeIds = DECORATION_DEMO_SCHEMA.nodes.map(node => node.id)

    expect(DECORATION_DEMO_SCHEMA.structure.root).toEqual(nodeIds)
    expect(new Set(nodeIds).size).toBe(nodeIds.length)
  })

  // 与 registry.test.ts 同一套判据：policy.create 是谓词的即位置唯一的物料
  it('never places a positional singleton more than once', () => {
    const singletonTypes = DECORATION_MATERIALS
      .filter(material => typeof material.authoring?.policy?.create === 'function')
      .map(material => material.type)

    expect(singletonTypes.length).toBeGreaterThan(0)
    for (const type of singletonTypes) {
      const count = DECORATION_DEMO_SCHEMA.nodes.filter(node => node.type === type).length
      expect(count, `${type} 不应超过一个`).toBeLessThanOrEqual(1)
    }
  })

  // 示例是刻意收窄的四个物料（早期版本曾用全部 14 个）；多出第五个就说明该有人复核一下
  it('keeps the demo to the four materials it is meant to show', () => {
    const usedTypes = [...new Set(DECORATION_DEMO_SCHEMA.nodes.map(node => node.type))].sort()

    expect(usedTypes).toEqual([
      'miniapp.carousel',
      'miniapp.nav-bar',
      'miniapp.navigation-group',
      'miniapp.spacer',
    ])
  })

  it('only points at public https images, never at the prod slice', () => {
    const serialized = JSON.stringify(DECORATION_DEMO_SCHEMA)

    expect(serialized).not.toContain('playground/prod')
    for (const node of DECORATION_DEMO_SCHEMA.nodes) {
      for (const value of Object.values(node.props)) {
        if (typeof value === 'string' && value && /^(?:https?:)?\/\//.test(value)) {
          expect(value.startsWith('https://')).toBe(true)
        }
      }
    }
  })
})
