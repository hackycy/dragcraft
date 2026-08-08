import type { DesignerEngine, DesignerSchema, WidgetMeta } from '@dragcraft/legacy-core'
import { CommandType, createEngine } from '@dragcraft/legacy-core'
import { describeDesignerSessionContract } from './designer-session-contract'
import { createLegacyDesignerSessionAdapter } from './legacy-designer-session-adapter'

function createFixture() {
  const engine = createEngine()
  engine.registerWidget({
    type: 'text',
    title: 'Text',
    group: 'basic',
    defaultProps: {},
    formSchema: { sections: [] },
  } satisfies WidgetMeta)
  engine.registerWidget({
    type: 'layout',
    title: 'Layout',
    group: 'layout',
    defaultProps: {},
    formSchema: { sections: [] },
    container: {
      defaultVariant: 'single',
      variants: {
        single: {
          title: 'Single',
          regions: [{ id: 'main', title: 'Main' }],
        },
      },
    },
  } satisfies WidgetMeta)
  const schema: DesignerSchema = {
    version: '1.0.0',
    globalConfig: {},
    root: {
      id: 'root',
      type: 'root',
      props: {},
      children: [
        { id: 'ordinary', type: 'text', props: {} },
        {
          id: 'layout',
          type: 'layout',
          props: {},
          container: {
            variant: 'single',
            regions: { main: [{ id: 'region-child', type: 'text', props: {} }] },
          },
        },
      ],
    },
  }
  expectImport(engine, schema)

  return {
    session: createLegacyDesignerSessionAdapter(engine),
    select: (nodeId: string | null) => engine.store.selectNode(nodeId),
    hover: (nodeId: string | null) => engine.store.hoverNode(nodeId),
    setDragTarget: (nodeId: string | null) => engine.store.setDragTarget(nodeId ? { sourceNodeId: nodeId, widgetType: null } : null),
    addHistoryEntry: () => engine.execute({
      type: CommandType.UPDATE_PROPS,
      payload: { nodeId: 'ordinary', props: { changed: true } },
    }),
  }
}

function expectImport(engine: DesignerEngine, schema: DesignerSchema): void {
  const result = engine.importSchema(schema)
  if (!result.ok)
    throw new Error(`fixture schema rejected: ${result.diagnostics.map(item => item.code).join(', ')}`)
}

describeDesignerSessionContract('Legacy adapter', createFixture)
