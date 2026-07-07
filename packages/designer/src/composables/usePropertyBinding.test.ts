import type { DesignerEngine, DesignerSchema, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { FormSchema } from '@dragcraft/form-generator'
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

  it('selectedNodeProps resolves field bindings from node style', () => {
    const styleSchema = {
      sections: [{
        title: 'Box',
        fields: [{
          key: 'marginTop',
          label: 'Margin Top',
          component: 'Input',
          bindTo: { scope: 'node', path: 'style.container.marginTop' },
        }],
      }],
    }
    engine.registerWidget(makeMeta('style-text', styleSchema))
    engine.importSchema(makeSchema([
      { id: 'b', type: 'style-text', props: {}, style: { container: { marginTop: -12 } } },
    ]))
    engine.store.selectNode('b')

    const { selectedNodeProps } = usePropertyBinding(engine)

    expect(selectedNodeProps.value.marginTop).toBe(-12)
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

  it('handlePropertyChange dispatches style patches for bound fields', () => {
    const styleSchema = {
      sections: [{
        title: 'Box',
        fields: [{
          key: 'marginTop',
          label: 'Margin Top',
          component: 'Input',
          bindTo: { scope: 'node', path: 'style.container.marginTop' },
        }],
      }],
    }
    engine.registerWidget(makeMeta('style-text', styleSchema))
    engine.importSchema(makeSchema([{ id: 'b', type: 'style-text', props: {} }]))
    const spy = vi.spyOn(engine, 'execute')
    engine.store.selectNode('b')
    const { handlePropertyChange } = usePropertyBinding(engine)

    handlePropertyChange('marginTop', -16)

    expect(spy).toHaveBeenCalledWith({
      type: CommandType.UPDATE_PROPS,
      payload: { nodeId: 'b', props: {}, style: { container: { marginTop: -16 } } },
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

  it('globalConfigValues resolves schema bindings', () => {
    const globalSchema: FormSchema = {
      sections: [{
        title: 'Page',
        fields: [{
          key: 'pageBg',
          label: 'Page Background',
          component: 'Color',
          bindTo: { scope: 'schema', path: 'root.style.surface.backgroundColor' },
        }],
      }],
    }
    engine.importSchema({
      version: '1.0.0',
      globalConfig: {},
      root: {
        id: 'root',
        type: 'root',
        props: {},
        style: { surface: { backgroundColor: '#fff7e6' } },
        children: [],
      },
    })

    const { globalConfigValues } = usePropertyBinding(engine, { globalConfigSchema: globalSchema })

    expect(globalConfigValues.value.pageBg).toBe('#fff7e6')
  })

  it('handleGlobalConfigChange dispatches root style patches for schema bindings', () => {
    const globalSchema: FormSchema = {
      sections: [{
        title: 'Page',
        fields: [{
          key: 'pageBg',
          label: 'Page Background',
          component: 'Color',
          bindTo: { scope: 'schema', path: 'root.style.surface.backgroundColor' },
        }],
      }],
    }
    const spy = vi.spyOn(engine, 'execute')
    const { handleGlobalConfigChange } = usePropertyBinding(engine, { globalConfigSchema: globalSchema })

    handleGlobalConfigChange('pageBg', '#f5f5f5')

    expect(spy).toHaveBeenCalledWith({
      type: CommandType.UPDATE_PROPS,
      payload: { nodeId: 'root', props: {}, style: { surface: { backgroundColor: '#f5f5f5' } } },
    })
  })
})
