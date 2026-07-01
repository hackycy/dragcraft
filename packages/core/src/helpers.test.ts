import type { SchemaNode } from './types'
import { describe, expect, it } from 'vitest'
import { findNodeById, findParentNode, insertNodeIntoTree, removeNodeFromTree, walkFlatChildren } from './helpers'

function makeRoot(children: SchemaNode[] = []): SchemaNode {
  return { id: 'root', type: 'root', props: {}, children }
}

function makeNode(id: string, type = 'text'): SchemaNode {
  return { id, type, props: {} }
}

describe('findNodeById', () => {
  it('returns root when id matches', () => {
    const root = makeRoot()
    expect(findNodeById(root, 'root')).toBe(root)
  })

  it('returns matching child', () => {
    const child = makeNode('a')
    const root = makeRoot([child])
    expect(findNodeById(root, 'a')).toBe(child)
  })

  it('returns null for missing id', () => {
    const root = makeRoot([makeNode('a')])
    expect(findNodeById(root, 'missing')).toBeNull()
  })

  it('returns null when root has no children', () => {
    const root = makeRoot()
    root.children = undefined
    expect(findNodeById(root, 'a')).toBeNull()
  })
})

describe('findParentNode', () => {
  it('returns parent and index for a child', () => {
    const child = makeNode('a')
    const root = makeRoot([makeNode('x'), child])
    const result = findParentNode(root, 'a')
    expect(result).toEqual({ parent: root, index: 1 })
  })

  it('returns null for root id', () => {
    const root = makeRoot([makeNode('a')])
    expect(findParentNode(root, 'root')).toBeNull()
  })

  it('returns null for missing id', () => {
    const root = makeRoot([makeNode('a')])
    expect(findParentNode(root, 'missing')).toBeNull()
  })
})

describe('removeNodeFromTree', () => {
  it('removes and returns the node', () => {
    const child = makeNode('a')
    const root = makeRoot([child, makeNode('b')])
    const removed = removeNodeFromTree(root, 'a')
    expect(removed).toBe(child)
    expect(root.children).toHaveLength(1)
    expect(root.children![0].id).toBe('b')
  })

  it('returns null for missing id', () => {
    const root = makeRoot([makeNode('a')])
    expect(removeNodeFromTree(root, 'missing')).toBeNull()
  })

  it('returns null when trying to remove root', () => {
    const root = makeRoot([makeNode('a')])
    expect(removeNodeFromTree(root, 'root')).toBeNull()
  })
})

describe('insertNodeIntoTree', () => {
  it('appends when index is undefined', () => {
    const root = makeRoot([makeNode('a')])
    const node = makeNode('b')
    insertNodeIntoTree(root, node)
    expect(root.children).toHaveLength(2)
    expect(root.children![1]).toBe(node)
  })

  it('inserts at specific index', () => {
    const root = makeRoot([makeNode('a'), makeNode('c')])
    const node = makeNode('b')
    insertNodeIntoTree(root, node, 1)
    expect(root.children).toHaveLength(3)
    expect(root.children![1]).toBe(node)
  })

  it('inserts at index 0', () => {
    const root = makeRoot([makeNode('a')])
    const node = makeNode('b')
    insertNodeIntoTree(root, node, 0)
    expect(root.children![0]).toBe(node)
  })

  it('initializes children array if missing', () => {
    const root: SchemaNode = { id: 'root', type: 'root', props: {} }
    insertNodeIntoTree(root, makeNode('a'))
    expect(root.children).toHaveLength(1)
  })
})

describe('walkFlatChildren', () => {
  it('visits root then children in order', () => {
    const visited: string[] = []
    const root = makeRoot([makeNode('a'), makeNode('b')])
    walkFlatChildren(root, (node) => {
      visited.push(node.id)
    })
    expect(visited).toEqual(['root', 'a', 'b'])
  })

  it('stops when visitor returns false', () => {
    const visited: string[] = []
    const root = makeRoot([makeNode('a'), makeNode('b')])
    walkFlatChildren(root, (node) => {
      visited.push(node.id)
      if (node.id === 'a')
        return false
    })
    expect(visited).toEqual(['root', 'a'])
  })

  it('handles root with no children', () => {
    const visited: string[] = []
    const root: SchemaNode = { id: 'root', type: 'root', props: {} }
    walkFlatChildren(root, (node) => {
      visited.push(node.id)
    })
    expect(visited).toEqual(['root'])
  })
})
