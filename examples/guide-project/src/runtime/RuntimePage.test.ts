import type { VNode } from 'vue'
import { expect, it } from 'vitest'
import { NoticeWidget } from '../domain/widgets'
import { RuntimeColumnContainer } from './RuntimeColumnContainer'
import { createRuntimeNodeRenderer } from './RuntimePage'

it('passes recursively rendered region children to a runtime container', () => {
  const renderNode = createRuntimeNodeRenderer(
    { notice: NoticeWidget },
    { 'column-container': RuntimeColumnContainer },
  )
  const vnode = renderNode({
    id: 'layout-1',
    type: 'column-container',
    props: {},
    container: {
      variant: 'single',
      regions: {
        content: [{ id: 'notice-1', type: 'notice', props: { text: '运行时公告' } }],
      },
    },
  }) as VNode

  expect(vnode.type).toBe(RuntimeColumnContainer)
  expect((vnode.props?.regions as Record<string, unknown[]>).content).toHaveLength(1)
})
