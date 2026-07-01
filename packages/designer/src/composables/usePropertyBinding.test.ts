import type { DesignerEngine, DesignerSchema, SchemaNode, WidgetMeta } from '@dragcraft/core'
import { CommandType, createEngine } from '@dragcraft/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePropertyBinding } from './usePropertyBinding'

function makeNode(id: string, type = 'text', props: Record<string, unknown> = {}): SchemaNode {
  return { id, type, props }
}

function makeMeta(type: string, formSchema = { sections: [] as Array<{ title: string, fields: Array<Record<string, unknown>> }> }): WidgetMeta {
  return { type, title: type, group: 'basic', defaultProps: {}, formSchema } as WidgetMeta
}

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return { version: '1.0.0', globalConfig: { theme: 'light' }, root: { id: 'root', type: 'root', props: {}, children } }
}

describe('usePropertyBinding', () => {
  let engine: DesignerEngine

  beforeEach(() => {
    engine = createEngine({ initialSchema: makeSchema([makeNode('a', 'text', { label: 'Hello' })]) })
    engine.registerWidget(makeMeta('text', { sections: [{ title: 'Basic', fields: [] }] }))
  })

  it('selectedNode is null when nothing selected', () => {
    const { selectedNode } = usePropertyBinding(engine)
    expect(selectedNode.value).toBeNull()
  })

  it('selectedNode reacts to selection changes', () => {
    const { selectedNode } = usePropertyBinding(engine)
    engine.store.selectNode('a')
    expect(selectedNode.value).toBeTruthy()
    expect(selectedNode.value!.id).toBe('a')
  })

  it('selectedNode returns null for non-existent node', () => {
    const { selectedNode } = usePropertyBinding(engine)
    engine.store.selectNode('missing')
    expect(selectedNode.value).toBeNull()
  })

  it('selectedWidgetMeta returns meta for selected node type', () => {
    const { selectedWidgetMeta } = usePropertyBinding(engine)
    engine.store.selectNode('a')
    expect(selectedWidgetMeta.value).toBeTruthy()
    expect(selectedWidgetMeta.value!.type).toBe('text')
  })

  it('selectedWidgetMeta is undefined when no node selected', () => {
    const { selectedWidgetMeta } = usePropertyBinding(engine)
    expect(selectedWidgetMeta.value).toBeUndefined()
  })

  it('selectedFormSchema returns formSchema from meta', () => {
    const { selectedFormSchema } = usePropertyBinding(engine)
    engine.store.selectNode('a')
    expect(selectedFormSchema.value).toBeTruthy()
    expect(selectedFormSchema.value!.sections).toHaveLength(1)
  })

  it('selectedNodeProps returns node props', () => {
    const { selectedNodeProps } = usePropertyBinding(engine)
    engine.store.selectNode('a')
    expect(selectedNodeProps.value).toEqual({ label: 'Hello' })
  })

  it('selectedNodeProps returns empty object when no node selected', () => {
    const { selectedNodeProps } = usePropertyBinding(engine)
    expect(selectedNodeProps.value).toEqual({})
  })

  it('handlePropertyChange dispatches UPDATE_PROPS', () => {
    const spy = vi.spyOn(engine, 'execute')
    engine.store.selectNode('a')
    const { handlePropertyChange } = usePropertyBinding(engine)
    handlePropertyChange('label', 'World')
    expect(spy).toHaveBeenCalledWith({
      type: CommandType.UPDATE_PROPS,
      payload: { nodeId: 'a', props: { label: 'World' } },
    })
  })

  it('handlePropertyChange does nothing when no node selected', () => {
    const spy = vi.spyOn(engine, 'execute')
    const { handlePropertyChange } = usePropertyBinding(engine)
    handlePropertyChange('label', 'World')
    expect(spy).not.toHaveBeenCalled()
  })

  it('handleGlobalConfigChange dispatches SET_GLOBAL_CONFIG', () => {
    const spy = vi.spyOn(engine, 'execute')
    const { handleGlobalConfigChange } = usePropertyBinding(engine)
    handleGlobalConfigChange('theme', 'dark')
    expect(spy).toHaveBeenCalledWith({
      type: CommandType.SET_GLOBAL_CONFIG,
      payload: { config: { theme: 'dark' } },
    })
  })
})
