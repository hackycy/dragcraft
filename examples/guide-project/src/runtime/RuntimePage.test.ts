import type { DocumentSchema } from '@dragcraft/designer'
import type { VNode } from 'vue'
import type { RuntimeRegistry } from './registry'
import { expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { RuntimeColumnContainer } from './RuntimeColumnContainer'
import { createRuntimeDocumentView, createRuntimeNodeRenderer } from './RuntimePage'

const Notice = defineComponent({
  props: { text: String },
  setup: props => () => h('p', props.text),
})
const registry: RuntimeRegistry = {
  'notice': { kind: 'node', component: Notice },
  'column-container': { kind: 'container', component: RuntimeColumnContainer },
}
const schema: DocumentSchema = {
  version: '1',
  globalConfig: {},
  page: { props: {} },
  nodes: [
    { id: 'layout-1', type: 'column-container', props: { gap: 16 } },
    { id: 'notice-1', type: 'notice', props: { text: '运行时公告' } },
  ],
  structure: {
    root: ['layout-1'],
    containers: { 'layout-1': { regions: { content: ['notice-1'] } } },
  },
}

function renderedContent(vnode: VNode): VNode {
  return (vnode.children as VNode[])[0]!
}

it('renders container regions from the autonomous pure-data document contract', () => {
  const renderNode = createRuntimeNodeRenderer(schema, registry)
  const vnode = renderNode('layout-1') as VNode
  const container = renderedContent(vnode)

  expect(container.type).toBe(RuntimeColumnContainer)
  expect((container.props?.regions as Record<string, unknown[]>).content).toHaveLength(1)
  expect(container.props?.node).toMatchObject({ id: 'layout-1', props: { gap: 16 } })
})

it('applies an autonomous consumer mount policy by stable node type', () => {
  const document: DocumentSchema = {
    ...schema,
    nodes: [
      { id: 'header-1', type: 'header', props: {} },
      ...schema.nodes,
      { id: 'action-1', type: 'action', props: {} },
    ],
    structure: {
      ...schema.structure,
      root: ['header-1', 'layout-1', 'action-1'],
    },
  }
  const view = createRuntimeDocumentView(document, {
    ...registry,
    header: { kind: 'node', component: Notice, mount: 'header' },
    action: { kind: 'node', component: Notice, mount: 'overlay' },
  })

  expect(view).toEqual({
    header: ['header-1'],
    document: ['layout-1'],
    overlay: ['action-1'],
  })
})
