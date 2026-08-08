import type { DesignerEngine, DesignerSchema, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { FormSchema } from '@dragcraft/form-generator'
import type { DesignerSession } from '../session/types'
import { createEngine } from '@dragcraft/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { createLegacyDesignerSessionAdapter } from '../session/legacy-designer-session-adapter'
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

function makeContainerMeta(componentProps?: Record<string, unknown> | ((ctx: { values: Record<string, unknown> }) => Record<string, unknown>)): WidgetMeta {
  return {
    ...makeMeta('layout', {
      sections: [{
        title: 'Layout',
        fields: [{
          key: 'variant',
          label: 'Variant',
          component: 'Select',
          bindTo: { scope: 'container', path: 'variant' },
          componentProps,
        }],
      }],
    }),
    container: {
      defaultVariant: 'split',
      variants: {
        split: { title: 'Split fallback', titleKey: 'variant.split', regions: [{ id: 'left', title: 'Left' }] },
        stacked: { title: 'Stacked', regions: [{ id: 'body', title: 'Body' }] },
      },
    },
  }
}

describe('usePropertyBinding', () => {
  let engine: DesignerEngine
  let session: DesignerSession

  beforeEach(() => {
    engine = createEngine()
    engine.registerWidget(makeMeta('text', { sections: [{ title: 'Basic', fields: [] }] }))
    const imported = engine.importSchema(makeSchema([makeNode('a', 'text', { label: 'Hello' })]))
    if (!imported.ok)
      throw new Error(`Test schema rejected: ${imported.diagnostics.map(item => item.code).join(', ')}`)
    session = createLegacyDesignerSessionAdapter(engine)
  })

  it('selectedNode is null when nothing selected', () => {
    const { selectedNode } = usePropertyBinding(session)
    expect(selectedNode.value).toBeNull()
  })

  it('selectedNode reacts to selection changes', () => {
    const { selectedNode } = usePropertyBinding(session)
    engine.store.selectNode('a')
    expect(selectedNode.value).toBeTruthy()
    expect(selectedNode.value!.id).toBe('a')
  })

  it('selectedNode returns null for non-existent node', () => {
    const { selectedNode } = usePropertyBinding(session)
    engine.store.selectNode('missing')
    expect(selectedNode.value).toBeNull()
  })

  it('selectedWidgetMeta returns meta for selected node type', () => {
    const { selectedWidgetMeta } = usePropertyBinding(session)
    engine.store.selectNode('a')
    expect(selectedWidgetMeta.value).toBeTruthy()
    expect(selectedWidgetMeta.value!.type).toBe('text')
  })

  it('selectedWidgetMeta is undefined when no node selected', () => {
    const { selectedWidgetMeta } = usePropertyBinding(session)
    expect(selectedWidgetMeta.value).toBeUndefined()
  })

  it('reads selected-node, material, and document values from the session projection', () => {
    const projectedNode = makeNode('session-node', 'session-text', { label: 'Projected' })
    const projectedMeta = makeMeta('session-text', {
      sections: [{
        title: 'Basic',
        fields: [{ key: 'label', label: 'Label', component: 'Input' }],
      }],
    })
    const legacySession = createLegacyDesignerSessionAdapter(engine)
    const session: DesignerSession = {
      ...legacySession,
      document: {
        ...legacySession.document,
        root: computed(() => ({ id: 'root', type: 'root', props: {}, children: [] })),
        globalConfig: computed(() => ({ theme: 'projected' })),
        getNode: nodeId => nodeId === projectedNode.id ? projectedNode : null,
      },
      materials: {
        ...legacySession.materials,
        get: type => type === projectedNode.type ? projectedMeta : undefined,
        resolveCapability: () => true,
      },
      state: {
        ...legacySession.state,
        selectedNodeId: ref(projectedNode.id),
      },
    }
    const globalConfigSchema: FormSchema = {
      sections: [{
        title: 'Page',
        fields: [{ key: 'theme', label: 'Theme', component: 'Input' }],
      }],
    }

    const binding = usePropertyBinding(session, { globalConfigSchema })

    expect(binding.selectedNode.value).toEqual(projectedNode)
    expect(binding.selectedWidgetMeta.value).toBe(projectedMeta)
    expect(binding.selectedNodeProps.value).toEqual({ label: 'Projected' })
    expect(binding.globalConfigValues.value).toEqual({ theme: 'projected' })
  })

  it('selectedFormSchema returns formSchema from meta', () => {
    const { selectedFormSchema } = usePropertyBinding(session)
    engine.store.selectNode('a')
    expect(selectedFormSchema.value).toBeTruthy()
    expect(selectedFormSchema.value!.sections).toHaveLength(1)
  })

  it('keeps schema-managed property fields enabled and disables variant fields by default', () => {
    const meta = makeContainerMeta()
    meta.authoring = 'schema-managed'
    meta.formSchema.sections[0].fields.unshift({
      key: 'label',
      label: 'Label',
      component: 'Input',
    })
    engine.registerWidget(meta)
    engine.importSchema(makeSchema([{
      id: 'layout',
      type: 'layout',
      props: { label: 'Managed' },
      container: { variant: 'split', regions: { left: [] } },
    }]))
    engine.store.selectNode('layout')

    const { selectedFormSchema } = usePropertyBinding(session)
    const [propertyField, variantField] = selectedFormSchema.value!.sections[0].fields

    expect(propertyField.disabled).toBeUndefined()
    expect(variantField.disabled?.({ values: {} })).toBe(true)
  })

  it('keeps configurable and variantChangeable independent in the property schema', () => {
    const meta = makeContainerMeta()
    meta.authoring = 'schema-managed'
    meta.configurable = false
    meta.variantChangeable = true
    meta.formSchema.sections[0].fields.unshift({
      key: 'label',
      label: 'Label',
      component: 'Input',
    })
    engine.registerWidget(meta)
    engine.importSchema(makeSchema([{
      id: 'layout',
      type: 'layout',
      props: { label: 'Managed' },
      container: { variant: 'split', regions: { left: [] } },
    }]))
    engine.store.selectNode('layout')

    const { selectedFormSchema } = usePropertyBinding(session)
    const [propertyField, variantField] = selectedFormSchema.value!.sections[0].fields

    expect(propertyField.disabled?.({ values: {} })).toBe(true)
    expect(variantField.disabled).toBeUndefined()
  })

  it('reads container variant and derives registered options for the property form', () => {
    engine.registerWidget(makeContainerMeta({ clearable: true, options: [{ label: 'Stale', value: 'stale' }] }))
    engine.importSchema(makeSchema([{
      id: 'layout',
      type: 'layout',
      props: {},
      container: { variant: 'split', regions: { left: [] } },
    }]))
    engine.store.selectNode('layout')

    const binding = usePropertyBinding(session, {
      t: (key, fallback) => key === 'variant.split' ? 'Split' : fallback ?? key,
    })

    expect(binding.selectedNodeProps.value.variant).toBe('split')
    const field = binding.selectedFormSchema.value!.sections[0].fields[0]
    expect(typeof field.componentProps).toBe('function')
    const resolveProps = field.componentProps as (
      ctx: { values: Record<string, unknown> },
    ) => Record<string, unknown>
    expect(resolveProps({ values: {} })).toEqual({
      clearable: true,
      options: [
        { label: 'Split', value: 'split' },
        { label: 'Stacked', value: 'stacked' },
      ],
    })
  })

  it('merges dynamic component props without mutating the registered form schema', () => {
    const originalProps = vi.fn(({ values }: { values: Record<string, unknown> }) => ({
      disabled: values.locked === true,
      options: [{ label: 'Original', value: 'original' }],
    }))
    const meta = makeContainerMeta(originalProps)
    engine.registerWidget(meta)
    engine.importSchema(makeSchema([{
      id: 'layout',
      type: 'layout',
      props: {},
      container: { variant: 'split', regions: { left: [] } },
    }]))
    engine.store.selectNode('layout')

    const { selectedFormSchema } = usePropertyBinding(session)
    const field = selectedFormSchema.value!.sections[0].fields[0]
    const ctx = { values: { locked: true } }

    const resolveProps = field.componentProps as (
      ctx: { values: Record<string, unknown> },
    ) => Record<string, unknown>
    expect(resolveProps(ctx)).toEqual({
      disabled: true,
      options: [
        { label: 'Split fallback', value: 'split' },
        { label: 'Stacked', value: 'stacked' },
      ],
    })
    expect(originalProps).toHaveBeenCalledWith(ctx)
    expect(meta.formSchema.sections[0].fields[0].componentProps).toBe(originalProps)
  })

  it('leaves non-container form fields unchanged', () => {
    const componentProps = { placeholder: 'Title' }
    const meta = makeMeta('plain', {
      sections: [{
        title: 'Basic',
        fields: [{ key: 'title', label: 'Title', component: 'Input', componentProps }],
      }],
    })
    engine.registerWidget(meta)
    engine.importSchema(makeSchema([makeNode('plain', 'plain', { title: 'Hello' })]))
    engine.store.selectNode('plain')

    const { selectedFormSchema } = usePropertyBinding(session)

    expect(selectedFormSchema.value).toEqual(meta.formSchema)
    expect(selectedFormSchema.value!.sections[0].fields[0].componentProps).toEqual(componentProps)
  })

  it('selectedNodeProps returns node props', () => {
    const { selectedNodeProps } = usePropertyBinding(session)
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

    const { selectedNodeProps } = usePropertyBinding(session)

    expect(selectedNodeProps.value.marginTop).toBe(-12)
  })

  it('selectedNodeProps returns empty object when no node selected', () => {
    const { selectedNodeProps } = usePropertyBinding(session)
    expect(selectedNodeProps.value).toEqual({})
  })

  it('handlePropertyChange dispatches node.update', () => {
    const spy = vi.spyOn(session, 'execute')
    engine.store.selectNode('a')
    const { handlePropertyChange } = usePropertyBinding(session)
    handlePropertyChange('label', 'World')
    expect(spy).toHaveBeenCalledWith({
      type: 'node.update',
      nodeId: 'a',
      props: { label: 'World' },
    })
  })

  it('handlePropertyChange dispatches container.change-variant for bound variant fields', () => {
    engine.registerWidget(makeContainerMeta())
    engine.importSchema(makeSchema([{
      id: 'layout',
      type: 'layout',
      props: {},
      container: { variant: 'split', regions: { left: [] } },
    }]))
    const spy = vi.spyOn(session, 'execute')
    engine.store.selectNode('layout')
    const { handlePropertyChange } = usePropertyBinding(session)

    handlePropertyChange('variant', 'stacked')

    expect(spy).toHaveBeenCalledWith({
      type: 'container.change-variant',
      containerId: 'layout',
      variant: 'stacked',
    })
  })

  it('returns structured variant denial metadata to Designer callers', () => {
    engine.registerWidget(makeContainerMeta())
    engine.importSchema(makeSchema([{
      id: 'layout',
      type: 'layout',
      props: {},
      container: { variant: 'split', regions: { left: [] } },
    }]))
    const denial = {
      ok: false as const,
      code: 'MIGRATION_DENIED',
      messageKey: 'container.variant.denied',
      message: 'Choose another layout.',
      details: { variant: 'stacked' },
    }
    vi.spyOn(session, 'execute').mockReturnValue(denial)
    engine.store.selectNode('layout')
    const { handlePropertyChange } = usePropertyBinding(session)

    expect(handlePropertyChange('variant', 'stacked')).toEqual(denial)
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
    const spy = vi.spyOn(session, 'execute')
    engine.store.selectNode('b')
    const { handlePropertyChange } = usePropertyBinding(session)

    handlePropertyChange('marginTop', -16)

    expect(spy).toHaveBeenCalledWith({
      type: 'node.update',
      nodeId: 'b',
      props: {},
      style: { container: { marginTop: -16 } },
    })
  })

  it('handlePropertyChange does nothing when no node selected', () => {
    const spy = vi.spyOn(session, 'execute')
    const { handlePropertyChange } = usePropertyBinding(session)
    handlePropertyChange('label', 'World')
    expect(spy).not.toHaveBeenCalled()
  })

  it('handleGlobalConfigChange dispatches global-config.update', () => {
    const spy = vi.spyOn(session, 'execute')
    const { handleGlobalConfigChange } = usePropertyBinding(session)
    handleGlobalConfigChange('theme', 'dark')
    expect(spy).toHaveBeenCalledWith({
      type: 'global-config.update',
      config: { theme: 'dark' },
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

    const { globalConfigValues } = usePropertyBinding(session, { globalConfigSchema: globalSchema })

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
    const spy = vi.spyOn(session, 'execute')
    const { handleGlobalConfigChange } = usePropertyBinding(session, { globalConfigSchema: globalSchema })

    handleGlobalConfigChange('pageBg', '#f5f5f5')

    expect(spy).toHaveBeenCalledWith({
      type: 'node.update',
      nodeId: 'root',
      props: {},
      style: { surface: { backgroundColor: '#f5f5f5' } },
    })
  })
})
