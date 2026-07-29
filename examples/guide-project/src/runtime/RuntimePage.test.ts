import type { SchemaNode } from '@dragcraft/designer'
import type { VNode } from 'vue'
import type { RuntimeRegistry } from './registry'
import { expect, it } from 'vitest'
import { NoticeWidget } from '../domain/widgets'
import { RuntimeColumnContainer } from './RuntimeColumnContainer'
import { createRuntimeNodeRenderer, DefaultRuntimeFallback } from './RuntimePage'

const registry: RuntimeRegistry = {
  'notice': { kind: 'widget', component: NoticeWidget },
  'column-container': { kind: 'container', component: RuntimeColumnContainer },
}

function renderedContent(vnode: VNode): VNode {
  return (vnode.children as VNode[])[0]
}

it('passes recursively rendered region children to a runtime container', () => {
  const renderNode = createRuntimeNodeRenderer(registry)
  const vnode = renderNode({
    id: 'layout-1',
    type: 'column-container',
    props: { gap: 16 },
    container: {
      variant: 'single',
      regions: {
        content: [{ id: 'notice-1', type: 'notice', props: { text: '运行时公告' } }],
      },
    },
  }) as VNode
  const container = renderedContent(vnode)

  expect(container.type).toBe(RuntimeColumnContainer)
  expect((container.props?.regions as Record<string, unknown[]>).content).toHaveLength(1)
  expect((container.props?.node as SchemaNode).props.gap).toBe(16)
})

it('keeps container and content styles in separate runtime scopes', () => {
  const renderNode = createRuntimeNodeRenderer(registry)
  const vnode = renderNode({
    id: 'notice-1',
    type: 'notice',
    props: { text: '样式公告' },
    style: {
      container: { marginTop: 12 },
      content: { color: '#123456' },
    },
  }) as VNode
  const widget = renderedContent(vnode)

  expect(vnode.props?.style).toEqual({ marginTop: 12 })
  expect(widget.props?.style).toEqual({ color: '#123456' })
})

it('renders an observable fallback for an unknown widget', () => {
  const renderNode = createRuntimeNodeRenderer(registry)
  const node: SchemaNode = { id: 'unknown-1', type: 'unknown', props: {} }
  const vnode = renderNode(node) as VNode
  const fallback = renderedContent(vnode)

  expect(fallback.type).toBe(DefaultRuntimeFallback)
  expect(fallback.props?.node).toBe(node)
})
