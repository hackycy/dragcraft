import type { DocumentSchema } from '@dragcraft/designer'
import { expect, it } from 'vitest'
import { guideRuntimeRegistry } from '.'
import { createGuideSchema } from '../editor/initial-schema'
import { createRuntimeLayoutPlan } from './layout'

it('projects flow, fixed chrome, and layer nodes into separate surfaces', () => {
  const plan = createRuntimeLayoutPlan(createGuideSchema(), guideRuntimeRegistry)

  expect(plan.flow.get('content')?.map(entry => entry.node.id)).toEqual([
    'notice-1',
    'layout-1',
  ])
  expect(plan.chrome.map(entry => entry.node.id)).toEqual(['page-header-1'])
  expect(plan.layers.get('float')?.map(entry => entry.node.id)).toEqual(['floating-action-1'])
  expect(plan.insets['block-start']).toBe('48px')
})

it('uses registry defaults and skips runtime-invisible nodes', () => {
  const schema: DocumentSchema = {
    version: '1',
    globalConfig: {},
    page: { props: {} },
    nodes: [{ id: 'floating-action-2', type: 'floating-action', props: {} }],
    structure: { root: ['floating-action-2'], containers: {} },
  }
  const registry = {
    ...guideRuntimeRegistry,
    'floating-action': {
      ...guideRuntimeRegistry['floating-action'],
      defaultLayout: {
        ...guideRuntimeRegistry['floating-action'].defaultLayout,
        visible: false,
      },
    },
  }

  const plan = createRuntimeLayoutPlan(schema, registry)

  expect(plan.layers.size).toBe(0)
})
