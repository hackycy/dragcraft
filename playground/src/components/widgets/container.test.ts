import { createDesigner } from '@dragcraft/designer'
import { describe, expect, it } from 'vitest'
import { contentDetailSchema } from '../../config/templates'
import { playgroundMaterials } from './index'

describe('content-detail product template', () => {
  it('installs the single-region and irregular three-region containers', () => {
    const designer = createDesigner({
      materials: playgroundMaterials,
      schema: contentDetailSchema,
    })

    expect(designer.document.value.status).toBe('ready')
    expect(contentDetailSchema.structure.containers).toEqual({
      'article-actions': {
        regions: {
          top: ['follow-btn'],
          bottomLeft: ['share-link'],
          bottomRight: ['favorite-link'],
        },
      },
      'article-flow': {
        regions: {
          content: [
            'article-title',
            'author-info',
            'divider-1',
            'body-1',
            'inline-img',
            'body-2',
          ],
        },
      },
    })
    expect(designer.exportSchema()).toEqual(contentDetailSchema)
  })

  it('sorts within a region and moves between region and root owners', () => {
    const designer = createDesigner({
      materials: playgroundMaterials,
      schema: contentDetailSchema,
    })

    expect(designer.execute({
      type: 'move-node',
      nodeId: 'body-2',
      to: {
        owner: { kind: 'container-region', containerId: 'article-flow', regionId: 'content' },
        position: { kind: 'before', nodeId: 'article-title' },
      },
    })).toEqual({ status: 'committed' })
    expect(designer.execute({
      type: 'move-node',
      nodeId: 'share-link',
      to: {
        owner: { kind: 'container-region', containerId: 'article-actions', regionId: 'top' },
        position: { kind: 'end' },
      },
    })).toEqual({ status: 'committed' })
    expect(designer.execute({
      type: 'move-node',
      nodeId: 'body-2',
      to: {
        owner: { kind: 'page-root' },
        position: { kind: 'after', nodeId: 'article-flow' },
      },
    })).toEqual({ status: 'committed' })

    expect(designer.exportSchema()?.structure).toMatchObject({
      root: ['nav-content', 'cover-img', 'article-flow', 'body-2', 'article-actions'],
      containers: {
        'article-flow': { regions: { content: ['article-title', 'author-info', 'divider-1', 'body-1', 'inline-img'] } },
        'article-actions': {
          regions: {
            top: ['follow-btn', 'share-link'],
            bottomLeft: [],
            bottomRight: ['favorite-link'],
          },
        },
      },
    })
  })
})
